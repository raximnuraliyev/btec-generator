import { PrismaClient, Grade, UserRole, Language } from '@prisma/client';
import { GeneratedContent, ContentSection, Reference, AssessmentCriteria } from '../types';
import { getLanguagePromptInstructions, validateLanguageResponse } from '../utils/language';

const prisma = new PrismaClient();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const AI_MODEL = process.env.AI_MODEL || 'mistralai/devstral-2512:free';
const AI_MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS || '4000');

if (!OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY environment variable is not defined');
}

const getReferenceCount = (grade: Grade): number => {
  switch (grade) {
    case Grade.PASS:
      return 5;
    case Grade.MERIT:
      return 7;
    case Grade.DISTINCTION:
      return 10;
  }
};

const getCriteriaForGrade = (
  criteria: AssessmentCriteria,
  grade: Grade
): string[] => {
  switch (grade) {
    case Grade.PASS:
      return criteria.pass;
    case Grade.MERIT:
      return [...criteria.pass, ...criteria.merit];
    case Grade.DISTINCTION:
      return [...criteria.pass, ...criteria.merit, ...criteria.distinction];
  }
};

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
      learningAims: brief.learningAims,
      vocationalScenario: brief.vocationalScenario,
      tasks: brief.tasks,
      assessmentCriteria: brief.assessmentCriteria as any,
      checklistOfEvidence: brief.checklistOfEvidence,
      sourcesOfInformation: brief.sourcesOfInformation,
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

const generateContent = async (
  snapshot: any,
  grade: Grade,
  includeImages: boolean,
  includeTables: boolean,
  userId: string,
  userRole: UserRole,
  assignmentId: string
): Promise<{
  content: GeneratedContent;
  aiLogs: Array<{
    assignmentId: string;
    userId: string;
    userRole: UserRole;
    aiProvider: string;
    aiModel: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    purpose: string;
  }>;
  modelsUsed: string[];
}> => {
  const criteria = snapshot.assessmentCriteria as AssessmentCriteria;
  const applicableCriteria = getCriteriaForGrade(criteria, grade);
  const referenceCount = getReferenceCount(grade);
  const language = snapshot.language as Language;

  const aiLogs: Array<any> = [];
  const modelsUsed: string[] = [AI_MODEL];

  const languageInstructions = getLanguagePromptInstructions(language);

  const prompt = `You are an expert BTEC educator creating a comprehensive TEACHING GUIDE for students.

⚠️ CRITICAL: This is NOT an assignment submission. This is a TEACHING GUIDE that explains HOW to approach each criterion.

${languageInstructions}

UNIT INFORMATION:
Unit Name: ${snapshot.unitName}
Unit Code: ${snapshot.unitCode}
Level: ${snapshot.level}
Grade Target: ${grade}

SCENARIO:
${snapshot.vocationalScenario}

LEARNING AIMS:
${snapshot.learningAims.map((aim: string, i: number) => `${i + 1}. ${aim}`).join('\n')}

ASSESSMENT CRITERIA TO COVER:
${applicableCriteria.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}

YOUR TASK:
For EACH criterion, provide a TEACHING GUIDE that includes:

1. **What the criterion means** (plain language explanation)
2. **How to approach it** (step-by-step guidance)
3. **What evidence is expected** (examples of what examiners look for)
4. **Common mistakes to avoid**

STRUCTURE:
- Introduction (purpose of this guide)
- Section for each learning aim with criterion explanations
- Conclusion (summary and final advice)
- ${referenceCount} Oxford-style academic references

${includeTables ? 'Include structured tables to organize information. Tables must have: clear headers, centered content, and descriptive captions.' : ''}
${includeImages ? 'Suggest logical image placements with academic captions. Format: [Image: description]. Each image must have a clear educational purpose.' : ''}

Remember: You are TEACHING students how to do their assignment, NOT doing it for them.

Use clear, educational, supportive tone in the selected language.`;

  let generatedText = '';
  let retryCount = 0;
  const maxRetries = 1;

  while (retryCount <= maxRetries) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: AI_MAX_TOKENS,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    generatedText = data.choices[0]?.message?.content || '';
    const usage = data.usage || {};

    // Log AI usage
    aiLogs.push({
      assignmentId,
      userId,
      userRole,
      aiProvider: 'OpenRouter',
      aiModel: AI_MODEL,
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
      purpose: retryCount === 0 ? 'GENERATION' : `GENERATION_RETRY_${retryCount}`,
    });

    // Validate language
    if (validateLanguageResponse(generatedText, language)) {
      break; // Language is correct
    }

    // If wrong language and we have retries left
    if (retryCount < maxRetries) {
      retryCount++;
      continue;
    }

    // No more retries, fail
    throw new Error(`AI generated content in wrong language after ${maxRetries + 1} attempts. Expected: ${language}`);
  }

  // Parse the generated content into structured format
  const content = parseGeneratedContent(
    generatedText,
    snapshot.learningAims,
    referenceCount,
    includeImages,
    includeTables
  );

  return { content, aiLogs, modelsUsed };
};

const parseGeneratedContent = (
  text: string,
  learningAims: string[],
  referenceCount: number,
  includeImages: boolean,
  includeTables: boolean
): GeneratedContent => {
  // Simple parsing logic - extract introduction, sections, conclusion, references
  const lines = text.split('\n');
  
  let introduction = '';
  const sections: ContentSection[] = [];
  let conclusion = '';
  const references: Reference[] = [];

  let currentSection: ContentSection | null = null;
  let inIntroduction = true;
  let inConclusion = false;
  let inReferences = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.toLowerCase().includes('introduction')) {
      inIntroduction = true;
      continue;
    }

    if (trimmed.toLowerCase().includes('conclusion')) {
      inIntroduction = false;
      inConclusion = true;
      continue;
    }

    if (trimmed.toLowerCase().includes('reference')) {
      inIntroduction = false;
      inConclusion = false;
      inReferences = true;
      continue;
    }

    if (trimmed.startsWith('Learning Aim') || learningAims.some(aim => trimmed.includes(aim))) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        heading: trimmed,
        content: '',
        tables: includeTables ? [] : undefined,
        images: includeImages ? [] : undefined,
      };
      inIntroduction = false;
      continue;
    }

    if (inIntroduction && trimmed) {
      introduction += trimmed + '\n';
    } else if (inConclusion && trimmed) {
      conclusion += trimmed + '\n';
    } else if (inReferences && trimmed) {
      if (references.length < referenceCount) {
        references.push({
          text: trimmed,
          order: references.length + 1,
        });
      }
    } else if (currentSection && trimmed) {
      currentSection.content += trimmed + '\n';
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  // Ensure we have the required number of references
  while (references.length < referenceCount) {
    references.push({
      text: `Reference ${references.length + 1}: [Placeholder - Oxford format reference]`,
      order: references.length + 1,
    });
  }

  return {
    introduction: introduction.trim() || 'Introduction to the assignment.',
    sections,
    conclusion: conclusion.trim() || 'Conclusion and final recommendations.',
    references,
  };
};

const estimateTokens = (content: GeneratedContent): number => {
  // Rough estimation: 1 token ≈ 4 characters
  const text = JSON.stringify(content);
  return Math.ceil(text.length / 4);
};

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
      snapshot: {
        select: {
          id: true,
          unitName: true,
          unitCode: true,
          subjectName: true,
          level: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return assignments;
};

const detectAbuse = async (userId: string): Promise<void> => {
  // Get user's recent assignments (last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentAssignments = await prisma.assignment.findMany({
    where: {
      userId,
      createdAt: { gte: oneHourAgo },
    },
  });

  // Flag if too many generations in short time
  if (recentAssignments.length >= 5) {
    await prisma.userFlag.create({
      data: {
        userId,
        reason: 'EXCESSIVE_GENERATION',
        description: `${recentAssignments.length} assignments generated in the last hour`,
        severity: 'MEDIUM',
      },
    });
  }

  // Check for repeated token limit hits
  const failedAssignments = await prisma.assignment.count({
    where: {
      userId,
      status: 'FAILED',
      error: { contains: 'Insufficient tokens' },
      createdAt: { gte: oneHourAgo },
    },
  });

  if (failedAssignments >= 3) {
    await prisma.userFlag.create({
      data: {
        userId,
        reason: 'REPEATED_TOKEN_FAILURES',
        description: `${failedAssignments} failed attempts due to insufficient tokens`,
        severity: 'LOW',
      },
    });
  }
};
