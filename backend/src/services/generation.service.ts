import { prisma } from '../lib/prisma';
import { generatePlan } from './planner.service';
import { generateAllBlocks } from './writer.service';
import { deductTokens } from './token.service';

export async function startGeneration(assignmentId: string, userId: string) {
  // Get assignment with snapshot
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      snapshot: true,
      user: true,
    },
  });

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  if (assignment.userId !== userId) {
    throw new Error('Unauthorized');
  }

  if (assignment.status !== 'DRAFT') {
    throw new Error('Assignment already generating or completed');
  }

  // Update status to GENERATING
  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { status: 'GENERATING' },
  });

  try {
    const startTime = Date.now();

    // Build brief snapshot for AI
    const briefSnapshot = {
      unitName: assignment.snapshot.unitName,
      unitCode: assignment.snapshot.unitCode,
      level: assignment.snapshot.level,
      scenario: assignment.snapshot.vocationalScenario,
      learningAims: assignment.snapshot.learningAims,
      assessmentCriteria: assignment.snapshot.assessmentCriteria,
      checklistOfEvidence: assignment.snapshot.checklistOfEvidence || [],
      sources: assignment.snapshot.sourcesOfInformation || [],
      targetGrade: assignment.grade,
      language: assignment.language,
      options: {
        includeTables: assignment.includeTables,
        includeImages: assignment.includeImages,
      },
    };

    console.log(`[ORCHESTRATOR] Starting generation for assignment ${assignmentId}`);

    // Step 1: Generate plan
    console.log('[ORCHESTRATOR] Step 1: Generating plan...');
    const generationPlan = await generatePlan(briefSnapshot, userId, assignmentId);

    // Step 2: Generate all content blocks
    console.log('[ORCHESTRATOR] Step 2: Generating content blocks...');
    await generateAllBlocks(briefSnapshot, generationPlan, userId, assignmentId);

    // Step 3: Assemble content from blocks
    console.log('[ORCHESTRATOR] Step 3: Assembling content...');
    const blocks = await prisma.contentBlock.findMany({
      where: { assignmentId },
      orderBy: { blockOrder: 'asc' },
    });

    const assembledContent = {
      sections: blocks.map((block) => ({
        id: block.sectionId,
        criterionCode: block.criterionCode,
        content: block.content,
        tokensUsed: block.tokensUsed,
      })),
      totalBlocks: blocks.length,
    };

    // Calculate total tokens
    const totalTokens = blocks.reduce((sum, block) => sum + block.tokensUsed, 0);

    // Deduct tokens from user's balance
    await deductTokens(userId, totalTokens, assignmentId, 'ASSIGNMENT_GENERATION');

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Update assignment as completed
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        status: 'COMPLETED',
        content: assembledContent as any,
        totalTokensUsed: totalTokens,
        totalAiCalls: blocks.length + 1, // +1 for planner
        generationDurationMs: durationMs,
        completedAt: new Date(),
      },
    });

    console.log(
      `[ORCHESTRATOR] Generation completed in ${durationMs}ms, ${totalTokens} tokens used`
    );

    return {
      success: true,
      assignmentId,
      totalTokens,
      totalBlocks: blocks.length,
      durationMs,
    };
  } catch (error: any) {
    console.error('[ORCHESTRATOR] Generation failed:', error);

    // Update assignment as failed
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        status: 'FAILED',
        error: error.message || 'Unknown error',
      },
    });

    throw error;
  }
}

export async function getGenerationStatus(assignmentId: string, userId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      generationPlan: true,
      contentBlocks: {
        select: {
          id: true,
          sectionId: true,
          criterionCode: true,
          blockOrder: true,
          tokensUsed: true,
          generatedAt: true,
        },
        orderBy: { blockOrder: 'asc' },
      },
    },
  });

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  if (assignment.userId !== userId) {
    throw new Error('Unauthorized');
  }

  return {
    id: assignment.id,
    status: assignment.status,
    totalTokensUsed: assignment.totalTokensUsed,
    totalAiCalls: assignment.totalAiCalls,
    generationDurationMs: assignment.generationDurationMs,
    error: assignment.error,
    hasPlan: !!assignment.generationPlan,
    blocksGenerated: assignment.contentBlocks.length,
    contentBlocks: assignment.contentBlocks,
    createdAt: assignment.createdAt,
    completedAt: assignment.completedAt,
  };
}

export async function getAssignmentContent(assignmentId: string, userId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      snapshot: true,
      generationPlan: true,
      contentBlocks: {
        orderBy: { blockOrder: 'asc' },
      },
    },
  });

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  if (assignment.userId !== userId) {
    throw new Error('Unauthorized');
  }

  return {
    assignment: {
      id: assignment.id,
      language: assignment.language,
      grade: assignment.grade,
      status: assignment.status,
      totalTokensUsed: assignment.totalTokensUsed,
      completedAt: assignment.completedAt,
    },
    brief: {
      unitName: assignment.snapshot.unitName,
      unitCode: assignment.snapshot.unitCode,
      level: assignment.snapshot.level,
    },
    plan: assignment.generationPlan?.planData,
    blocks: assignment.contentBlocks.map((block) => ({
      id: block.id,
      sectionId: block.sectionId,
      criterionCode: block.criterionCode,
      content: block.content,
      blockOrder: block.blockOrder,
    })),
  };
}
