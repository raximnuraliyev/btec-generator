// =============================================================================
// BTEC GENERATOR - BRIEF SERVICE
// =============================================================================

import { prisma } from '../lib/prisma';
// AssessmentCriteria type used in runtime JSON parsing
import { z } from 'zod';

// Task block schema
const taskBlockSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().min(1, 'Task description is required'),
});

// Assessment criteria schema (simple string arrays)
const assessmentCriteriaSchema = z.object({
  pass: z.array(z.string()),
  merit: z.array(z.string()),
  distinction: z.array(z.string()),
});

export const createBriefSchema = z.object({
  // Core information
  subjectName: z.string().min(1, 'Subject name is required'),
  unitName: z.string().min(1, 'Unit name is required'),
  unitCode: z.string().min(1, 'Unit code is required'),
  level: z.number().int().min(3).max(6),
  semester: z.enum(['1', '2'], { required_error: 'Semester must be 1 or 2' }),
  
  // Learning content
  learningAims: z.array(z.string()).min(1, 'At least one learning aim is required'),
  vocationalScenario: z.string().min(50, 'Vocational scenario must be at least 50 characters'),
  
  // Tasks
  tasks: z.array(taskBlockSchema).min(1, 'At least one task is required'),
  
  // Assessment criteria
  assessmentCriteria: assessmentCriteriaSchema.refine(
    (data) => data.pass.length > 0,
    { message: 'At least one Pass criterion is required' }
  ),
  
  // Additional requirements
  checklistOfEvidence: z.array(z.string()).optional().default([]),
  sourcesOfInformation: z.array(z.string()).optional().default([]),
  
  // Publishing control
  status: z.enum(['DRAFT', 'PUBLISHED']).optional().default('DRAFT'),
});

export const createBrief = async (
  userId: string,
  data: z.infer<typeof createBriefSchema>
) => {
  // Verify user is ADMIN or TEACHER
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
    throw new Error('Only admins and teachers can create briefs');
  }

  // Check for duplicate brief (same unitCode + level + semester)
  const existingBrief = await prisma.brief.findUnique({
    where: {
      unique_brief: {
        unitCode: data.unitCode,
        level: data.level,
        semester: data.semester,
      },
    },
  });

  if (existingBrief) {
    throw new Error(
      `A brief for ${data.unitCode} Level ${data.level} Semester ${data.semester} already exists`
    );
  }

  const brief = await prisma.brief.create({
    data: {
      subjectName: data.subjectName,
      unitName: data.unitName,
      unitCode: data.unitCode,
      level: data.level,
      semester: data.semester,
      learningAims: data.learningAims,
      vocationalScenario: data.vocationalScenario,
      tasks: data.tasks,
      assessmentCriteria: data.assessmentCriteria,
      checklistOfEvidence: data.checklistOfEvidence,
      sourcesOfInformation: data.sourcesOfInformation,
      status: data.status || 'DRAFT',
      createdById: userId,
    },
  });

  return brief;
};

export const updateBrief = async (
  userId: string,
  briefId: string,
  data: Partial<z.infer<typeof createBriefSchema>>
) => {
  // Verify user is ADMIN or TEACHER and owns the brief
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
    throw new Error('Only admins and teachers can update briefs');
  }

  const brief = await prisma.brief.findUnique({
    where: { id: briefId },
    select: { createdById: true, status: true },
  });

  if (!brief) {
    throw new Error('Brief not found');
  }

  // Teachers can only update their own briefs, admins can update any
  if (user.role === 'TEACHER' && brief.createdById !== userId) {
    throw new Error('You can only update your own briefs');
  }

  // Cannot edit PUBLISHED briefs
  if (brief.status === 'PUBLISHED') {
    throw new Error('Cannot edit published briefs. Create a new version instead.');
  }

  // Build update data dynamically
  const updateData: any = {};
  if (data.subjectName !== undefined) updateData.subjectName = data.subjectName;
  if (data.unitName !== undefined) updateData.unitName = data.unitName;
  if (data.unitCode !== undefined) updateData.unitCode = data.unitCode;
  if (data.level !== undefined) updateData.level = data.level;
  if (data.semester !== undefined) updateData.semester = data.semester;
  if (data.learningAims !== undefined) updateData.learningAims = data.learningAims;
  if (data.vocationalScenario !== undefined) updateData.vocationalScenario = data.vocationalScenario;
  if (data.tasks !== undefined) updateData.tasks = data.tasks;
  if (data.assessmentCriteria !== undefined) updateData.assessmentCriteria = data.assessmentCriteria;
  if (data.checklistOfEvidence !== undefined) updateData.checklistOfEvidence = data.checklistOfEvidence;
  if (data.sourcesOfInformation !== undefined) updateData.sourcesOfInformation = data.sourcesOfInformation;
  if (data.status !== undefined) updateData.status = data.status;

  const updated = await prisma.brief.update({
    where: { id: briefId },
    data: updateData,
  });

  return updated;
};

export const deleteBrief = async (userId: string, briefId: string) => {
  // Verify user is ADMIN or TEACHER and owns the brief
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
    throw new Error('Only admins and teachers can delete briefs');
  }

  const brief = await prisma.brief.findUnique({
    where: { id: briefId },
    select: { createdById: true, status: true, snapshots: { select: { id: true } } },
  });

  if (!brief) {
    throw new Error('Brief not found');
  }

  // Teachers can only delete their own briefs, admins can delete any
  if (user.role === 'TEACHER' && brief.createdById !== userId) {
    throw new Error('You can only delete your own briefs');
  }

  // Cannot delete PUBLISHED briefs that have been used in assignments
  if (brief.status === 'PUBLISHED' && brief.snapshots.length > 0) {
    throw new Error('Cannot delete published briefs that have generated assignments');
  }

  await prisma.brief.delete({
    where: { id: briefId },
  });

  return { success: true };
};

export const getBriefs = async (level?: number) => {
  const where = level ? { level } : {};

  const briefs = await prisma.brief.findMany({
    where,
    include: {
      createdBy: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return briefs;
};

export const getBriefById = async (briefId: string) => {
  const brief = await prisma.brief.findUnique({
    where: { id: briefId },
    include: {
      createdBy: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!brief) {
    throw new Error('Brief not found');
  }

  return brief;
};

/**
 * Get briefs with usage statistics for a teacher's dashboard
 */
export const getBriefsWithStats = async (createdById: string) => {
  // Get all briefs by this teacher
  const briefs = await prisma.brief.findMany({
    where: { createdById },
    orderBy: { createdAt: 'desc' },
  });

  if (briefs.length === 0) {
    return { briefs: [], stats: { totalBriefs: 0, totalAssignments: 0 } };
  }

  const briefIds = briefs.map(b => b.id);

  // Get assignment counts per brief via snapshots
  const assignmentCounts = await prisma.resolvedBriefSnapshot.groupBy({
    by: ['briefId'],
    where: { briefId: { in: briefIds } },
    _count: { id: true },
  });

  // Create a map of briefId -> assignment count
  const countMap = new Map(assignmentCounts.map(c => [c.briefId, c._count.id]));

  // Map briefs with their counts
  const briefsWithStats = briefs.map(brief => ({
    ...brief,
    usageCount: countMap.get(brief.id) || 0,
  }));

  // Sort by usage for popular briefs
  const sortedByUsage = [...briefsWithStats].sort((a, b) => b.usageCount - a.usageCount);

  return {
    briefs: briefsWithStats,
    popularBriefs: sortedByUsage.slice(0, 5),
    stats: {
      totalBriefs: briefs.length,
      totalAssignments: briefsWithStats.reduce((sum, b) => sum + b.usageCount, 0),
    },
  };
};
