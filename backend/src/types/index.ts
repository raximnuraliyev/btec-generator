// =============================================================================
// BTEC GENERATOR - BACKEND TYPES
// =============================================================================
// This file contains all TypeScript types for the backend.
// All legacy types have been removed.
// =============================================================================

import { 
  UserRole, 
  UserStatus,
  Grade, 
  AssignmentStatus, 
  Language, 
  BriefStatus,
  TokenPlanType,
  IssueCategory,
  IssueStatus
} from '@prisma/client';

// Re-export Prisma enums
export { 
  UserRole, 
  UserStatus,
  Grade, 
  AssignmentStatus, 
  Language, 
  BriefStatus,
  TokenPlanType,
  IssueCategory,
  IssueStatus
};

// =============================================================================
// ASSESSMENT CRITERIA
// =============================================================================

export interface CriterionItem {
  code: string;
  description: string;
}

export interface AssessmentCriteria {
  pass: CriterionItem[];
  merit: CriterionItem[];
  distinction: CriterionItem[];
}

// =============================================================================
// GENERATION TYPES
// =============================================================================

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

// =============================================================================
// ATOMIC CONTENT STRUCTURE
// =============================================================================
// Each item in the outline becomes a separate content block

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

// =============================================================================
// AUTH TYPES
// =============================================================================

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
    name: string | null;
    role: UserRole;
    status: UserStatus;
    tokenPlan: {
      planType: TokenPlanType;
      tokensRemaining: number;
      tokensPerMonth: number;
    } | null;
  };
}

// =============================================================================
// API TYPES
// =============================================================================

export interface APIError {
  error: string;
  message: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// =============================================================================
// ADMIN TYPES
// =============================================================================

export interface AdminStats {
  totals: {
    users: number;
    assignments: number;
    activeGenerations: number;
    briefs: number;
  };
  usersByRole: Record<string, number>;
  assignmentsByStatus: Record<string, number>;
  recentUsers: any[];
  recentAssignments: any[];
}

export interface SystemStatus {
  generationPaused: boolean;
  activeJobs: number;
  queuedJobs: number;
  failedJobsLast24h: number;
  averageGenerationTime: number;
  aiModelsHealth: {
    model: string;
    status: string;
    failRate: number;
  }[];
}

// =============================================================================
// BRIEF TYPES
// =============================================================================

export interface TaskBlock {
  id: string;
  title: string;
  description: string;
  criteria: string[];
}

export interface BriefData {
  subjectName: string;
  unitName: string;
  unitCode: string;
  level: number;
  semester: string;
  learningAims: string[];
  vocationalScenario: string;
  tasks: TaskBlock[];
  assessmentCriteria: AssessmentCriteria;
  checklistOfEvidence: string[];
  sourcesOfInformation: string[];
  status?: BriefStatus;
}

// =============================================================================
// TOKEN TYPES
// =============================================================================

export interface TokenBalance {
  userId: string;
  planType: TokenPlanType;
  tokensRemaining: number;
  tokensPerMonth: number;
  resetAt: Date | null;
  activatedAt: Date;
  expiresAt: Date | null;
}

export interface TokenUsageReport {
  totalUsed: number;
  byPurpose: Record<string, number>;
  byDay: { date: string; tokens: number }[];
}

