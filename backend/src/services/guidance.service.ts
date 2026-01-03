import OpenAI from 'openai';
import { logAIUsage } from './admin.service';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const GUIDANCE_MODEL = process.env.AI_MODEL || 'qwen/qwen-2.5-72b-instruct:free';

interface LearningAim {
  code: string;
  title: string;
}

interface Criterion {
  code: string;
  description: string;
}

interface GuidanceInput {
  unitName: string;
  unitCode: string;
  level: number;
  learningAims: LearningAim[];
  passCriteria: Criterion[];
  meritCriteria: Criterion[];
  distinctionCriteria: Criterion[];
  vocationalScenario: string;
  targetGrade: 'PASS' | 'MERIT' | 'DISTINCTION';
  language: string;
}

interface OverviewGuidance {
  whatThisIsAbout: string;
  whatAssessorLooksFor: string[];
  howToStructure: string;
  howToReachGrade: string;
}

interface CriterionGuidance {
  criterionCode: string;
  criterionGoal: string;
  whatToInclude: string[];
  howToApproach: string;
  commonMistakes: string[];
  gradeDepthReminder: string;
}

export interface WritingGuidance {
  overview: OverviewGuidance;
  criteriaGuidance: CriterionGuidance[];
}

/**
 * Generate Assignment Writing Guidance
 * This is SEPARATE from assignment content and teaches students HOW to write
 */
export const generateWritingGuidance = async (
  input: GuidanceInput,
  assignmentId: string
): Promise<WritingGuidance> => {
  console.log('[GUIDANCE] Generating writing guidance for assignment:', assignmentId);

  // Generate overview guidance
  const overview = await generateOverviewGuidance(input, assignmentId);

  // Generate criterion-specific guidance
  const criteriaGuidance = await generateCriteriaGuidance(input, assignmentId);

  console.log('[GUIDANCE] Guidance generation complete');
  
  return {
    overview,
    criteriaGuidance,
  };
};

/**
 * Generate high-level overview guidance (Section 1)
 */
const generateOverviewGuidance = async (
  input: GuidanceInput,
  assignmentId: string
): Promise<OverviewGuidance> => {
  const { unitName, unitCode, level, learningAims, vocationalScenario, targetGrade, language } = input;

  const learningAimsText = learningAims
    .map((aim) => `- ${aim.code}: ${aim.title}`)
    .join('\n');

  const prompt = `You are an educational guidance system. Generate INSTRUCTIONAL GUIDANCE to teach a student how to approach writing a BTEC assignment.

DO NOT write the assignment itself. DO NOT provide ready-made answers. Only teach HOW to write.

Unit: ${unitName} (${unitCode})
Level: ${level}
Target Grade: ${targetGrade}
Language: ${language}
Vocational Context: ${vocationalScenario}

Learning Aims:
${learningAimsText}

Generate guidance in ${language} with these FOUR sections:

1. WHAT THIS ASSIGNMENT IS ABOUT (1 paragraph)
Explain:
- The unit topic
- The vocational context
- Why this assignment exists
- What knowledge area it covers

2. WHAT YOUR ASSESSOR IS LOOKING FOR (bullet points)
Explain what the assessor values:
- Clarity and structure
- Relevant examples
- Appropriate depth for ${targetGrade} grade
- Proper referencing
- Application to context

3. HOW TO STRUCTURE YOUR ASSIGNMENT (descriptive paragraphs)
Explain the expected structure:
- Introduction (purpose and overview)
- Learning aim sections (one per aim)
- Criterion responses (within learning aims)
- Conclusion (summary and reflection)
- References (Oxford style)

4. HOW TO REACH YOUR SELECTED GRADE (${targetGrade})
${
  targetGrade === 'PASS'
    ? 'For Pass: Explain concepts clearly with relevant examples from the scenario'
    : targetGrade === 'MERIT'
    ? 'For Merit: Analyse and compare different approaches, showing understanding of connections'
    : 'For Distinction: Evaluate strengths and limitations, justify decisions, and provide critical reflection'
}

Return as JSON:
{
  "whatThisIsAbout": "paragraph text",
  "whatAssessorLooksFor": ["point 1", "point 2", ...],
  "howToStructure": "paragraph text",
  "howToReachGrade": "paragraph text"
}`;

  const completion = await openrouter.chat.completions.create({
    model: GUIDANCE_MODEL,
    messages: [
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  await logAIUsage(assignmentId, 'guidance_overview', GUIDANCE_MODEL, {
    promptTokens: completion.usage?.prompt_tokens || 0,
    completionTokens: completion.usage?.completion_tokens || 0,
    totalTokens: completion.usage?.total_tokens || 0,
  });
  
  const responseContent = completion.choices[0].message.content || '';
  
  // Parse JSON from response
  const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse guidance overview JSON');
  }

  return JSON.parse(jsonMatch[0]);
};

/**
 * Determine grade level from criterion code
 */
const getGradeLevelFromCode = (code: string): 'P' | 'M' | 'D' => {
  if (code.toUpperCase().includes('P')) return 'P';
  if (code.toUpperCase().includes('M')) return 'M';
  if (code.toUpperCase().includes('D')) return 'D';
  return 'P'; // Default to Pass
};

/**
 * Generate criterion-specific guidance (Section 2)
 */
const generateCriteriaGuidance = async (
  input: GuidanceInput,
  assignmentId: string
): Promise<CriterionGuidance[]> => {
  const { targetGrade } = input;
  
  // Determine which criteria to include based on target grade
  let criteriaToTeach: Criterion[] = [...input.passCriteria];
  
  if (targetGrade === 'MERIT' || targetGrade === 'DISTINCTION') {
    criteriaToTeach = [...criteriaToTeach, ...input.meritCriteria];
  }
  
  if (targetGrade === 'DISTINCTION') {
    criteriaToTeach = [...criteriaToTeach, ...input.distinctionCriteria];
  }

  const guidancePromises = criteriaToTeach.map((criterion) => {
    const gradeLevel = getGradeLevelFromCode(criterion.code);
    return generateSingleCriterionGuidance(criterion, input, gradeLevel, assignmentId);
  });

  return Promise.all(guidancePromises);
};

/**
 * Generate guidance for a single criterion
 */
const generateSingleCriterionGuidance = async (
  criterion: Criterion,
  input: GuidanceInput,
  gradeLevel: 'P' | 'M' | 'D',
  assignmentId: string
): Promise<CriterionGuidance> => {
  const { unitName, vocationalScenario, targetGrade, language } = input;

  // gradeLevel is already provided as parameter, no need to redeclare

  const prompt = `You are an educational guidance system. Generate TEACHING GUIDANCE for how to satisfy this assessment criterion.

DO NOT write the actual assignment content. Only teach HOW to approach it.

Unit: ${unitName}
Criterion: ${criterion.code}
Description: ${criterion.description}
Context: ${vocationalScenario}
Target Grade: ${targetGrade}
Language: ${language}

Generate guidance in ${language} with these FIVE sections:

1. CRITERION GOAL (Plain English)
Rewrite what this criterion asks for in student-friendly language.
Start with: "This criterion requires you to..."

2. WHAT YOU SHOULD INCLUDE (bullet points)
Topics, concepts, examples to cover.
NO full sentences that could be copy-pasted.

3. HOW TO APPROACH WRITING IT (step-by-step)
Break down the writing process:
- Step 1: Define key concepts
- Step 2: Explain mechanisms
- Step 3: Provide examples
- Step 4: Link to scenario

4. COMMON MISTAKES TO AVOID (bullet points)
${
  gradeLevel === 'P'
    ? '- Being too vague or generic\n- Missing examples\n- Not relating to the scenario'
    : gradeLevel === 'M'
    ? '- Lack of comparison or analysis\n- Describing without analyzing\n- Weak connections between ideas'
    : '- Opinion without justification\n- Missing evaluation of strengths/limitations\n- Lack of critical reflection'
}

5. GRADE-SPECIFIC DEPTH REMINDER (1 sentence)
${
  gradeLevel === 'P'
    ? 'To achieve Pass, ensure your explanations are clear and supported by relevant examples.'
    : gradeLevel === 'M'
    ? 'To achieve Merit, go beyond description to compare and analyze different approaches.'
    : 'To achieve Distinction, evaluate strengths and limitations and justify your conclusions.'
}

Return as JSON:
{
  "criterionCode": "${criterion.code}",
  "criterionGoal": "text",
  "whatToInclude": ["item 1", "item 2", ...],
  "howToApproach": "step text",
  "commonMistakes": ["mistake 1", "mistake 2", ...],
  "gradeDepthReminder": "text"
}`;

  const completion = await openrouter.chat.completions.create({
    model: GUIDANCE_MODEL,
    messages: [
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  await logAIUsage(assignmentId, `guidance_criterion_${criterion.code}`, GUIDANCE_MODEL, {
    promptTokens: completion.usage?.prompt_tokens || 0,
    completionTokens: completion.usage?.completion_tokens || 0,
    totalTokens: completion.usage?.total_tokens || 0,
  });
  
  const responseContent = completion.choices[0].message.content || '';
  
  const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Failed to parse guidance JSON for ${criterion.code}`);
  }

  return JSON.parse(jsonMatch[0]);
};
