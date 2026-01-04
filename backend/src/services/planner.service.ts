import OpenAI from 'openai';
import { prisma } from '../lib/prisma';
import { logAIUsage } from './admin.service';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const PLANNER_MODEL = process.env.AI_MODEL || 'qwen/qwen-2.5-72b-instruct:free';

interface BriefSnapshot {
  unitName: string;
  unitCode: string;
  level: number;
  scenario: string;
  learningAims: any[];
  assessmentCriteria: {
    pass: Array<{ code: string; description: string }>;
    merit: Array<{ code: string; description: string }>;
    distinction: Array<{ code: string; description: string }>;
  };
  checklistOfEvidence?: string[];
  sources?: string[];
  targetGrade: 'PASS' | 'MERIT' | 'DISTINCTION';
  language: string;
  options: {
    includeTables: boolean;
    includeImages: boolean;
  };
}

/**
 * NEW ATOMIC OUTLINE ITEM TYPES
 * Each item = ONE heading + ONE content block in DOCX
 */
export type OutlineItemType = 
  | 'INTRODUCTION'
  | 'LEARNING_AIM'
  | 'CRITERION'
  | 'CONCLUSION'
  | 'REFERENCES';

export interface OutlineItem {
  type: OutlineItemType;
  title?: string;           // For INTRODUCTION, CONCLUSION, REFERENCES
  aimCode?: string;         // For LEARNING_AIM, CRITERION (e.g., "A", "B")
  aimTitle?: string;        // For LEARNING_AIM (e.g., "Learning Aim A: Understand AI systems")
  criterionCode?: string;   // For CRITERION (e.g., "A.P1", "A.M1")
  criterionTitle?: string;  // For CRITERION (e.g., "A.P1 Describe the key components...")
  criterionDescription?: string; // Full criterion description for AI context
}

export interface TableRequirement {
  criterionCode: string;
  tableType: string;
}

export interface ImageSuggestion {
  criterionCode: string;
  imageType: string;
}

export interface GenerationPlan {
  documentOutline: OutlineItem[];
  tablesRequired: TableRequirement[];
  imagesSuggested: ImageSuggestion[];
  // Legacy fields for backward compatibility
  introduction?: any;
  sections?: any[];
  tables?: any[];
  images?: any[];
  conclusion?: any;
  references?: any;
}

const PLANNER_SYSTEM_PROMPT = `You are BTEC_ASSIGNMENT_PLANNER, a deterministic academic planning model.

Your ONLY responsibility is to create an ATOMIC DOCUMENT OUTLINE where:
- EACH criterion = ONE separate item in the outline
- EACH item becomes ONE heading + ONE content block in the final document
- NO blob writing (never group criteria under a single learning aim text)

You MUST NOT:
- Write assignment content
- Group multiple criteria together
- Skip any criteria based on target grade
- Change wording of criteria
- Generate prose or examples

You MUST:
- Output ONE outline item per criterion
- Include LEARNING_AIM items as section headers BEFORE their criteria
- Respect the brief snapshot as immutable truth
- Use criterion codes EXACTLY as provided (with aim letter prefix, e.g., A.P1, A.M1)
- Output STRICT JSON in the required schema

PLANNING RULES (CRITICAL):
1. INTRODUCTION first, then LEARNING_AIMS + CRITERIA, then CONCLUSION, then REFERENCES
2. Each LEARNING_AIM is followed by its CRITERION items
3. Only include criteria allowed by targetGrade:
   - PASS → only pass criteria (P1, P2, etc.)
   - MERIT → pass + merit criteria
   - DISTINCTION → pass + merit + distinction criteria
4. Each criterion gets its OWN outline item
5. Map criteria to correct learning aims using the prefix letter

OUTPUT FORMAT (STRICT - THIS IS THE CONTRACT):
{
  "documentOutline": [
    {
      "type": "INTRODUCTION",
      "title": "Introduction"
    },
    {
      "type": "LEARNING_AIM",
      "aimCode": "A",
      "aimTitle": "Learning Aim A: [Title from brief]"
    },
    {
      "type": "CRITERION",
      "aimCode": "A",
      "criterionCode": "A.P1",
      "criterionTitle": "A.P1 [Criterion description]",
      "criterionDescription": "[Full description from brief]"
    },
    {
      "type": "CRITERION",
      "aimCode": "A",
      "criterionCode": "A.P2",
      "criterionTitle": "A.P2 [Criterion description]",
      "criterionDescription": "[Full description from brief]"
    },
    {
      "type": "CRITERION",
      "aimCode": "A",
      "criterionCode": "A.M1",
      "criterionTitle": "A.M1 [Criterion description]",
      "criterionDescription": "[Full description from brief]"
    },
    {
      "type": "LEARNING_AIM",
      "aimCode": "B",
      "aimTitle": "Learning Aim B: [Title from brief]"
    },
    {
      "type": "CRITERION",
      "aimCode": "B",
      "criterionCode": "B.P3",
      "criterionTitle": "B.P3 [Criterion description]",
      "criterionDescription": "[Full description from brief]"
    },
    {
      "type": "CONCLUSION",
      "title": "Conclusion"
    },
    {
      "type": "REFERENCES",
      "title": "References"
    }
  ],
  "tablesRequired": [
    {
      "criterionCode": "A.M1",
      "tableType": "Comparison"
    }
  ],
  "imagesSuggested": [
    {
      "criterionCode": "A.P2",
      "imageType": "System Flow Diagram"
    }
  ]
}

TABLE/IMAGE RULES:
- Tables are best for MERIT criteria (comparison, analysis)
- Images are best for PASS criteria (explanation diagrams)
- Link each table/image to a SPECIFIC criterionCode
- Only suggest if includeTables/includeImages is true

FINAL INSTRUCTIONS:
- Output JSON ONLY
- No markdown, no comments, no explanations
- Every criterion MUST have its own CRITERION item
- Use the learning aim letter prefix for all criterion codes

If any required input is missing, output:
{ "error": "INVALID_BRIEF_SNAPSHOT" }`;

export async function generatePlan(
  briefSnapshot: BriefSnapshot,
  userId: string,
  assignmentId: string
): Promise<GenerationPlan> {
  const userPrompt = JSON.stringify(briefSnapshot, null, 2);

  console.log('[PLANNER] Generating atomic document outline for assignment:', assignmentId);

  const completion = await openrouter.chat.completions.create({
    model: PLANNER_MODEL,
    messages: [
      { role: 'system', content: PLANNER_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.1, // Low temperature for deterministic output
    response_format: { type: 'json_object' },
  });

  const response = completion.choices[0].message.content;
  if (!response) {
    throw new Error('No response from planner model');
  }

  let plan: GenerationPlan = JSON.parse(response);

  // Validate plan structure
  if ('error' in plan) {
    throw new Error(`Planner error: ${(plan as any).error}`);
  }

  // If AI returned old format, convert to new atomic format
  if (!plan.documentOutline && plan.sections) {
    console.log('[PLANNER] Converting legacy plan format to atomic outline');
    plan = convertLegacyPlanToAtomic(plan, briefSnapshot);
  }

  // Validate atomic structure
  if (!plan.documentOutline || plan.documentOutline.length === 0) {
    console.log('[PLANNER] Plan missing documentOutline, building from brief');
    plan = buildAtomicPlanFromBrief(briefSnapshot);
  }

  console.log('[PLANNER] Document outline items:', plan.documentOutline.length);
  console.log('[PLANNER] Outline structure:', plan.documentOutline.map(i => `${i.type}:${i.criterionCode || i.aimCode || i.title}`).join(' → '));

  // Log AI usage
  await logAIUsage({
    assignmentId,
    userId,
    userRole: 'USER', // Will be updated by caller if needed
    aiProvider: 'openrouter',
    aiModel: PLANNER_MODEL,
    promptTokens: completion.usage?.prompt_tokens || 0,
    completionTokens: completion.usage?.completion_tokens || 0,
    totalTokens: completion.usage?.total_tokens || 0,
    purpose: 'PLANNER',
  });

  // Save plan to database
  await prisma.generationPlan.create({
    data: {
      assignmentId,
      planData: plan as any,
      tokensUsed: completion.usage?.total_tokens || 0,
    },
  });

  console.log('[PLANNER] Atomic plan generated successfully');
  return plan;
}

/**
 * Convert legacy plan format (sections with coversCriteria) to atomic outline
 */
function convertLegacyPlanToAtomic(legacyPlan: any, briefSnapshot: BriefSnapshot): GenerationPlan {
  const outline: OutlineItem[] = [];
  
  // Add introduction
  outline.push({ type: 'INTRODUCTION', title: 'Introduction' });
  
  // Process each section (learning aim)
  for (const section of (legacyPlan.sections || [])) {
    const aimLetter = section.learningAim || section.id || 'A';
    const learningAim = briefSnapshot.learningAims.find(
      (a: any) => a.code === aimLetter || a.letter === aimLetter
    );
    
    // Add learning aim header
    outline.push({
      type: 'LEARNING_AIM',
      aimCode: aimLetter,
      aimTitle: `Learning Aim ${aimLetter}: ${learningAim?.title || learningAim?.description || section.title || ''}`
    });
    
    // Add each criterion as separate item
    for (const criterionCode of (section.coversCriteria || [])) {
      const criterion = findCriterionInBrief(briefSnapshot.assessmentCriteria, criterionCode);
      const fullCode = criterionCode.includes('.') ? criterionCode : `${aimLetter}.${criterionCode}`;
      
      outline.push({
        type: 'CRITERION',
        aimCode: aimLetter,
        criterionCode: fullCode,
        criterionTitle: `${fullCode} ${criterion?.description || ''}`.substring(0, 80),
        criterionDescription: criterion?.description || ''
      });
    }
  }
  
  // Add conclusion and references
  outline.push({ type: 'CONCLUSION', title: 'Conclusion' });
  outline.push({ type: 'REFERENCES', title: 'References' });
  
  // Convert tables
  const tablesRequired: TableRequirement[] = (legacyPlan.tables || []).map((t: any) => ({
    criterionCode: t.relatedTo?.[0] || 'A.M1',
    tableType: t.title || 'Comparison'
  }));
  
  // Convert images
  const imagesSuggested: ImageSuggestion[] = (legacyPlan.images || []).map((i: any) => ({
    criterionCode: i.relatedTo?.[0] || 'A.P1',
    imageType: i.caption || 'Diagram'
  }));
  
  return { documentOutline: outline, tablesRequired, imagesSuggested };
}

/**
 * Build atomic plan directly from brief snapshot (fallback)
 */
function buildAtomicPlanFromBrief(briefSnapshot: BriefSnapshot): GenerationPlan {
  const outline: OutlineItem[] = [];
  const tablesRequired: TableRequirement[] = [];
  const imagesSuggested: ImageSuggestion[] = [];
  
  // Add introduction
  outline.push({ type: 'INTRODUCTION', title: 'Introduction' });
  
  // Determine which criteria to include based on target grade
  let criteriaToInclude: Array<{ code: string; description: string; grade: string }> = [];
  
  for (const c of briefSnapshot.assessmentCriteria.pass) {
    criteriaToInclude.push({ ...c, grade: 'PASS' });
  }
  
  if (briefSnapshot.targetGrade === 'MERIT' || briefSnapshot.targetGrade === 'DISTINCTION') {
    for (const c of briefSnapshot.assessmentCriteria.merit) {
      criteriaToInclude.push({ ...c, grade: 'MERIT' });
    }
  }
  
  if (briefSnapshot.targetGrade === 'DISTINCTION') {
    for (const c of briefSnapshot.assessmentCriteria.distinction) {
      criteriaToInclude.push({ ...c, grade: 'DISTINCTION' });
    }
  }
  
  // Group criteria by learning aim
  const criteriaByAim: Record<string, typeof criteriaToInclude> = {};
  for (const criterion of criteriaToInclude) {
    // Extract aim letter from criterion code (e.g., "A.P1" → "A", "P1" → "A" default)
    let aimLetter = 'A';
    if (criterion.code.includes('.')) {
      aimLetter = criterion.code.split('.')[0];
    } else {
      // Try to match to learning aim based on prefix pattern
      const match = criterion.code.match(/^([A-Z])?[PMD]\d+$/i);
      if (match && match[1]) {
        aimLetter = match[1].toUpperCase();
      }
    }
    
    if (!criteriaByAim[aimLetter]) {
      criteriaByAim[aimLetter] = [];
    }
    criteriaByAim[aimLetter].push(criterion);
  }
  
  // Generate outline for each learning aim
  const aimLetters = Object.keys(criteriaByAim).sort();
  
  for (const aimLetter of aimLetters) {
    const learningAim = briefSnapshot.learningAims.find(
      (a: any) => a.code === aimLetter || a.letter === aimLetter || a.code?.startsWith(aimLetter)
    );
    
    // Add learning aim header
    outline.push({
      type: 'LEARNING_AIM',
      aimCode: aimLetter,
      aimTitle: `Learning Aim ${aimLetter}: ${learningAim?.title || learningAim?.description || `Section ${aimLetter}`}`
    });
    
    // Add each criterion
    for (const criterion of criteriaByAim[aimLetter]) {
      const fullCode = criterion.code.includes('.') ? criterion.code : `${aimLetter}.${criterion.code}`;
      
      outline.push({
        type: 'CRITERION',
        aimCode: aimLetter,
        criterionCode: fullCode,
        criterionTitle: `${fullCode} ${criterion.description}`.substring(0, 80),
        criterionDescription: criterion.description
      });
      
      // Add table for merit criteria if tables enabled
      if (criterion.grade === 'MERIT' && briefSnapshot.options.includeTables) {
        tablesRequired.push({
          criterionCode: fullCode,
          tableType: 'Comparison'
        });
      }
      
      // Add image for pass criteria if images enabled
      if (criterion.grade === 'PASS' && briefSnapshot.options.includeImages && imagesSuggested.length < 3) {
        imagesSuggested.push({
          criterionCode: fullCode,
          imageType: 'Explanatory Diagram'
        });
      }
    }
  }
  
  // Add conclusion and references
  outline.push({ type: 'CONCLUSION', title: 'Conclusion' });
  outline.push({ type: 'REFERENCES', title: 'References' });
  
  return { documentOutline: outline, tablesRequired, imagesSuggested };
}

/**
 * Find criterion by code across all grade levels
 */
function findCriterionInBrief(assessmentCriteria: any, code: string): any {
  const cleanCode = code.replace(/^[A-Z]\./, ''); // Remove aim prefix if present
  const allCriteria = [
    ...(assessmentCriteria.pass || []),
    ...(assessmentCriteria.merit || []),
    ...(assessmentCriteria.distinction || []),
  ];

  return allCriteria.find((c: any) => 
    c.code === code || 
    c.code === cleanCode ||
    c.code?.toUpperCase() === code?.toUpperCase() ||
    c.code?.toUpperCase() === cleanCode?.toUpperCase()
  );
}
