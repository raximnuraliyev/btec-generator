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

interface GenerationPlan {
  introduction: {
    covers: string[];
    notes: string;
  };
  sections: Array<{
    id: string;
    title: string;
    learningAim: string;
    coversCriteria: string[];
    generationOrder: number;
  }>;
  tables: Array<{
    id: string;
    title: string;
    relatedTo: string[];
    placementAfterSectionId: string;
  }>;
  images: Array<{
    id: string;
    caption: string;
    relatedTo: string[];
    placementAfterSectionId: string;
  }>;
  conclusion: {
    covers: string[];
    generationOrder: number;
  };
  references: {
    requiredCount: number;
  };
}

const PLANNER_SYSTEM_PROMPT = `You are BTEC_ASSIGNMENT_PLANNER, a deterministic academic planning model.

Your ONLY responsibility is to analyze a locked assignment brief snapshot and produce a structured generation plan.

You MUST NOT:
- Write assignment content
- Paraphrase criteria
- Add new criteria
- Change wording of learning aims
- Generate prose, explanations, or examples

You MUST:
- Respect the brief snapshot as immutable truth
- Use ONLY the data provided
- Output STRICT JSON in the required schema
- Be deterministic and reproducible
- Use criterion codes EXACTLY as provided in the input (e.g., P1, M1, D1)

PLANNING RULES (CRITICAL):
1. Every criterion MUST be covered exactly once
2. Only include criteria allowed by targetGrade:
   - PASS → only pass criteria (P1, P2, etc.)
   - MERIT → pass + merit (P1, P2, M1, M2, etc.)
   - DISTINCTION → pass + merit + distinction (P1, P2, M1, M2, D1, D2, etc.)
3. Do NOT merge unrelated criteria
4. Keep academic flow: introduction → learning aims → conclusion
5. Tables and images must be tied to specific aims or criteria
6. Create one section per learning aim
7. Map criteria to their learning aims correctly

OUTPUT FORMAT (STRICT):
You MUST output a single JSON object matching this schema exactly:

{
  "introduction": {
    "covers": ["unit overview", "scenario context"],
    "notes": "Purpose of introduction"
  },
  "sections": [
    {
      "id": "A",
      "title": "Learning Aim A – [Title from brief]",
      "learningAim": "A",
      "coversCriteria": ["P1", "P2", "M1"],
      "generationOrder": 1
    },
    {
      "id": "B",
      "title": "Learning Aim B – [Title from brief]",
      "learningAim": "B",
      "coversCriteria": ["P3", "M2", "D1"],
      "generationOrder": 2
    }
  ],
  "tables": [
    {
      "id": "T1",
      "title": "Comparison table title",
      "relatedTo": ["P2"],
      "placementAfterSectionId": "A"
    }
  ],
  "images": [
    {
      "id": "I1",
      "caption": "Figure description",
      "relatedTo": ["P1"],
      "placementAfterSectionId": "A"
    }
  ],
  "conclusion": {
    "covers": ["summary", "reflection"],
    "generationOrder": 999
  },
  "references": {
    "requiredCount": 5
  }
}

FINAL INSTRUCTIONS:
- Output JSON ONLY
- No markdown
- No comments
- No explanations
- No prose
- No extra fields

If any required input is missing, output:
{ "error": "INVALID_BRIEF_SNAPSHOT" }`;

export async function generatePlan(
  briefSnapshot: BriefSnapshot,
  userId: string,
  assignmentId: string
): Promise<GenerationPlan> {
  const userPrompt = JSON.stringify(briefSnapshot, null, 2);

  console.log('[PLANNER] Generating plan for assignment:', assignmentId);

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

  const plan: GenerationPlan = JSON.parse(response);

  // Validate plan structure
  if ('error' in plan) {
    throw new Error(`Planner error: ${(plan as any).error}`);
  }

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

  console.log('[PLANNER] Plan generated successfully');
  return plan;
}
