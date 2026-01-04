import { UserRole, Plan, Grade, AssignmentStatus, Language } from '@prisma/client';

export { UserRole, Plan, Grade, AssignmentStatus, Language };

export interface AssessmentCriteria {
  pass: string[];
  merit: string[];
  distinction: string[];
}

export interface GenerationOptions {
  includeImages: boolean;
  includeTables: boolean;
}

export interface TableData {
  caption: string;
  headers: string[];
  rows: string[][];
}

export interface ImagePlaceholder {
  description: string;
  figureNumber?: number;
  caption?: string;
}

export interface Reference {
  id?: number;
  text: string;
  order: number;
}

export interface CriterionBlock {
  code: string;
  content: string;
  description?: string;
}

export interface ContentSection {
  heading: string;
  content: string;
  criteria?: CriterionBlock[];
  tables?: TableData[];
  images?: ImagePlaceholder[];
}

/**
 * NEW ATOMIC CONTENT STRUCTURE
 * Each item in the outline becomes a separate content block
 */
export type ContentBlockType = 
  | 'INTRODUCTION'
  | 'LEARNING_AIM'
  | 'CRITERION'
  | 'CONCLUSION'
  | 'REFERENCES';

export interface AtomicContentBlock {
  type: ContentBlockType;
  // For INTRODUCTION, CONCLUSION
  title?: string;
  content?: string;
  // For LEARNING_AIM
  aimCode?: string;
  aimTitle?: string;
  aimContent?: string;
  // For CRITERION
  criterionCode?: string;
  criterionTitle?: string;
  criterionContent?: string;
  table?: TableData;
  image?: ImagePlaceholder;
  // For REFERENCES
  references?: Reference[];
}

export interface GeneratedContent {
  introduction: string;
  sections: ContentSection[];
  conclusion: string;
  references: Reference[];
  // New atomic structure (preferred)
  atomicBlocks?: AtomicContentBlock[];
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    trialTokens: number;
    plan: Plan | null;
  };
}

export interface APIError {
  error: string;
  message: string;
  details?: unknown;
}
