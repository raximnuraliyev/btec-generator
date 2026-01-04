import { Grade, UserRole, Language } from '@prisma/client';
import { prisma } from '../lib/prisma';

export const generateAssignment = async (
  userId: string,
  briefId: string,
  grade: Grade,
  language: Language,
  includeImages: boolean,
  includeTables: boolean
) => {
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

  // Create immutable snapshot
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
      language,
      includeImages,
      includeTables,
    },
  });

  // Create assignment in DRAFT status
  // Generation will happen via startGeneration() orchestrator
  const assignment = await prisma.assignment.create({
    data: {
      userId,
      snapshotId: snapshot.id,
      grade,
      language,
      includeImages,
      includeTables,
      status: 'DRAFT',
    },
    include: {
      snapshot: true,
    },
  });

  return assignment;
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
