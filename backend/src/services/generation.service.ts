import { prisma } from '../lib/prisma';
import { generatePlan, GenerationPlan } from './planner.service';
import { 
  generateContentBlock, 
  generateIntroduction, 
  generateLearningAimContent, 
  generateConclusion, 
  generateReferences,
  generateLearningAimBlock,
  generateCriterionBlock,
  generateCriterionTable,
  generateStructuredReferences
} from './writer.service';
import { deductTokens } from './token.service';
import { generateDocx } from './docx.service';
import { generateWritingGuidance } from './guidance.service';
import { GeneratedContent, ContentSection, CriterionBlock, AtomicContentBlock, Reference, TableData, ImagePlaceholder } from '../types';

/**
 * CANONICAL ASSIGNMENT GENERATION FLOW
 * 
 * PHASE 0 - INPUTS (STRICT)
 * - Published Brief
 * - ResolvedBriefSnapshot (immutable)
 * - User-selected: Language, Target Grade, Include Tables, Include Images
 * 
 * PHASE 1 - PLANNING (NO CONTENT)
 * - Generate generation blueprint
 * - Map criteria to learning aims
 * 
 * PHASE 2 - INTRODUCTION
 * - 1 AI call, 120-180 words
 * - Explain unit topic, reference scenario, mention learning aims
 * 
 * PHASE 3 - LEARNING AIM LOOP
 * - For each Learning Aim:
 *   - Generate aim context block
 *   - Generate each criterion ONE BY ONE
 *   - Insert tables if required
 *   - Insert image placeholders if enabled
 * 
 * PHASE 4 - CONCLUSION
 * - 1 AI call, 120-180 words
 * - Summarize achievements
 * 
 * PHASE 5 - REFERENCES
 * - Generate 3-10 references based on grade
 * 
 * PHASE 6 - DOCX ASSEMBLY
 * - No AI, just formatting
 */

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
    const assessmentCriteria = assignment.snapshot.assessmentCriteria as any;

    // PHASE 0: VALIDATE INPUTS
    console.log(`[ORCHESTRATOR] ========================================`);
    console.log(`[ORCHESTRATOR] PHASE 0: Validating inputs`);
    console.log(`[ORCHESTRATOR] ========================================`);

    // Build brief snapshot for AI with properly structured criteria
    const briefSnapshot = {
      unitName: assignment.snapshot.unitName,
      unitCode: assignment.snapshot.unitCode,
      level: assignment.snapshot.level,
      scenario: assignment.snapshot.vocationalScenario,
      learningAims: assignment.snapshot.learningAims as any[],
      assessmentCriteria: {
        pass: normalizeCriteria(assessmentCriteria?.pass, 'P'),
        merit: normalizeCriteria(assessmentCriteria?.merit, 'M'),
        distinction: normalizeCriteria(assessmentCriteria?.distinction, 'D'),
      },
      checklistOfEvidence: assignment.snapshot.checklistOfEvidence || [],
      sources: assignment.snapshot.sourcesOfInformation || [],
      targetGrade: assignment.grade,
      language: assignment.language,
      options: {
        includeTables: assignment.includeTables,
        includeImages: assignment.includeImages,
      },
    };

    console.log(`[ORCHESTRATOR] Target Grade: ${briefSnapshot.targetGrade}`);
    console.log(`[ORCHESTRATOR] Language: ${briefSnapshot.language}`);
    console.log(`[ORCHESTRATOR] Pass Criteria: ${briefSnapshot.assessmentCriteria.pass.length}`);
    console.log(`[ORCHESTRATOR] Merit Criteria: ${briefSnapshot.assessmentCriteria.merit.length}`);
    console.log(`[ORCHESTRATOR] Distinction Criteria: ${briefSnapshot.assessmentCriteria.distinction.length}`);

    // PHASE 1: PLANNING
    console.log(`[ORCHESTRATOR] ========================================`);
    console.log(`[ORCHESTRATOR] PHASE 1: Generating plan (NO CONTENT)`);
    console.log(`[ORCHESTRATOR] ========================================`);
    const generationPlan = await generatePlan(briefSnapshot, userId, assignmentId);
    console.log(`[ORCHESTRATOR] Plan sections: ${generationPlan.sections?.length || 0}`);

    // PHASE 2-5: CONTENT GENERATION (phased approach)
    console.log(`[ORCHESTRATOR] ========================================`);
    console.log(`[ORCHESTRATOR] PHASES 2-5: Phased Content Generation`);
    console.log(`[ORCHESTRATOR] ========================================`);
    
    // Generate content using the new phase-based approach
    const generatedContent = await generatePhasedContent(
      briefSnapshot,
      generationPlan,
      userId,
      assignmentId
    );

    // Get all blocks for token counting
    const blocks = await prisma.contentBlock.findMany({
      where: { assignmentId },
      orderBy: { blockOrder: 'asc' },
    });

    // Calculate total tokens
    const totalTokens = blocks.reduce((sum, block) => sum + block.tokensUsed, 0);

    // Deduct tokens from user's balance
    await deductTokens(userId, totalTokens, assignmentId, 'ASSIGNMENT_GENERATION');

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // PHASE 6: DOCX ASSEMBLY (NO AI)
    console.log(`[ORCHESTRATOR] ========================================`);
    console.log(`[ORCHESTRATOR] PHASE 6: DOCX Assembly (NO AI)`);
    console.log(`[ORCHESTRATOR] ========================================`);
    console.log('[ORCHESTRATOR] Content structure:', {
      hasIntroduction: !!generatedContent.introduction,
      sectionsCount: generatedContent.sections?.length || 0,
      hasConclusion: !!generatedContent.conclusion,
      referencesCount: generatedContent.references?.length || 0
    });
    
    const unitName = assignment.snapshot?.unitName || 'Assignment';
    const unitCode = assignment.snapshot?.unitCode || 'N/A';
    
    let docxPath: string | undefined;
    try {
      docxPath = await generateDocx(
        assignmentId,
        generatedContent,
        unitName,
        unitCode
      );
      if (!docxPath) {
        throw new Error('generateDocx returned undefined');
      }
      console.log('[ORCHESTRATOR] ✓ DOCX generated successfully:', docxPath);
    } catch (docxError: any) {
      console.error('[ORCHESTRATOR] ✗ CRITICAL: Failed to generate DOCX');
      console.error('[ORCHESTRATOR] Error message:', docxError?.message);
      console.error('[ORCHESTRATOR] Error stack:', docxError?.stack);
      docxPath = undefined;
    }

    // Generate Writing Guidance
    console.log('[ORCHESTRATOR] Generating writing guidance...');
    let writingGuidance: any = null;
    try {
      writingGuidance = await generateWritingGuidance(
        {
          unitName: assignment.snapshot.unitName,
          unitCode: assignment.snapshot.unitCode,
          level: assignment.snapshot.level,
          learningAims: (assignment.snapshot.learningAims as any) || [],
          passCriteria: briefSnapshot.assessmentCriteria.pass,
          meritCriteria: briefSnapshot.assessmentCriteria.merit,
          distinctionCriteria: briefSnapshot.assessmentCriteria.distinction,
          vocationalScenario: assignment.snapshot.vocationalScenario || '',
          targetGrade: assignment.grade,
          language: assignment.language,
        },
        assignmentId
      );
      console.log('[ORCHESTRATOR] ✓ Writing guidance generated successfully');
    } catch (guidanceError: any) {
      console.error('[ORCHESTRATOR] ✗ Failed to generate writing guidance');
      console.error('[ORCHESTRATOR] Guidance error:', guidanceError?.message);
    }

    // Update assignment as completed
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        status: 'COMPLETED',
        content: generatedContent as any,
        guidance: writingGuidance as any,
        totalTokensUsed: totalTokens,
        totalAiCalls: blocks.length + 1,
        generationDurationMs: durationMs,
        completedAt: new Date(),
        docxUrl: docxPath,
      },
    });

    console.log(`[ORCHESTRATOR] ========================================`);
    console.log(`[ORCHESTRATOR] Generation completed in ${durationMs}ms`);
    console.log(`[ORCHESTRATOR] Total tokens: ${totalTokens}`);
    console.log(`[ORCHESTRATOR] ========================================`);

    return {
      success: true,
      assignmentId,
      totalTokens,
      totalBlocks: blocks.length,
      durationMs,
    };
  } catch (error: any) {
    console.error('[ORCHESTRATOR] Generation failed:', error);

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

/**
 * Normalize criteria array - handle both string[] and object[] formats
 */
function normalizeCriteria(criteria: any, prefix: string): Array<{ code: string; description: string }> {
  if (!Array.isArray(criteria)) return [];
  
  return criteria.map((item: any, idx: number) => {
    if (typeof item === 'string') {
      return { code: `${prefix}${idx + 1}`, description: item };
    }
    return {
      code: item.code || `${prefix}${idx + 1}`,
      description: item.description || item.text || String(item)
    };
  });
}

/**
 * PHASED CONTENT GENERATION - ATOMIC APPROACH
 * Each outline item = ONE heading + ONE content block
 * No more "Learning Aim blob writing"
 */
async function generatePhasedContent(
  briefSnapshot: any,
  generationPlan: GenerationPlan,
  userId: string,
  assignmentId: string
): Promise<GeneratedContent> {
  // Check if we have the new atomic outline
  const hasAtomicOutline = generationPlan.documentOutline && generationPlan.documentOutline.length > 0;
  
  if (hasAtomicOutline) {
    console.log(`[GENERATION] Using ATOMIC outline with ${generationPlan.documentOutline!.length} items`);
    return generateFromAtomicOutline(briefSnapshot, generationPlan, userId, assignmentId);
  }

  // Legacy fallback for old plan format
  console.log(`[GENERATION] Using LEGACY plan format (fallback)`);
  return generateLegacyPhasedContent(briefSnapshot, generationPlan, userId, assignmentId);
}

/**
 * NEW ATOMIC GENERATION FLOW
 * Process each outline item in sequence, each becomes ONE content block
 */
async function generateFromAtomicOutline(
  briefSnapshot: any,
  generationPlan: GenerationPlan,
  userId: string,
  assignmentId: string
): Promise<GeneratedContent> {
  let blockOrder = 0;
  let previousSummary = '';
  
  const atomicBlocks: AtomicContentBlock[] = [];
  
  // Build legacy structure for backward compatibility
  let introductionContent = '';
  let conclusionContent = '';
  let references: Reference[] = [];
  const sections: ContentSection[] = [];
  
  // Track current learning aim for grouping
  let currentAimCode = '';
  let currentSection: ContentSection | null = null;
  let tableCounter = 1;
  let figureCounter = 1;

  for (const item of generationPlan.documentOutline!) {
    console.log(`[GENERATION] Processing outline item: ${item.type} ${item.criterionCode || item.aimCode || item.title || ''}`);

    switch (item.type) {
      case 'INTRODUCTION': {
        console.log(`[GENERATION] PHASE 2: Introduction`);
        introductionContent = await generateIntroduction(
          briefSnapshot,
          generationPlan,
          userId,
          assignmentId,
          blockOrder++
        );
        previousSummary = introductionContent.substring(0, 200);
        
        atomicBlocks.push({
          type: 'INTRODUCTION',
          title: 'Introduction',
          content: introductionContent
        });
        break;
      }

      case 'LEARNING_AIM': {
        // Save previous section if exists
        if (currentSection) {
          sections.push(currentSection);
        }
        
        currentAimCode = item.aimCode || 'A';
        console.log(`[GENERATION] PHASE 3: Learning Aim ${currentAimCode}`);
        
        const aimContent = await generateLearningAimBlock(
          briefSnapshot,
          currentAimCode,
          item.aimTitle || `Learning Aim ${currentAimCode}`,
          previousSummary,
          userId,
          assignmentId,
          blockOrder++
        );
        previousSummary = aimContent.substring(0, 200);
        
        atomicBlocks.push({
          type: 'LEARNING_AIM',
          aimCode: currentAimCode,
          aimTitle: item.aimTitle,
          aimContent: aimContent
        });
        
        // Start new section for legacy structure
        currentSection = {
          heading: item.aimTitle || `Learning Aim ${currentAimCode}`,
          content: aimContent,
          criteria: [],
          tables: [],
          images: []
        };
        break;
      }

      case 'CRITERION': {
        const criterionCode = item.criterionCode || 'A.P1';
        const criterionDescription = item.criterionDescription || item.criterionTitle || '';
        
        console.log(`[GENERATION] Generating CRITERION: ${criterionCode}`);
        
        const criterionContent = await generateCriterionBlock(
          briefSnapshot,
          item.aimCode || currentAimCode,
          criterionCode,
          criterionDescription,
          previousSummary,
          userId,
          assignmentId,
          blockOrder++
        );
        previousSummary = criterionContent.substring(0, 200);
        
        // Check if this criterion needs a table
        let table: TableData | undefined;
        const tableReq = (generationPlan.tablesRequired || []).find(
          (t: any) => t.criterionCode === criterionCode
        );
        if (tableReq && briefSnapshot.options.includeTables) {
          table = await generateCriterionTable(
            briefSnapshot,
            criterionCode,
            criterionDescription,
            tableReq.tableType || 'Comparison',
            userId,
            assignmentId,
            blockOrder++
          );
          table.caption = `Table ${tableCounter}. ${table.caption}`;
          tableCounter++;
        }
        
        // Check if this criterion needs an image
        let image: ImagePlaceholder | undefined;
        const imageReq = (generationPlan.imagesSuggested || []).find(
          (i: any) => i.criterionCode === criterionCode
        );
        if (imageReq && briefSnapshot.options.includeImages) {
          image = {
            description: imageReq.imageType || 'Diagram',
            figureNumber: figureCounter,
            caption: `Figure ${figureCounter}. ${imageReq.imageType || 'Illustrative diagram'}`
          };
          figureCounter++;
        }
        
        atomicBlocks.push({
          type: 'CRITERION',
          aimCode: item.aimCode || currentAimCode,
          criterionCode,
          criterionTitle: item.criterionTitle,
          criterionContent,
          table,
          image
        });
        
        // Add to current section for legacy structure
        if (currentSection) {
          currentSection.content += `\n\n${criterionContent}`;
          currentSection.criteria = currentSection.criteria || [];
          currentSection.criteria.push({
            code: criterionCode,
            content: criterionContent,
            description: criterionDescription
          });
          if (table) {
            currentSection.tables = currentSection.tables || [];
            currentSection.tables.push(table);
          }
          if (image) {
            currentSection.images = currentSection.images || [];
            currentSection.images.push(image);
          }
        }
        break;
      }

      case 'CONCLUSION': {
        // Save final section
        if (currentSection) {
          sections.push(currentSection);
          currentSection = null;
        }
        
        console.log(`[GENERATION] PHASE 4: Conclusion`);
        conclusionContent = await generateConclusion(
          briefSnapshot,
          generationPlan,
          previousSummary,
          userId,
          assignmentId,
          blockOrder++
        );
        
        atomicBlocks.push({
          type: 'CONCLUSION',
          title: 'Conclusion',
          content: conclusionContent
        });
        break;
      }

      case 'REFERENCES': {
        console.log(`[GENERATION] PHASE 5: References`);
        references = await generateStructuredReferences(
          briefSnapshot,
          briefSnapshot.targetGrade,
          userId,
          assignmentId,
          blockOrder++
        );
        
        atomicBlocks.push({
          type: 'REFERENCES',
          title: 'References',
          references
        });
        break;
      }
    }
  }

  // Ensure final section is saved
  if (currentSection) {
    sections.push(currentSection);
  }

  console.log(`[GENERATION] Atomic generation complete: ${atomicBlocks.length} blocks, ${sections.length} sections`);

  return {
    introduction: introductionContent,
    sections,
    conclusion: conclusionContent,
    references,
    atomicBlocks
  };
}

/**
 * LEGACY PHASED CONTENT GENERATION (backward compatibility)
 */
async function generateLegacyPhasedContent(
  briefSnapshot: any,
  generationPlan: any,
  userId: string,
  assignmentId: string
): Promise<GeneratedContent> {
  let blockOrder = 0;
  let previousSummary = '';

  // Determine which criteria to include based on target grade
  const targetGrade = briefSnapshot.targetGrade;
  let criteriaToGenerate: any[] = [...briefSnapshot.assessmentCriteria.pass];
  
  if (targetGrade === 'MERIT' || targetGrade === 'DISTINCTION') {
    criteriaToGenerate = [...criteriaToGenerate, ...briefSnapshot.assessmentCriteria.merit];
  }
  
  if (targetGrade === 'DISTINCTION') {
    criteriaToGenerate = [...criteriaToGenerate, ...briefSnapshot.assessmentCriteria.distinction];
  }

  console.log(`[GENERATION] Criteria to generate for ${targetGrade}: ${criteriaToGenerate.length}`);

  // PHASE 2: INTRODUCTION
  console.log(`[GENERATION] PHASE 2: Introduction (120-180 words)`);
  const introductionContent = await generateIntroduction(
    briefSnapshot,
    generationPlan,
    userId,
    assignmentId,
    blockOrder++
  );
  previousSummary = introductionContent.substring(0, 200);

  // PHASE 3: LEARNING AIM SECTIONS
  console.log(`[GENERATION] PHASE 3: Learning Aim Sections`);
  const sections: ContentSection[] = [];

  for (const section of (generationPlan.sections || [])) {
    console.log(`[GENERATION] Processing section: ${section.title}`);
    
    // Generate aim context block
    const aimContextContent = await generateLearningAimContent(
      briefSnapshot,
      generationPlan,
      section,
      previousSummary,
      userId,
      assignmentId,
      blockOrder++
    );
    previousSummary = aimContextContent.substring(0, 200);

    // Build section content starting with aim context
    let sectionContent = aimContextContent;
    const sectionTables: any[] = [];
    const sectionImages: any[] = [];
    const sectionCriteria: CriterionBlock[] = [];

    // Generate each criterion ONE BY ONE
    for (const criterionCode of (section.coversCriteria || [])) {
      const criterion = findCriterion(briefSnapshot.assessmentCriteria, criterionCode);
      if (!criterion) {
        console.warn(`[GENERATION] Criterion ${criterionCode} not found, skipping`);
        continue;
      }

      // Get learning aim letter from section (e.g., "A", "B", "C")
      const aimLetter = section.learningAim || section.id || 'A';
      // Create full criterion code with aim letter prefix (e.g., "A.P1", "B.M2")
      const fullCriterionCode = `${aimLetter}.${criterion.code}`;

      console.log(`[GENERATION] Generating criterion: ${fullCriterionCode}`);
      
      const criterionContent = await generateContentBlock(
        briefSnapshot,
        generationPlan,
        {
          sectionId: section.id,
          criterionCode: fullCriterionCode,
          criterionDescription: criterion.description,
          previousContentSummary: previousSummary,
        },
        userId,
        assignmentId,
        blockOrder++
      );
      
      // Add to criteria array for structured output
      sectionCriteria.push({
        code: fullCriterionCode,
        content: criterionContent
      });
      
      sectionContent += `\n\n${criterionContent}`;
      previousSummary = criterionContent.substring(0, 200);
    }

    // Add tables if required (CONDITIONAL)
    // Generate tables based on the criteria covered in this section
    if (briefSnapshot.options.includeTables) {
      // First check if planner defined tables for this section
      const sectionTableDefs = (generationPlan.tables || []).filter(
        (t: any) => t.placementAfterSectionId === section.id
      );
      
      if (sectionTableDefs.length > 0) {
        for (const tableDef of sectionTableDefs) {
          sectionTables.push({
            caption: tableDef.title || `Comparison Table for ${section.title}`,
            headers: ['Aspect', 'Description', 'Application to Scenario'],
            rows: [
              ['Key Feature 1', 'Description of this feature', 'How it applies in the vocational context'],
              ['Key Feature 2', 'Description of this feature', 'How it applies in the vocational context'],
              ['Key Feature 3', 'Description of this feature', 'How it applies in the vocational context'],
            ]
          });
        }
      } else {
        // Auto-generate a table for each learning aim section
        sectionTables.push({
          caption: `Key Concepts for ${section.title}`,
          headers: ['Concept', 'Definition', 'Application'],
          rows: [
            ['Concept 1', 'Definition of this concept', 'How it applies to the scenario'],
            ['Concept 2', 'Definition of this concept', 'How it applies to the scenario'],
            ['Concept 3', 'Definition of this concept', 'How it applies to the scenario'],
          ]
        });
      }
    }

    // Add image placeholders if enabled (CONDITIONAL)
    if (briefSnapshot.options.includeImages) {
      // First check if planner defined images for this section
      const sectionImageDefs = (generationPlan.images || []).filter(
        (i: any) => i.placementAfterSectionId === section.id
      );
      
      if (sectionImageDefs.length > 0) {
        for (const imageDef of sectionImageDefs) {
          sectionImages.push({
            description: imageDef.caption
          });
        }
      } else {
        // Auto-generate an image placeholder for each learning aim section
        sectionImages.push({
          description: `Diagram illustrating key concepts from ${section.title}`
        });
      }
    }

    console.log(`[GENERATION] Section ${section.title}: ${sectionCriteria.length} criteria, ${sectionTables.length} tables, ${sectionImages.length} images`);

    sections.push({
      heading: section.title,
      content: sectionContent,
      criteria: sectionCriteria.length > 0 ? sectionCriteria : undefined,
      tables: sectionTables.length > 0 ? sectionTables : undefined,
      images: sectionImages.length > 0 ? sectionImages : undefined,
    });
  }

  // PHASE 4: CONCLUSION
  console.log(`[GENERATION] PHASE 4: Conclusion (120-180 words)`);
  const conclusionContent = await generateConclusion(
    briefSnapshot,
    generationPlan,
    previousSummary,
    userId,
    assignmentId,
    blockOrder++
  );

  // PHASE 5: REFERENCES
  console.log(`[GENERATION] PHASE 5: References (Oxford style)`);
  const references = await generateReferences(
    briefSnapshot,
    targetGrade,
    userId,
    assignmentId,
    blockOrder++
  );

  return {
    introduction: introductionContent,
    sections,
    conclusion: conclusionContent,
    references,
  };
}

/**
 * Find criterion by code across all grade levels
 */
function findCriterion(assessmentCriteria: any, code: string): any {
  const allCriteria = [
    ...(assessmentCriteria.pass || []),
    ...(assessmentCriteria.merit || []),
    ...(assessmentCriteria.distinction || []),
  ];

  return allCriteria.find((c: any) => 
    c.code === code || 
    c.code?.toUpperCase() === code?.toUpperCase() ||
    c.code?.replace(/\./g, '') === code?.replace(/\./g, '')
  );
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
