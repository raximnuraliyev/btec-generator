import OpenAI from 'openai';
import { prisma } from '../lib/prisma';
import { logAIUsage } from './admin.service';
import { LANGUAGE_CONFIGS } from '../utils/language';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const WRITER_MODEL = process.env.AI_MODEL || 'qwen/qwen-2.5-72b-instruct:free';

interface BriefSnapshot {
  unitName: string;
  unitCode: string;
  level: number;
  scenario: string;
  learningAims: any[];
  assessmentCriteria: any;
  language: string;
}

interface GenerationPlan {
  introduction: any;
  sections: any[];
  tables: any[];
  images: any[];
  conclusion: any;
  references: any;
}

interface WritingTask {
  sectionId: string;
  criterionCode: string | null;
  criterionDescription: string | null;
  previousContentSummary: string;
}

const WRITER_SYSTEM_PROMPT = `You are BTEC_ASSIGNMENT_WRITER, a controlled academic writing model.

You write ONLY ONE CONTENT BLOCK AT A TIME, strictly bound to a specific criterion or section.

You MUST NOT:
- Invent criteria
- Skip criteria
- Repeat content already written
- Reference criteria not assigned to you
- Change academic meaning of the criterion
- Write references unless explicitly asked

You MUST:
- Follow the locked brief snapshot
- Follow the planner output exactly
- Maintain continuity with previously generated blocks
- Write in the requested language
- Use formal academic tone
- Teach and explain clearly (educational purpose)

WRITING RULES:
- Font: Times New Roman
- Size: 14
- Spacing: 1.5
- No emojis
- No bold text in body
- No headings unless instructed

CRITERION-SPECIFIC RULES:

PASS:
- Explain concepts clearly
- Demonstrate understanding
- Use examples

MERIT:
- Analyze
- Compare
- Justify decisions

DISTINCTION:
- Evaluate
- Critically assess
- Link theory to impact and quality

OUTPUT RULES (STRICT):
- Output PLAIN TEXT ONLY
- No headings
- No bullet points unless explicitly requested
- No references section
- No tables
- No images
- No markdown

Your output will be stored as a single ContentBlock.

FAILURE CONDITIONS:
If the criterion code does not exist in the brief snapshot, output:
ERROR: INVALID_CRITERION

If the task attempts to regenerate content already written, output:
ERROR: DUPLICATE_GENERATION

FINAL COMMAND:
Write ONLY the content for the current task.
Do NOT explain what you are doing.
Do NOT mention criteria codes explicitly in the text.
Do NOT exceed the academic scope of the criterion.`;

export async function generateContentBlock(
  briefSnapshot: BriefSnapshot,
  generationPlan: GenerationPlan,
  task: WritingTask,
  userId: string,
  assignmentId: string,
  blockOrder: number
): Promise<string> {
  const language = briefSnapshot.language || 'en';
  const languageInstructions = LANGUAGE_CONFIGS[language]?.academicInstructions || '';

  const userPrompt = `BRIEF SNAPSHOT:
${JSON.stringify(briefSnapshot, null, 2)}

GENERATION PLAN:
${JSON.stringify(generationPlan, null, 2)}

CURRENT TASK:
Section ID: ${task.sectionId}
Criterion Code: ${task.criterionCode || 'N/A'}
Criterion Description: ${task.criterionDescription || 'N/A'}

PREVIOUS CONTENT SUMMARY:
${task.previousContentSummary || 'This is the first block.'}

LANGUAGE: ${language}

LANGUAGE-SPECIFIC INSTRUCTIONS:
${languageInstructions}

Write the content for this task now.`;

  console.log(`[WRITER] Generating block ${blockOrder} for assignment ${assignmentId}`);

  const completion = await openrouter.chat.completions.create({
    model: WRITER_MODEL,
    messages: [
      { role: 'system', content: WRITER_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error('No content from writer model');
  }

  // Check for errors
  if (content.startsWith('ERROR:')) {
    throw new Error(content);
  }

  // Log AI usage
  await logAIUsage({
    assignmentId,
    userId,
    userRole: 'USER',
    aiProvider: 'openrouter',
    aiModel: WRITER_MODEL,
    promptTokens: completion.usage?.prompt_tokens || 0,
    completionTokens: completion.usage?.completion_tokens || 0,
    totalTokens: completion.usage?.total_tokens || 0,
    purpose: 'WRITER',
  });

  // Save content block
  await prisma.contentBlock.create({
    data: {
      assignmentId,
      sectionId: task.sectionId,
      criterionCode: task.criterionCode,
      blockOrder,
      content,
      tokensUsed: completion.usage?.total_tokens || 0,
    },
  });

  console.log(`[WRITER] Block ${blockOrder} generated successfully`);
  return content;
}

export async function generateAllBlocks(
  briefSnapshot: BriefSnapshot,
  generationPlan: GenerationPlan,
  userId: string,
  assignmentId: string
): Promise<void> {
  let blockOrder = 0;
  let previousSummary = '';

  // Introduction
  if (generationPlan.introduction) {
    const content = await generateContentBlock(
      briefSnapshot,
      generationPlan,
      {
        sectionId: 'introduction',
        criterionCode: null,
        criterionDescription: null,
        previousContentSummary: previousSummary,
      },
      userId,
      assignmentId,
      blockOrder++
    );
    previousSummary = content.substring(0, 200);
  }

  // Sections (ordered by generationOrder)
  const sortedSections = [...generationPlan.sections].sort(
    (a, b) => a.generationOrder - b.generationOrder
  );

  for (const section of sortedSections) {
    for (const criterionCode of section.coversCriteria) {
      // Find criterion description
      const criterion = findCriterion(briefSnapshot.assessmentCriteria, criterionCode);

      const content = await generateContentBlock(
        briefSnapshot,
        generationPlan,
        {
          sectionId: section.id,
          criterionCode,
          criterionDescription: criterion?.description || null,
          previousContentSummary: previousSummary,
        },
        userId,
        assignmentId,
        blockOrder++
      );

      previousSummary = content.substring(0, 200);
    }
  }

  // Conclusion
  if (generationPlan.conclusion) {
    await generateContentBlock(
      briefSnapshot,
      generationPlan,
      {
        sectionId: 'conclusion',
        criterionCode: null,
        criterionDescription: null,
        previousContentSummary: previousSummary,
      },
      userId,
      assignmentId,
      blockOrder++
    );
  }

  console.log(`[WRITER] All ${blockOrder} blocks generated`);
}

function findCriterion(assessmentCriteria: any, code: string): any {
  const allCriteria = [
    ...(assessmentCriteria.pass || []),
    ...(assessmentCriteria.merit || []),
    ...(assessmentCriteria.distinction || []),
  ];

  return allCriteria.find((c: any) => c.code === code);
}
