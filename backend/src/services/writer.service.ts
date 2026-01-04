import OpenAI from 'openai';
import { Language } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logAIUsage } from './admin.service';
import { LANGUAGE_CONFIGS } from '../utils/language';
import { Reference, TableData } from '../types';

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
  // Student context for personalised first-person writing
  studentContext?: {
    profileSnapshot?: {
      fullName: string;
      universityName: string;
      faculty: string;
      groupName: string;
      city: string;
      academicYear?: string;
    };
    studentInputs?: Record<string, any>;
  };
}

interface GenerationPlan {
  documentOutline?: any[];
  tablesRequired?: any[];
  imagesSuggested?: any[];
  introduction?: any;
  sections?: any[];
  tables?: any[];
  images?: any[];
  conclusion?: any;
  references?: any;
}

interface WritingTask {
  sectionId: string;
  criterionCode: string | null;
  criterionDescription: string | null;
  previousContentSummary: string;
}

// Student context shape is defined inline in BriefSnapshot.studentContext
// profileSnapshot: { fullName, universityName, faculty, groupName, city, academicYear }
// studentInputs: Record<string, any> - dynamic fields based on brief requirements

const WRITER_SYSTEM_PROMPT = `You are BTEC_ASSIGNMENT_WRITER, a controlled academic writing model.

You write ONLY ONE CONTENT BLOCK AT A TIME, strictly bound to a specific criterion or section.

================================================================================
CRITICAL: FIRST-PERSON ACADEMIC WRITING (MANDATORY)
================================================================================
You MUST write in FIRST PERSON from the student's perspective. This is NON-NEGOTIABLE.

✅ ALWAYS USE:
- "I designed..."
- "I implemented..."
- "I analysed..."
- "In my project, I..."
- "Through this work, I demonstrated..."
- "I chose to use..."
- "My approach was..."
- "I faced challenges with..."
- "I learned that..."

❌ NEVER USE:
- "The student designed..."
- "One might implement..."
- "A developer would..."
- "The system was designed..."
- "This project demonstrates..."
- Third-person academic narration

The writing must read as if the STUDENT wrote it themselves, describing THEIR OWN work.
================================================================================

You MUST NOT:
- Invent features, tools, or work that the student did NOT provide
- Skip criteria
- Repeat content already written
- Reference criteria not assigned to you
- Change academic meaning of the criterion
- Write references unless explicitly asked
- Use bullet points or numbered lists
- Use markdown formatting
- Include headings in body text
- Mention criterion codes explicitly in the text
- Pre-empt future criteria content
- Write in third person or passive voice about the student's work

You MUST:
- Follow the locked brief snapshot
- Follow the planner output exactly
- BASE ALL CONTENT on the student's provided inputs
- Explain, analyse, justify, and evaluate ONLY what the student declared they did
- Write in FIRST PERSON as if you are the student
- Maintain continuity with previously generated blocks
- Write in the requested language
- Use formal academic tone
- Ensure content is UNIQUE (vary examples, structure, phrasing)

STUDENT INPUT USAGE (CRITICAL):
When student inputs are provided, you MUST:
- Reference their actual project/work description
- Use their declared tools, technologies, and methods
- Address their stated challenges
- Evaluate their specific choices and decisions
- Build tables and examples from their data
- NEVER invent additional features or work they didn't mention

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
- EXPLAIN concepts clearly using the student's work as examples
- DEMONSTRATE how the student's project addresses the criterion
- Connect theory to the student's implementation
- 200-350 words per criterion

MERIT CRITERIA (M1, M2, etc.):
- ANALYSE the student's design decisions
- COMPARE their choices with alternatives they could have made
- JUSTIFY why the student's approach was appropriate
- 300-450 words per criterion

DISTINCTION CRITERIA (D1, D2, etc.):
- EVALUATE strengths and limitations of the student's work
- CRITICALLY ASSESS the implications of their choices
- Discuss how the student could improve their work
- LINK the student's project to real-world impact
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
Write ONLY the content for the current task in FIRST PERSON.
Do NOT explain what you are doing.
Do NOT mention criteria codes explicitly in the text.
Do NOT exceed the academic scope of the criterion.
Do NOT invent work the student did not declare.`;

/**
 * Build student context prompt section from student inputs and profile
 * This provides AI with the student's actual work details for first-person writing
 */
function buildStudentContextPrompt(studentContext?: {
  profileSnapshot?: {
    fullName: string;
    universityName: string;
    faculty: string;
    groupName: string;
    city: string;
    academicYear?: string;
  };
  studentInputs?: Record<string, any>;
}): string {
  if (!studentContext) {
    return '';
  }

  const parts: string[] = [];

  // Add student profile information
  if (studentContext.profileSnapshot) {
    const p = studentContext.profileSnapshot;
    parts.push(`
================================================================================
STUDENT PROFILE (Use for personalisation)
================================================================================
Student Name: ${p.fullName}
University: ${p.universityName}
Faculty/Department: ${p.faculty}
Group: ${p.groupName}
Location: ${p.city}${p.academicYear ? `\nAcademic Year: ${p.academicYear}` : ''}`);
  }

  // Add student inputs
  if (studentContext.studentInputs && Object.keys(studentContext.studentInputs).length > 0) {
    parts.push(`
================================================================================
STUDENT'S PROJECT/WORK DETAILS (CRITICAL - Base ALL content on this)
================================================================================
The student has declared the following about their work. You MUST use this
information to write about THEIR project. Do NOT invent additional details.`);

    for (const [key, value] of Object.entries(studentContext.studentInputs)) {
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
      
      if (Array.isArray(value)) {
        parts.push(`\n${formattedKey}:\n${value.map(v => `  - ${v}`).join('\n')}`);
      } else if (typeof value === 'boolean') {
        parts.push(`\n${formattedKey}: ${value ? 'Yes' : 'No'}`);
      } else {
        parts.push(`\n${formattedKey}: ${value}`);
      }
    }
    
    parts.push(`
================================================================================
IMPORTANT: Write about the student's ACTUAL work described above.
Use "I designed...", "I implemented...", "In my project..." etc.
================================================================================`);
  }

  return parts.join('\n');
}

export async function generateContentBlock(
  briefSnapshot: BriefSnapshot,
  _generationPlan: GenerationPlan,
  task: WritingTask,
  userId: string,
  assignmentId: string,
  blockOrder: number
): Promise<string> {
  const language = (briefSnapshot.language || 'en') as Language;
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

  // Build student context section if available
  const studentContextSection = buildStudentContextPrompt(briefSnapshot.studentContext);

  const userPrompt = `UNIT: ${briefSnapshot.unitName} (${briefSnapshot.unitCode})
LEVEL: ${briefSnapshot.level}
VOCATIONAL SCENARIO: ${briefSnapshot.scenario}
${studentContextSection}
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
- Write in FIRST PERSON as the student ("I designed...", "I implemented...")
- Write ONLY content for criterion ${task.criterionCode || 'this section'}
- Use the student's provided project details and inputs as the basis for examples
- Follow the depth requirement exactly
- NO bullet points, NO headings, NO markdown
- Maintain continuity with previous content
- Do NOT invent features or work the student did not declare
- Do NOT mention criterion codes in the text
- UNIQUE VARIATION: This content must be unique. Vary your wording, examples, and explanations from any previous generations. (Session: ${assignmentId.slice(-8)}, Block: ${blockOrder})

Write the content now. Output ONLY the academic text in FIRST PERSON.`;

  console.log(`[WRITER] Generating block ${blockOrder} for assignment ${assignmentId}`);

  // Use higher temperature and unique seed for variety
  const uniqueSeed = parseInt(assignmentId.slice(-8), 16) + blockOrder;

  const completion = await openrouter.chat.completions.create({
    model: WRITER_MODEL,
    messages: [
      { role: 'system', content: WRITER_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.85, // Higher temperature for more variation
    max_tokens: 2000,
    seed: uniqueSeed, // Use unique seed for randomization
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
  const sortedSections = [...(generationPlan.sections || [])].sort(
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
 * NOW: Uses student context for personalised first-person writing
 */
export async function generateIntroduction(
  briefSnapshot: BriefSnapshot,
  _generationPlan: GenerationPlan,
  userId: string,
  assignmentId: string,
  blockOrder: number
): Promise<string> {
  const language = (briefSnapshot.language || 'en') as Language;
  const languageInstructions = LANGUAGE_CONFIGS[language]?.academicInstructions || '';

  const learningAimsText = briefSnapshot.learningAims
    .map((aim: any) => `- ${aim.code || aim.letter}: ${aim.title || aim.description}`)
    .join('\n');

  // Build student context section
  const studentContextSection = buildStudentContextPrompt(briefSnapshot.studentContext);
  
  // Personalisation details
  const universityName = briefSnapshot.studentContext?.profileSnapshot?.universityName || '';
  const projectDescription = briefSnapshot.studentContext?.studentInputs?.projectDescription || 
                            briefSnapshot.studentContext?.studentInputs?.projectTitle || '';

  const prompt = `Write an INTRODUCTION for a BTEC assignment in FIRST PERSON.

UNIT: ${briefSnapshot.unitName} (${briefSnapshot.unitCode})
LEVEL: ${briefSnapshot.level}
VOCATIONAL SCENARIO: ${briefSnapshot.scenario}

LEARNING AIMS:
${learningAimsText}
${studentContextSection}
STRICT REQUIREMENTS:
- Length: 120-180 words
- Write in FIRST PERSON ("I designed...", "In this report, I...")
- Must explain the unit topic
- Must reference the vocational scenario
- Must mention learning aims at high level
${projectDescription ? '- Reference the student\'s actual project/work described above' : ''}
${universityName ? `- May reference that this is for ${universityName}` : ''}
- NO criteria codes mentioned
- NO bullet points
- NO headings
- Write in ${language}
- Formal academic tone
- First-line indent paragraphs
- UNIQUE VARIATION: Create a unique introduction with varied wording and structure. (Session: ${assignmentId.slice(-8)})

${languageInstructions}

Write the introduction now in FIRST PERSON. Output ONLY the introduction text, nothing else.`;

  console.log('[WRITER] Generating introduction...');

  // Use unique seed for variety
  const uniqueSeed = parseInt(assignmentId.slice(-8), 16) + blockOrder;

  const completion = await openrouter.chat.completions.create({
    model: WRITER_MODEL,
    messages: [
      { role: 'system', content: WRITER_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.85, // Higher temperature for uniqueness
    max_tokens: 500,
    seed: uniqueSeed,
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
  _generationPlan: GenerationPlan,
  section: any,
  previousSummary: string,
  userId: string,
  assignmentId: string,
  blockOrder: number
): Promise<string> {
  const language = (briefSnapshot.language || 'en') as Language;
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
- UNIQUE VARIATION: Create unique context with varied wording. (Session: ${assignmentId.slice(-8)}, Block: ${blockOrder})

${languageInstructions}

Write the learning aim context now. Output ONLY the context text, nothing else.`;

  console.log(`[WRITER] Generating learning aim context for: ${section.title}`);

  // Use unique seed for variety
  const uniqueSeed = parseInt(assignmentId.slice(-8), 16) + blockOrder;

  const completion = await openrouter.chat.completions.create({
    model: WRITER_MODEL,
    messages: [
      { role: 'system', content: WRITER_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.85, // Higher temperature for uniqueness
    max_tokens: 400,
    seed: uniqueSeed,
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
 * NOW: Uses student context for personalised first-person reflection
 */
export async function generateConclusion(
  briefSnapshot: BriefSnapshot,
  _generationPlan: GenerationPlan,
  previousSummary: string,
  userId: string,
  assignmentId: string,
  blockOrder: number
): Promise<string> {
  const language = (briefSnapshot.language || 'en') as Language;
  const languageInstructions = LANGUAGE_CONFIGS[language]?.academicInstructions || '';

  const learningAimsText = briefSnapshot.learningAims
    .map((aim: any) => `- ${aim.code || aim.letter}: ${aim.title || aim.description}`)
    .join('\n');

  // Get student context for reflection
  const studentContext = briefSnapshot.studentContext;
  const challengesFaced = studentContext?.studentInputs?.challengesFaced || '';
  const lessonsLearned = studentContext?.studentInputs?.lessonsLearned || '';
  const limitations = studentContext?.studentInputs?.limitations || '';

  const prompt = `Write a CONCLUSION for a BTEC assignment in FIRST PERSON.

UNIT: ${briefSnapshot.unitName} (${briefSnapshot.unitCode})
TARGET GRADE: ${briefSnapshot.targetGrade}
VOCATIONAL SCENARIO: ${briefSnapshot.scenario}

LEARNING AIMS COVERED:
${learningAimsText}
${challengesFaced ? `\nSTUDENT'S CHALLENGES (use for reflection):\n${challengesFaced}` : ''}
${lessonsLearned ? `\nSTUDENT'S LESSONS LEARNED:\n${lessonsLearned}` : ''}
${limitations ? `\nSTUDENT'S IDENTIFIED LIMITATIONS:\n${limitations}` : ''}

PREVIOUS CONTENT SUMMARY:
${previousSummary}

STRICT REQUIREMENTS:
- Length: 120-180 words
- Write in FIRST PERSON ("I achieved...", "Through this project, I learned...")
- Summarize what YOU (the student) achieved
- Mention learning aims covered
- Highlight skills demonstrated
${challengesFaced ? '- Reflect on challenges faced and how you overcame them' : ''}
${lessonsLearned ? '- Include genuine reflection on lessons learned' : ''}
- NO new information
- NO bullet points
- NO headings
- Write in ${language}
- Formal academic tone
- Personal and reflective
- UNIQUE VARIATION: Create a unique conclusion with varied wording and reflection. (Session: ${assignmentId.slice(-8)})

${languageInstructions}

Write the conclusion now in FIRST PERSON. Output ONLY the conclusion text, nothing else.`;

  console.log('[WRITER] Generating conclusion...');

  // Use unique seed for variety
  const uniqueSeed = parseInt(assignmentId.slice(-8), 16) + blockOrder;

  const completion = await openrouter.chat.completions.create({
    model: WRITER_MODEL,
    messages: [
      { role: 'system', content: WRITER_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.85, // Higher temperature for uniqueness
    max_tokens: 500,
    seed: uniqueSeed,
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
  // Language is available from briefSnapshot but not currently used in prompt
  // const language = briefSnapshot.language || 'en';

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

/**
 * NEW ATOMIC WRITING FUNCTIONS
 * Each function writes exactly ONE content block for ONE outline item
 */

/**
 * Generate content for a LEARNING_AIM item
 * Short explanation of what this aim covers (80-120 words)
 * NO grading language, NO criterion content
 * NOW: Written in first-person linking to student's project
 */
export async function generateLearningAimBlock(
  briefSnapshot: BriefSnapshot,
  aimCode: string,
  aimTitle: string,
  previousSummary: string,
  userId: string,
  assignmentId: string,
  blockOrder: number
): Promise<string> {
  const language = (briefSnapshot.language || 'en') as Language;
  const languageInstructions = LANGUAGE_CONFIGS[language]?.academicInstructions || '';

  // Get student context for personalisation
  const studentContextPrompt = buildStudentContextPrompt(briefSnapshot.studentContext);

  const prompt = `Write a LEARNING AIM INTRODUCTION for a BTEC assignment in FIRST PERSON.

You are writing ONLY for:
Learning Aim: ${aimCode}
Title: ${aimTitle}

UNIT: ${briefSnapshot.unitName} (${briefSnapshot.unitCode})
LEVEL: ${briefSnapshot.level}
VOCATIONAL SCENARIO: ${briefSnapshot.scenario}
${studentContextPrompt}

PREVIOUS CONTENT SUMMARY:
${previousSummary || 'This follows the introduction.'}

STRICT REQUIREMENTS:
- Length: 80-120 words ONLY
- Write in FIRST PERSON ("In this section, I will...", "For this learning aim, I explored...")
- Explain what this learning aim is about
- Link to how YOUR project relates to this aim
- Set up what YOU will cover based on YOUR work
- NO grading language (no "Pass", "Merit", "Distinction")
- NO criterion content yet (just context)
- NO bullet points, NO headings, NO markdown
- Write in ${language}
- Formal academic tone
- UNIQUE VARIATION: Vary wording and structure. (Session: ${assignmentId.slice(-8)}, Block: ${blockOrder})

${languageInstructions}

Write the learning aim introduction now in FIRST PERSON. Output ONLY the text, nothing else.`;

  console.log(`[WRITER] Generating Learning Aim ${aimCode} introduction...`);

  const uniqueSeed = parseInt(assignmentId.slice(-8), 16) + blockOrder;

  const completion = await openrouter.chat.completions.create({
    model: WRITER_MODEL,
    messages: [
      { role: 'system', content: WRITER_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.85,
    max_tokens: 400,
    seed: uniqueSeed,
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
    purpose: 'LEARNING_AIM',
  });

  await prisma.contentBlock.create({
    data: {
      assignmentId,
      sectionId: `aim_${aimCode}`,
      criterionCode: null,
      blockOrder,
      content,
      tokensUsed: completion.usage?.total_tokens || 0,
    },
  });

  console.log(`[WRITER] Learning Aim ${aimCode} introduction generated`);
  return content;
}

/**
 * Generate content for a CRITERION item
 * This is the ATOMIC unit - one criterion = one content block
 * NOW: Written in first-person using student's actual project details
 */
export async function generateCriterionBlock(
  briefSnapshot: BriefSnapshot,
  aimCode: string,
  criterionCode: string,
  criterionDescription: string,
  previousSummary: string,
  userId: string,
  assignmentId: string,
  blockOrder: number
): Promise<string> {
  const language = (briefSnapshot.language || 'en') as Language;
  const languageInstructions = LANGUAGE_CONFIGS[language]?.academicInstructions || '';

  // Get student context for personalisation
  const studentContextPrompt = buildStudentContextPrompt(briefSnapshot.studentContext);

  // Determine grade level and depth requirements
  let gradeLevel = 'PASS';
  let depthInstructions = 'EXPLAIN concepts clearly with examples from YOUR work. 200-350 words.';
  let commandVerbs = 'describe, explain, identify, outline';
  
  if (criterionCode.toUpperCase().includes('M')) {
    gradeLevel = 'MERIT';
    depthInstructions = 'ANALYSE and COMPARE different approaches YOU considered. JUSTIFY YOUR decisions with reasoning. 300-450 words.';
    commandVerbs = 'analyse, compare, discuss, examine';
  } else if (criterionCode.toUpperCase().includes('D')) {
    gradeLevel = 'DISTINCTION';
    depthInstructions = 'EVALUATE strengths and limitations of YOUR approach. CRITICALLY ASSESS implications of YOUR choices. LINK YOUR practice to theory. 400-550 words.';
    commandVerbs = 'evaluate, critically assess, justify, recommend';
  }

  const prompt = `Write content for a SPECIFIC CRITERION in a BTEC assignment in FIRST PERSON.

You are writing ONLY for:
Learning Aim: ${aimCode}
Criterion: ${criterionCode}
Criterion Description: ${criterionDescription}

UNIT: ${briefSnapshot.unitName} (${briefSnapshot.unitCode})
LEVEL: ${briefSnapshot.level}
VOCATIONAL SCENARIO: ${briefSnapshot.scenario}

GRADE LEVEL: ${gradeLevel}
COMMAND VERBS TO USE: ${commandVerbs}
DEPTH REQUIREMENT: ${depthInstructions}
${studentContextPrompt}

PREVIOUS CONTENT SUMMARY:
${previousSummary || 'This follows the learning aim introduction.'}

STRICT RULES:
- Write in FIRST PERSON ("I designed...", "I implemented...", "I analysed...")
- Write ONLY content that satisfies THIS criterion using YOUR project as evidence
- Use academic tone appropriate for ${gradeLevel} level
- Apply concepts to YOUR actual work (not hypothetical)
- Reference specific tools/technologies/decisions YOU made
- Do NOT mention other criteria
- Do NOT pre-empt future criteria
- Do NOT mention criterion codes in the text
- NO bullet points, NO headings, NO markdown
- Write in ${language}
- Ensure originality (vary examples, structure, phrasing)
- UNIQUE VARIATION: Session ${assignmentId.slice(-8)}, Block ${blockOrder}

${languageInstructions}

Write the criterion content now in FIRST PERSON. Output ONLY the academic text.`;

  console.log(`[WRITER] Generating criterion ${criterionCode} content...`);

  const uniqueSeed = parseInt(assignmentId.slice(-8), 16) + blockOrder;

  const completion = await openrouter.chat.completions.create({
    model: WRITER_MODEL,
    messages: [
      { role: 'system', content: WRITER_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.85,
    max_tokens: 1500,
    seed: uniqueSeed,
  });

  const content = completion.choices[0].message.content || '';

  if (content.startsWith('ERROR:')) {
    throw new Error(content);
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
    purpose: 'CRITERION',
  });

  await prisma.contentBlock.create({
    data: {
      assignmentId,
      sectionId: `criterion_${criterionCode}`,
      criterionCode,
      blockOrder,
      content,
      tokensUsed: completion.usage?.total_tokens || 0,
    },
  });

  console.log(`[WRITER] Criterion ${criterionCode} content generated`);
  return content;
}

/**
 * Generate a table for a specific criterion
 * Tables are dynamic - generated from student's actual project data
 * NOW: Uses student inputs to create evidence-based tables
 */
export async function generateCriterionTable(
  briefSnapshot: BriefSnapshot,
  criterionCode: string,
  criterionDescription: string,
  tableType: string,
  userId: string,
  assignmentId: string,
  _blockOrder: number
): Promise<TableData> {
  // Get student context for table data
  const studentContext = briefSnapshot.studentContext;
  const studentInputs = studentContext?.studentInputs || {};
  
  // Build student data context for table generation
  let studentDataContext = '';
  if (studentInputs.toolsUsed?.length) {
    studentDataContext += `\nTOOLS/TECHNOLOGIES USED BY STUDENT: ${studentInputs.toolsUsed.join(', ')}`;
  }
  if (studentInputs.featuresImplemented?.length) {
    studentDataContext += `\nFEATURES IMPLEMENTED: ${studentInputs.featuresImplemented.join(', ')}`;
  }
  if (studentInputs.dataSources?.length) {
    studentDataContext += `\nDATA SOURCES USED: ${studentInputs.dataSources.join(', ')}`;
  }
  if (studentInputs.testingMethods?.length) {
    studentDataContext += `\nTESTING METHODS: ${studentInputs.testingMethods.join(', ')}`;
  }
  if (studentInputs.projectDescription) {
    studentDataContext += `\nPROJECT DESCRIPTION: ${studentInputs.projectDescription}`;
  }

  const prompt = `Generate a TABLE for a BTEC assignment criterion based on the STUDENT'S ACTUAL PROJECT.

CRITERION: ${criterionCode}
DESCRIPTION: ${criterionDescription}
TABLE TYPE: ${tableType}

UNIT: ${briefSnapshot.unitName}
SCENARIO: ${briefSnapshot.scenario}
${studentDataContext}

REQUIREMENTS:
- Create a ${tableType} table relevant to this criterion
- 3-5 columns maximum
- 3-5 rows of data based on the student's ACTUAL tools/features/data
- Headers must be clear and academic
- Data must reflect the student's REAL project (not hypothetical)
- If student provided tools/features/testing methods, use THOSE in the table
- Tables should serve as evidence of what the STUDENT actually did

Output as JSON:
{
  "caption": "Table title describing what this table shows",
  "headers": ["Column1", "Column2", "Column3"],
  "rows": [
    ["Data 1.1", "Data 1.2", "Data 1.3"],
    ["Data 2.1", "Data 2.2", "Data 2.3"],
    ["Data 3.1", "Data 3.2", "Data 3.3"]
  ]
}

Generate the table now. Output ONLY the JSON, nothing else.`;

  console.log(`[WRITER] Generating table for criterion ${criterionCode}...`);

  const completion = await openrouter.chat.completions.create({
    model: WRITER_MODEL,
    messages: [
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 800,
    response_format: { type: 'json_object' },
  });

  let table: TableData;
  const responseContent = completion.choices[0].message.content || '{}';

  try {
    const parsed = JSON.parse(responseContent);
    table = {
      caption: parsed.caption || `${tableType} for ${criterionCode}`,
      headers: parsed.headers || ['Aspect', 'Description', 'Application'],
      rows: parsed.rows || [['Item 1', 'Description', 'Application']],
    };
  } catch (e) {
    console.error('[WRITER] Failed to parse table JSON, using default');
    table = {
      caption: `${tableType} for ${criterionCode}`,
      headers: ['Aspect', 'Description', 'Application'],
      rows: [
        ['Key Concept 1', 'Definition of this concept', 'How it applies to the scenario'],
        ['Key Concept 2', 'Definition of this concept', 'How it applies to the scenario'],
        ['Key Concept 3', 'Definition of this concept', 'How it applies to the scenario'],
      ],
    };
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
    purpose: 'TABLE',
  });

  console.log(`[WRITER] Table generated for criterion ${criterionCode}`);
  return table;
}

/**
 * Generate structured references (array of objects)
 * Each reference is numbered and formatted in Oxford style
 */
export async function generateStructuredReferences(
  briefSnapshot: BriefSnapshot,
  targetGrade: 'PASS' | 'MERIT' | 'DISTINCTION',
  userId: string,
  assignmentId: string,
  blockOrder: number
): Promise<Reference[]> {
  // Determine reference count based on grade
  const refCount = targetGrade === 'PASS' ? 3 : targetGrade === 'MERIT' ? 5 : 8;

  const prompt = `Generate ${refCount} academic REFERENCES for a BTEC assignment.

UNIT: ${briefSnapshot.unitName}
TOPIC: ${briefSnapshot.scenario}
LEVEL: ${briefSnapshot.level}

REQUIREMENTS:
- Exactly ${refCount} references
- Oxford referencing style
- Mix of: textbooks, academic journals, reputable websites
- Relevant to the unit topic
- Each reference must be UNIQUE and realistic
- Different every time (vary authors, years, titles)

Output as JSON:
{
  "references": [
    { "id": 1, "text": "Author, A. (Year) Title. Publisher." },
    { "id": 2, "text": "Author, B. (Year) 'Article Title', Journal Name, Volume(Issue), pp. X-Y." }
  ]
}

Generate the references now. Output ONLY the JSON.`;

  console.log('[WRITER] Generating structured references...');

  const uniqueSeed = parseInt(assignmentId.slice(-8), 16) + blockOrder;

  const completion = await openrouter.chat.completions.create({
    model: WRITER_MODEL,
    messages: [
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
    seed: uniqueSeed,
  });

  let references: Reference[] = [];
  const responseContent = completion.choices[0].message.content || '{}';

  try {
    const parsed = JSON.parse(responseContent);
    const refArray = Array.isArray(parsed) ? parsed : (parsed.references || []);
    
    references = refArray.map((ref: any, idx: number) => ({
      id: ref.id || idx + 1,
      text: ref.text || ref.reference || String(ref),
      order: ref.order || ref.id || idx + 1,
    }));
  } catch (e) {
    console.error('[WRITER] Failed to parse references JSON, creating defaults');
    references = [
      { id: 1, text: 'BTEC National IT Student Book. Pearson Education.', order: 1 },
      { id: 2, text: 'Computing and IT. Cambridge University Press.', order: 2 },
      { id: 3, text: 'BBC Bitesize (2024) Computing Resources. Available at: https://www.bbc.co.uk/bitesize', order: 3 },
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

  console.log(`[WRITER] Generated ${references.length} structured references`);
  return references;
}
