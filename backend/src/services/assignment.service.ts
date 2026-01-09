import { Grade, UserRole, Language } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { InputFieldDefinition, StudentInputData, StudentProfileSnapshot } from '../types';

/**
 * Check if user's plan allows the selected grade
 */
async function validatePlanForGrade(userId: string, grade: Grade): Promise<void> {
  // Get user with role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // VIP and ADMIN have unlimited access
  if (user?.role === 'VIP' || user?.role === 'ADMIN') {
    return;
  }

  // Get user's token plan
  const tokenPlan = await prisma.tokenPlan.findUnique({
    where: { userId },
  });

  if (!tokenPlan) {
    throw new Error('No active plan found. Please purchase a plan to generate assignments.');
  }

  // Check if plan has expired
  if (tokenPlan.expiresAt && new Date() > tokenPlan.expiresAt) {
    throw new Error('Your plan has expired. Please purchase a new plan to continue generating assignments.');
  }

  // Check if plan has enough tokens
  if (tokenPlan.tokensRemaining <= 0 && tokenPlan.planType !== 'UNLIMITED') {
    throw new Error('Insufficient tokens. Please purchase more tokens to generate assignments.');
  }

  // Check if user has assignments remaining (for paid plans)
  if (tokenPlan.assignmentsAllowed > 0 && tokenPlan.assignmentsUsed >= tokenPlan.assignmentsAllowed) {
    throw new Error(`You have reached your assignment limit (${tokenPlan.assignmentsAllowed}). Please upgrade your plan.`);
  }

  // Check if grade is allowed by the plan
  const allowedGrades = tokenPlan.allowedGrades || [];
  if (allowedGrades.length > 0 && !allowedGrades.includes(grade)) {
    const planName = tokenPlan.planType === 'BASIC' ? 'Pass Only' :
                     tokenPlan.planType === 'PRO' ? 'Pass + Merit' :
                     tokenPlan.planType === 'UNLIMITED' ? 'All Grades' : 'Current';
    throw new Error(`Your ${planName} plan does not allow ${grade} grade assignments. Allowed grades: ${allowedGrades.join(', ')}`);
  }

  // FREE plan restrictions
  if (tokenPlan.planType === 'FREE') {
    throw new Error('FREE plan does not allow assignment generation. Please purchase a plan.');
  }
}

/**
 * Increment assignments used count after successful creation
 */
async function incrementAssignmentsUsed(userId: string): Promise<void> {
  await prisma.tokenPlan.update({
    where: { userId },
    data: {
      assignmentsUsed: { increment: 1 },
    },
  });
}

/**
 * Create assignment in DRAFT status
 * Student must fill required inputs before generation can start
 */
export const createAssignment = async (
  userId: string,
  briefId: string,
  grade: Grade,
  language: Language,
  includeImages: boolean,
  includeTables: boolean
) => {
  // Validate user's plan allows this grade
  await validatePlanForGrade(userId, grade);

  // Check student profile
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error('Student profile required before generating assignments. Please complete your academic profile.');
  }

  // Check user role
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Teachers cannot generate assignments
  if (user.role === UserRole.TEACHER) {
    throw new Error('Teachers are not allowed to generate assignments');
  }

  // Get brief
  const brief = await prisma.brief.findUnique({
    where: { id: briefId },
  });

  if (!brief) {
    throw new Error('Brief not found');
  }

  // Create student profile snapshot for personalisation
  const studentProfileSnapshot: StudentProfileSnapshot = {
    fullName: profile.fullName,
    universityName: profile.universityName,
    faculty: profile.faculty,
    groupName: profile.groupName,
    city: profile.city,
    academicYear: profile.academicYear || undefined,
  };

  // Create immutable snapshot (includes required inputs schema)
  const snapshot = await prisma.resolvedBriefSnapshot.create({
    data: {
      briefId: brief.id,
      subjectName: brief.subjectName,
      unitName: brief.unitName,
      unitCode: brief.unitCode,
      level: brief.level,
      semester: brief.semester,
      learningAims: brief.learningAims as any,
      vocationalScenario: brief.vocationalScenario,
      tasks: brief.tasks as any,
      assessmentCriteria: brief.assessmentCriteria as any,
      checklistOfEvidence: brief.checklistOfEvidence as any,
      sourcesOfInformation: brief.sourcesOfInformation as any,
      requiredInputs: (brief as any).requiredInputs as any,
      language,
      includeImages,
      includeTables,
    },
  });

  // Create assignment in DRAFT status
  // Student inputs will be added before generation starts
  const assignment = await prisma.assignment.create({
    data: {
      userId,
      snapshotId: snapshot.id,
      grade,
      language,
      includeImages,
      includeTables,
      studentProfileSnapshot: studentProfileSnapshot as any,
      status: 'DRAFT',
    },
    include: {
      snapshot: true,
    },
  });

  // Increment assignments used count
  await incrementAssignmentsUsed(userId);

  return assignment;
};

/**
 * Save student inputs for an assignment
 * Validates inputs against the brief's requiredInputs schema
 */
export const saveStudentInputs = async (
  assignmentId: string,
  userId: string,
  inputs: StudentInputData
) => {
  // Get assignment with snapshot
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { snapshot: true },
  });

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  if (assignment.userId !== userId) {
    throw new Error('Unauthorized access to assignment');
  }

  if (assignment.status !== 'DRAFT') {
    throw new Error('Cannot modify inputs after generation has started');
  }

  // Validate inputs against schema
  const requiredInputs = (assignment as any).snapshot?.requiredInputs as InputFieldDefinition[] | null;
  
  if (requiredInputs && requiredInputs.length > 0) {
    const validationErrors = validateStudentInputs(inputs, requiredInputs);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid inputs: ${validationErrors.join(', ')}`);
    }
  }

  // Save inputs
  const updatedAssignment = await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      studentInputs: inputs as any,
      studentInputsCompletedAt: new Date(),
    },
    include: { snapshot: true },
  });

  return updatedAssignment;
};

/**
 * Validate student inputs against the required inputs schema
 */
function validateStudentInputs(
  inputs: StudentInputData,
  schema: InputFieldDefinition[]
): string[] {
  const errors: string[] = [];

  for (const field of schema) {
    const value = inputs[field.id];

    // Check required fields
    if (field.required) {
      if (value === undefined || value === null || value === '') {
        errors.push(`${field.label} is required`);
        continue;
      }
      if (Array.isArray(value) && value.length === 0) {
        errors.push(`${field.label} requires at least one item`);
        continue;
      }
    }

    // Skip validation if value is empty and not required
    if (value === undefined || value === null || value === '') {
      continue;
    }

    // Type-specific validation
    switch (field.type) {
      case 'text':
      case 'textarea':
        if (typeof value !== 'string') {
          errors.push(`${field.label} must be text`);
        } else {
          if (field.minLength && value.length < field.minLength) {
            errors.push(`${field.label} must be at least ${field.minLength} characters`);
          }
          if (field.maxLength && value.length > field.maxLength) {
            errors.push(`${field.label} must not exceed ${field.maxLength} characters`);
          }
        }
        break;

      case 'select':
        if (typeof value !== 'string') {
          errors.push(`${field.label} must be a single selection`);
        } else if (field.options && !field.options.includes(value)) {
          errors.push(`${field.label} must be one of: ${field.options.join(', ')}`);
        }
        break;

      case 'multiselect':
        if (!Array.isArray(value)) {
          errors.push(`${field.label} must be an array of selections`);
        } else if (field.options) {
          const invalidOptions = value.filter(v => !field.options!.includes(v as string));
          if (invalidOptions.length > 0) {
            errors.push(`${field.label} contains invalid options`);
          }
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${field.label} must be an array`);
        } else {
          if (field.minItems && value.length < field.minItems) {
            errors.push(`${field.label} requires at least ${field.minItems} items`);
          }
          if (field.maxItems && value.length > field.maxItems) {
            errors.push(`${field.label} must not exceed ${field.maxItems} items`);
          }
        }
        break;

      case 'number':
        if (typeof value !== 'number') {
          errors.push(`${field.label} must be a number`);
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${field.label} must be yes or no`);
        }
        break;
    }
  }

  return errors;
}

/**
 * Check if assignment has all required inputs completed
 */
export const hasCompletedInputs = (assignment: any): boolean => {
  const requiredInputs = assignment.snapshot?.requiredInputs as InputFieldDefinition[] | null;
  
  // If no required inputs defined, consider complete
  if (!requiredInputs || requiredInputs.length === 0) {
    return true;
  }

  // Check if student inputs exist and completed
  if (!assignment.studentInputs || !assignment.studentInputsCompletedAt) {
    return false;
  }

  // Validate all required fields are filled
  const inputs = assignment.studentInputs as StudentInputData;
  for (const field of requiredInputs) {
    if (field.required) {
      const value = inputs[field.id];
      if (value === undefined || value === null || value === '') {
        return false;
      }
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Legacy function for backward compatibility
 * Creates assignment AND starts generation (for briefs without required inputs)
 */
export const generateAssignment = async (
  userId: string,
  briefId: string,
  grade: Grade,
  language: Language,
  includeImages: boolean,
  includeTables: boolean
) => {
  return createAssignment(userId, briefId, grade, language, includeImages, includeTables);
};

// NOTE: Legacy parsing function removed - generation now uses generation.service.ts with ContentBlock pattern

export const getAssignment = async (assignmentId: string, userId: string) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      snapshot: true,
    },
  });

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  if (assignment.userId !== userId) {
    throw new Error('Unauthorized access to assignment');
  }

  return assignment;
};

export const getUserAssignments = async (userId: string) => {
  const assignments = await prisma.assignment.findMany({
    where: { userId },
    include: {
      snapshot: true, // Include all snapshot fields including assessmentCriteria and learningAims
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return assignments;
};

// Abuse detection moved to admin service
// const detectAbuse = async (userId: string): Promise<void> => { ... };
