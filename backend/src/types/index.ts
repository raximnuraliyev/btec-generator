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
  IssueStatus,
  PaymentStatus,
  PaymentMethod,
  PaymentPlanType
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
  IssueStatus,
  PaymentStatus,
  PaymentMethod,
  PaymentPlanType
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
  requiredInputs?: InputFieldDefinition[];
  status?: BriefStatus;
}

// =============================================================================
// STUDENT INPUT REQUIREMENTS (Teacher-defined schema)
// =============================================================================
// Teachers define what inputs students must provide before generation

export type InputFieldType = 
  | 'text'           // Single line text
  | 'textarea'       // Multi-line text
  | 'select'         // Dropdown with options
  | 'multiselect'    // Multiple selection
  | 'number'         // Numeric input
  | 'boolean'        // Yes/No toggle
  | 'array';         // List of items (e.g., features, tools)

export interface InputFieldDefinition {
  id: string;                      // Unique identifier (e.g., 'projectType', 'toolsUsed')
  label: string;                   // Display label
  type: InputFieldType;
  required: boolean;
  placeholder?: string;            // Helper text
  description?: string;            // Detailed description shown below input
  options?: string[];              // For select/multiselect types
  minLength?: number;              // For text/textarea
  maxLength?: number;              // For text/textarea
  minItems?: number;               // For array type
  maxItems?: number;               // For array type
  category?: string;               // Grouping category (e.g., 'Project Details', 'Technical Info')
}

// Common predefined input templates for different assignment types
export const INPUT_TEMPLATES = {
  programming: [
    { id: 'projectType', label: 'Project Type', type: 'select' as InputFieldType, required: true, options: ['Website', 'Console Application', 'Desktop Application', 'Mobile App', 'API/Backend'], category: 'Project Details' },
    { id: 'projectDescription', label: 'Project Description', type: 'textarea' as InputFieldType, required: true, placeholder: 'Describe your project in detail...', minLength: 100, category: 'Project Details' },
    { id: 'programmingLanguages', label: 'Programming Languages Used', type: 'array' as InputFieldType, required: true, minItems: 1, placeholder: 'e.g., Python, JavaScript', category: 'Technical Details' },
    { id: 'frameworks', label: 'Frameworks/Libraries Used', type: 'array' as InputFieldType, required: false, placeholder: 'e.g., React, Django', category: 'Technical Details' },
    { id: 'databaseUsed', label: 'Database', type: 'select' as InputFieldType, required: false, options: ['None', 'MySQL', 'PostgreSQL', 'MongoDB', 'SQLite', 'Firebase', 'Other'], category: 'Technical Details' },
    { id: 'keyFeatures', label: 'Key Features Implemented', type: 'array' as InputFieldType, required: true, minItems: 3, placeholder: 'e.g., User authentication, Data validation', category: 'Features' },
    { id: 'challengesFaced', label: 'Challenges and How You Solved Them', type: 'textarea' as InputFieldType, required: true, minLength: 50, placeholder: 'Describe challenges you encountered...', category: 'Reflection' },
    { id: 'diagramsProvided', label: 'Diagrams Included', type: 'multiselect' as InputFieldType, required: false, options: ['Flowchart', 'ERD', 'Class Diagram', 'Use Case Diagram', 'System Architecture', 'None'], category: 'Documentation' },
  ],
  bigData: [
    { id: 'datasetName', label: 'Dataset Name', type: 'text' as InputFieldType, required: true, category: 'Dataset Information' },
    { id: 'datasetSource', label: 'Dataset Source', type: 'text' as InputFieldType, required: true, placeholder: 'e.g., Kaggle, UCI ML Repository', category: 'Dataset Information' },
    { id: 'datasetSize', label: 'Dataset Size (rows/records)', type: 'text' as InputFieldType, required: true, category: 'Dataset Information' },
    { id: 'toolsUsed', label: 'Tools/Technologies Used', type: 'array' as InputFieldType, required: true, minItems: 1, placeholder: 'e.g., Python, Pandas, Spark', category: 'Technical Details' },
    { id: 'cleaningSteps', label: 'Data Cleaning Steps Performed', type: 'textarea' as InputFieldType, required: true, minLength: 50, category: 'Methodology' },
    { id: 'analysisTechniques', label: 'Analysis Techniques Used', type: 'array' as InputFieldType, required: true, minItems: 1, placeholder: 'e.g., Regression, Clustering', category: 'Methodology' },
    { id: 'visualisationsCreated', label: 'Visualisations Created', type: 'array' as InputFieldType, required: false, placeholder: 'e.g., Bar chart, Scatter plot', category: 'Results' },
    { id: 'keyFindings', label: 'Key Findings/Insights', type: 'textarea' as InputFieldType, required: true, minLength: 100, category: 'Results' },
    { id: 'limitations', label: 'Limitations of Your Analysis', type: 'textarea' as InputFieldType, required: true, minLength: 50, category: 'Reflection' },
  ],
  business: [
    { id: 'companyName', label: 'Company/Organisation Name', type: 'text' as InputFieldType, required: true, placeholder: 'Real or fictional company', category: 'Business Context' },
    { id: 'industry', label: 'Industry', type: 'text' as InputFieldType, required: true, placeholder: 'e.g., Retail, Healthcare', category: 'Business Context' },
    { id: 'businessProblem', label: 'Business Problem Addressed', type: 'textarea' as InputFieldType, required: true, minLength: 100, category: 'Problem Analysis' },
    { id: 'solutionProposed', label: 'Solution Proposed', type: 'textarea' as InputFieldType, required: true, minLength: 100, category: 'Solution' },
    { id: 'methodsUsed', label: 'Research/Analysis Methods Used', type: 'array' as InputFieldType, required: true, minItems: 1, category: 'Methodology' },
    { id: 'dataCollected', label: 'Data/Evidence Collected', type: 'textarea' as InputFieldType, required: true, category: 'Evidence' },
    { id: 'recommendations', label: 'Key Recommendations', type: 'array' as InputFieldType, required: true, minItems: 2, category: 'Conclusions' },
    { id: 'challengesFaced', label: 'Challenges Encountered', type: 'textarea' as InputFieldType, required: true, minLength: 50, category: 'Reflection' },
  ],
  generic: [
    { id: 'projectTitle', label: 'Project/Work Title', type: 'text' as InputFieldType, required: true, category: 'Overview' },
    { id: 'projectDescription', label: 'Project Description', type: 'textarea' as InputFieldType, required: true, minLength: 100, placeholder: 'Describe your work in detail...', category: 'Overview' },
    { id: 'objectivesAchieved', label: 'Objectives Achieved', type: 'array' as InputFieldType, required: true, minItems: 2, category: 'Achievements' },
    { id: 'methodsUsed', label: 'Methods/Approaches Used', type: 'array' as InputFieldType, required: true, minItems: 1, category: 'Methodology' },
    { id: 'toolsUsed', label: 'Tools/Resources Used', type: 'array' as InputFieldType, required: false, category: 'Resources' },
    { id: 'challengesFaced', label: 'Challenges and Solutions', type: 'textarea' as InputFieldType, required: true, minLength: 50, category: 'Reflection' },
    { id: 'lessonsLearned', label: 'Lessons Learned', type: 'textarea' as InputFieldType, required: true, minLength: 50, category: 'Reflection' },
  ],
};

// =============================================================================
// STUDENT INPUT DATA (Student-provided values)
// =============================================================================
// Actual values provided by students matching the InputFieldDefinition schema

export interface StudentInputData {
  [fieldId: string]: string | string[] | number | boolean;
}

// =============================================================================
// STUDENT PROFILE SNAPSHOT (For personalisation)
// =============================================================================
// Immutable copy of student profile at generation time

export interface StudentProfileSnapshot {
  fullName: string;
  universityName: string;
  faculty: string;
  groupName: string;
  city: string;
  academicYear?: string;
}

// =============================================================================
// RESOLVED ASSIGNMENT CONTEXT (Single source of truth for generation)
// =============================================================================
// This is the ONLY data used by AI during generation

export interface ResolvedAssignmentContext {
  // Brief data (immutable)
  briefSnapshot: {
    unitName: string;
    unitCode: string;
    level: number;
    semester: string;
    subjectName: string;
    vocationalScenario: string;
    learningAims: string[];
    assessmentCriteria: AssessmentCriteria;
    checklistOfEvidence: string[];
    sourcesOfInformation: string[];
  };
  // Student-provided inputs (immutable after generation starts)
  studentInputs: StudentInputData;
  // Student profile for personalisation
  studentProfile: StudentProfileSnapshot;
  // User selections
  targetGrade: Grade;
  language: Language;
  includeImages: boolean;
  includeTables: boolean;
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

