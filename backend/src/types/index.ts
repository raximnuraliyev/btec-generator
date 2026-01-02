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
}

export interface Reference {
  text: string;
  order: number;
}

export interface ContentSection {
  heading: string;
  content: string;
  tables?: TableData[];
  images?: ImagePlaceholder[];
}

export interface GeneratedContent {
  introduction: string;
  sections: ContentSection[];
  conclusion: string;
  references: Reference[];
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
