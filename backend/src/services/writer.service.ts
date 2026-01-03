import OpenAI from 'openai';
import { prisma } from '../lib/prisma';
import { logAIUsage } from './admin.service';
import { LANGUAGE_CONFIGS } from '../utils/language';
import { Reference } from '../types';

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
  targetGrade: 'PASS' | 'MERIT' | 'DISTINCTION';
  options: {
    includeTables: boolean;
    includeImages: boolean;
  };
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
- Use bullet points or numbered lists
- Use markdown formatting
- Include headings in body text

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
- Paragraphs should flow naturally

CRITERION-SPECIFIC DEPTH RULES (CRITICAL):

PASS CRITERIA (P1, P2, etc.):
- EXPLAIN concepts clearly
- DEMONSTRATE understanding
- USE examples from the scenario
- 200-350 words per criterion

MERIT CRITERIA (M1, M2, etc.):
- ANALYSE different approaches
- COMPARE alternatives
- JUSTIFY decisions with reasoning
- 300-450 words per criterion

DISTINCTION CRITERIA (D1, D2, etc.):
- EVALUATE strengths and limitations
- CRITICALLY ASSESS implications
- LINK theory to real-world impact
- 400-550 words per criterion

OUTPUT RULES (STRICT):
- Output PLAIN TEXT ONLY
- No headings
- No bullet points
- No references section
- No tables
- No images
- No markdown

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

  // Determine grade level and depth requirements
  const criterionCode = task.criterionCode || '';
  let gradeLevel = 'PASS';
  let depthInstructions = 'EXPLAIN concepts clearly with examples. 200-350 words.';
  
  if (criterionCode.toUpperCase().includes('M')) {
    gradeLevel = 'MERIT';
    depthInstructions = 'ANALYSE and COMPARE different approaches. JUSTIFY decisions. 300-450 words.';
  } else if (criterionCode.toUpperCase().includes('D')) {
    gradeLevel = 'DISTINCTION';
    depthInstructions = 'EVALUATE strengths and limitations. CRITICALLY ASSESS implications. 400-550 words.';
  }

  const userPrompt = `UNIT: ${briefSnapshot.unitName} (${briefSnapshot.unitCode})
LEVEL: ${briefSnapshot.level}
VOCATIONAL SCENARIO: ${briefSnapshot.scenario}

CURRENT TASK:
Section: ${task.sectionId}
Criterion: ${task.criterionCode || 'General content'}
Description: ${task.criterionDescription || 'N/A'}

GRADE LEVEL: ${gradeLevel}
DEPTH REQUIREMENT: ${depthInstructions}

PREVIOUS CONTENT SUMMARY:
${task.previousContentSummary || 'This is the first block.'}

LANGUAGE: ${language}
${languageInstructions}

STRICT INSTRUCTIONS:
- Write ONLY content for criterion ${task.criterionCode || 'this section'}
- Follow the depth requirement exactly
- NO bullet points, NO headings, NO markdown
- Maintain continuity with previous content
- Apply concepts to the vocational scenario
- Do NOT mention criterion codes in the text

Write the content now. Output ONLY the academic text.`;

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

/**
 * PHASE 2: Generate Introduction
 * 1 AI call, 120-180 words
 * Must: Explain unit topic, Reference scenario, Mention learning aims
 */
export async function generateIntroduction(
  briefSnapshot: BriefSnapshot,
  generationPlan: GenerationPlan,
  userId: string,
  assignmentId: string,
  blockOrder: number
): Promise<string> {
  const language = briefSnapshot.language || 'en';
  const languageInstructions = LANGUAGE_CONFIGS[language]?.academicInstructions || '';

  const learningAimsText = briefSnapshot.learningAims
    .map((aim: any) => `- ${aim.code || aim.letter}: ${aim.title || aim.description}`)
    .join('\n');

  const prompt = `Write an INTRODUCTION for a BTEC assignment.

UNIT: ${briefSnapshot.unitName} (${briefSnapshot.unitCode})
LEVEL: ${briefSnapshot.level}
VOCATIONAL SCENARIO: ${briefSnapshot.scenario}

LEARNING AIMS:
${learningAimsText}

STRICT REQUIREMENTS:
- Length: 120-180 words
- Must explain the unit topic
- Must reference the vocational scenario
- Must mention learning aims at high level
- NO criteria codes mentioned
- NO bullet points
- NO headings
- Write in ${language}
- Formal academic tone
- First-line indent paragraphs

${languageInstructions}

Write the introduction now. Output ONLY the introduction text, nothing else.`;

  console.log('[WRITER] Generating introduction...');

  const completion = await openrouter.chat.completions.create({
    model: WRITER_MODEL,
    messages: [
      { role: 'system', content: WRITER_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  const content = completion.choices[0].message.content || '';

  await logAIUsage({
    assignmentId,
    userId,
    userRole: 'USER',
    aiProvider: 'openrouter',
    aiModel: WRITER_MODEL,
    promptTokens: completion.usage?.prompt_tokens || 0,
    completionTokens: completion.usage?.completion_tokens || 0,
    totalTokens: completion.usage?.total_tokens || 0,
    purpose: 'INTRODUCTION',
  });

  await prisma.contentBlock.create({
    data: {
      assignmentId,
      sectionId: 'introduction',
      criterionCode: null,
      blockOrder,
      content,
      tokensUsed: completion.usage?.total_tokens || 0,
    },
  });

  console.log('[WRITER] Introduction generated successfully');
  return content;
}

/**
 * PHASE 3.1: Generate Learning Aim Context Block
 * Short explanation of the learning aim and why it matters
 */
export async function generateLearningAimContent(
  briefSnapshot: BriefSnapshot,
  generationPlan: GenerationPlan,
  section: any,
  previousSummary: string,
  userId: string,
  assignmentId: string,
  blockOrder: number
): Promise<string> {
  const language = briefSnapshot.language || 'en';
  const languageInstructions = LANGUAGE_CONFIGS[language]?.academicInstructions || '';

  const prompt = `Write a LEARNING AIM CONTEXT BLOCK for a BTEC assignment.

UNIT: ${briefSnapshot.unitName} (${briefSnapshot.unitCode})
LEARNING AIM: ${section.title}
VOCATIONAL SCENARIO: ${briefSnapshot.scenario}

PREVIOUS CONTENT SUMMARY:
${previousSummary || 'This follows the introduction.'}

CRITERIA TO BE COVERED IN THIS SECTION:
${(section.coversCriteria || []).join(', ')}

STRICT REQUIREMENTS:
- Length: 80-120 words
- Explain what this learning aim is about
- Why it matters in the vocational context
- Set up the criteria that follow
- NO criteria content yet (just context)
- NO bullet points
- NO headings
- Write in ${language}
- Formal academic tone

${languageInstructions}

Write the learning aim context now. Output ONLY the context text, nothing else.`;

  console.log(`[WRITER] Generating learning aim context for: ${section.title}`);

  const completion = await openrouter.chat.completions.create({
    model: WRITER_MODEL,
    messages: [
      { role: 'system', content: WRITER_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 400,
  });

  const content = completion.choices[0].message.content || '';

  await logAIUsage({
    assignmentId,
    userId,
    userRole: 'USER',
    aiProvider: 'openrouter',
    aiModel: WRITER_MODEL,
    promptTokens: completion.usage?.prompt_tokens || 0,
    completionTokens: completion.usage?.completion_tokens || 0,
    totalTokens: completion.usage?.total_tokens || 0,
    purpose: 'LEARNING_AIM_CONTEXT',
  });

  await prisma.contentBlock.create({
    data: {
      assignmentId,
      sectionId: section.id,
      criterionCode: null,
      blockOrder,
      content,
      tokensUsed: completion.usage?.total_tokens || 0,
    },
  });

  console.log(`[WRITER] Learning aim context generated for: ${section.title}`);
  return content;
}

/**
 * PHASE 4: Generate Conclusion
 * 1 AI call, 120-180 words
 * Summarizes achievements, learning aims covered, skills demonstrated
 */
export async function generateConclusion(
  briefSnapshot: BriefSnapshot,
  generationPlan: GenerationPlan,
  previousSummary: string,
  userId: string,
  assignmentId: string,
  blockOrder: number
): Promise<string> {
  const language = briefSnapshot.language || 'en';
  const languageInstructions = LANGUAGE_CONFIGS[language]?.academicInstructions || '';

  const learningAimsText = briefSnapshot.learningAims
    .map((aim: any) => `- ${aim.code || aim.letter}: ${aim.title || aim.description}`)
    .join('\n');

  const prompt = `Write a CONCLUSION for a BTEC assignment.

UNIT: ${briefSnapshot.unitName} (${briefSnapshot.unitCode})
TARGET GRADE: ${briefSnapshot.targetGrade}
VOCATIONAL SCENARIO: ${briefSnapshot.scenario}

LEARNING AIMS COVERED:
${learningAimsText}

PREVIOUS CONTENT SUMMARY:
${previousSummary}

STRICT REQUIREMENTS:
- Length: 120-180 words
- Summarize what was achieved
- Mention learning aims covered
- Highlight skills demonstrated
- NO new information
- NO bullet points
- NO headings
- Write in ${language}
- Formal academic tone
- Reflective but not personal

${languageInstructions}

Write the conclusion now. Output ONLY the conclusion text, nothing else.`;

  console.log('[WRITER] Generating conclusion...');

  const completion = await openrouter.chat.completions.create({
    model: WRITER_MODEL,
    messages: [
      { role: 'system', content: WRITER_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  const content = completion.choices[0].message.content || '';

  await logAIUsage({
    assignmentId,
    userId,
    userRole: 'USER',
    aiProvider: 'openrouter',
    aiModel: WRITER_MODEL,
    promptTokens: completion.usage?.prompt_tokens || 0,
    completionTokens: completion.usage?.completion_tokens || 0,
    totalTokens: completion.usage?.total_tokens || 0,
    purpose: 'CONCLUSION',
  });

  await prisma.contentBlock.create({
    data: {
      assignmentId,
      sectionId: 'conclusion',
      criterionCode: null,
      blockOrder,
      content,
      tokensUsed: completion.usage?.total_tokens || 0,
    },
  });

  console.log('[WRITER] Conclusion generated successfully');
  return content;
}

/**
 * PHASE 5: Generate References
 * Oxford style, 3-10 references based on grade
 */
export async function generateReferences(
  briefSnapshot: BriefSnapshot,
  targetGrade: 'PASS' | 'MERIT' | 'DISTINCTION',
  userId: string,
  assignmentId: string,
  blockOrder: number
): Promise<Reference[]> {
  const language = briefSnapshot.language || 'en';

  // Determine reference count based on grade
  const refCount = targetGrade === 'PASS' ? 3 : targetGrade === 'MERIT' ? 5 : 8;

  const prompt = `Generate ${refCount} academic REFERENCES for a BTEC assignment in Oxford referencing style.

UNIT: ${briefSnapshot.unitName}
TOPIC AREA: ${briefSnapshot.scenario}
LEVEL: ${briefSnapshot.level}

STRICT REQUIREMENTS:
- Generate exactly ${refCount} references
- Use Oxford referencing style
- Include mix of: textbooks, academic journals, reputable websites
- References must be relevant to: ${briefSnapshot.unitName}
- Each reference on its own line
- Format: Author, Initial. (Year) Title. Publisher/Journal/URL.

Output as JSON array:
[
  { "text": "Russell, S. and Norvig, P. (2021) Artificial Intelligence: A Modern Approach. 4th edn. Pearson.", "order": 1 },
  { "text": "Smith, J. (2022) 'Machine Learning Applications', Journal of Computing, 15(2), pp. 45-67.", "order": 2 }
]

Generate the references now. Output ONLY the JSON array, nothing else.`;

  console.log('[WRITER] Generating references...');

  const completion = await openrouter.chat.completions.create({
    model: WRITER_MODEL,
    messages: [
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  let references: Reference[] = [];
  const responseContent = completion.choices[0].message.content || '[]';

  try {
    const parsed = JSON.parse(responseContent);
    references = Array.isArray(parsed) ? parsed : (parsed.references || []);
    
    // Ensure proper structure
    references = references.map((ref: any, idx: number) => ({
      text: ref.text || ref.reference || String(ref),
      order: ref.order || idx + 1,
    }));
  } catch (e) {
    console.error('[WRITER] Failed to parse references JSON, creating defaults');
    references = [
      { text: 'BTEC National IT Student Book. Pearson Education.', order: 1 },
      { text: 'Computing and IT. Cambridge University Press.', order: 2 },
      { text: 'www.bbc.co.uk/bitesize - Computing Resources.', order: 3 },
    ];
  }

  await logAIUsage({
    assignmentId,
    userId,
    userRole: 'USER',
    aiProvider: 'openrouter',
    aiModel: WRITER_MODEL,
    promptTokens: completion.usage?.prompt_tokens || 0,
    completionTokens: completion.usage?.completion_tokens || 0,
    totalTokens: completion.usage?.total_tokens || 0,
    purpose: 'REFERENCES',
  });

  // Store references as a content block
  await prisma.contentBlock.create({
    data: {
      assignmentId,
      sectionId: 'references',
      criterionCode: null,
      blockOrder,
      content: JSON.stringify(references),
      tokensUsed: completion.usage?.total_tokens || 0,
    },
  });

  console.log(`[WRITER] Generated ${references.length} references`);
  return references;
}
