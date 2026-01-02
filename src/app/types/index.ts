// TypeScript Type Definitions for BTEC Generator Platform

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

export type UserRole = 'USER' | 'ADMIN' | 'VIP' | 'TEACHER';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role?: UserRole;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ============================================================================
// BTEC CONFIGURATION
// ============================================================================

export type BTECLevel = 3 | 4 | 5 | 6;

export type TargetGrade = 'PASS' | 'MERIT' | 'DISTINCTION';

export interface BTECUnit {
  id: string;
  level: BTECLevel;
  unitNumber: number;
  name: string;
  description: string | null;
}

export interface GradeRequirements {
  grade: TargetGrade;
  wordCount: {
    min: number;
    max: number;
  };
  depth: string;
  requirements: string[];
}

// ============================================================================
// ASSIGNMENT
// ============================================================================

export type AssignmentStatus = 'DRAFT' | 'GENERATING' | 'HUMANIZING' | 'COMPLETED' | 'FAILED';

export interface Assignment {
  id: string;
  userId: string;
  level: BTECLevel;
  unitId: string;
  unit: BTECUnit;
  targetGrade: TargetGrade;
  title: string;
  outputFile: string | null; // Generated .docx path
  status: AssignmentStatus;
  createdAt: Date;
  updatedAt: Date;
  wordCount?: number;
  job?: GenerationJob;
}

export interface CreateAssignmentData {
  briefId: string; // Admin-created brief (required)
  targetGrade: TargetGrade;
  targetWordCount?: number;
}

// ============================================================================
// BRIEF & CRITERIA
// ============================================================================

export type CriterionType = 'P' | 'M' | 'D';

export interface BriefCriterion {
  id: string;
  assignmentId: string;
  type: CriterionType;
  number: number; // P1, P2, M1, etc.
  description: string;
  order: number;
}

export interface ParsedBrief {
  criteria: BriefCriterion[];
  metadata: {
    totalCriteria: number;
    passCriteria: number;
    meritCriteria: number;
    distinctionCriteria: number;
  };
}

// ============================================================================
// CONTENT GENERATION
// ============================================================================

export interface ContentBlock {
  id: string;
  assignmentId: string;
  criterionId: string;
  criterion: BriefCriterion;
  content: string;
  wordCount: number;
  humanized: boolean;
  order: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export type JobStatus = 
  | 'PENDING' 
  | 'RUNNING' 
  | 'HUMANIZING' 
  | 'ASSEMBLING' 
  | 'COMPLETED' 
  | 'FAILED';

export interface GenerationJob {
  id: string;
  userId: string;
  assignmentId: string;
  assignment: Assignment;
  status: JobStatus;
  currentStep: number;
  totalSteps: number;
  errorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  logs: JobLog[];
}

export type LogLevel = 'INFO' | 'WARNING' | 'ERROR';

export interface JobLog {
  id: string;
  jobId: string;
  level: LogLevel;
  message: string;
  metadata: Record<string, any> | null;
  timestamp: Date;
}

// ============================================================================
// WEBSOCKET EVENTS
// ============================================================================

export interface ProgressUpdate {
  jobId: string;
  step: number;
  total: number;
  message: string;
  percentage: number;
  
  // Micro-task progress details (optional for backwards compatibility)
  taskIndex?: number;         // Current task number (1-indexed)
  totalTasks?: number;        // Total number of micro-tasks
  taskName?: string;          // Name of current task being generated
  wordsGenerated?: number;    // Words generated so far
  targetWords?: number;       // Target word count
  currentCriteria?: string;   // e.g., "P1", "M2", "D1"
  grade?: string;             // "PASS", "MERIT", "DISTINCTION"
}

export interface CompletionUpdate {
  jobId: string;
  assignmentId: string;
  status: 'success' | 'failed';
  message: string;
}

export interface ErrorUpdate {
  jobId: string;
  message: string;
  retryable: boolean;
}

// ============================================================================
// UI STATE
// ============================================================================

export interface StepperState {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  canProceed: boolean;
}

export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface AssignmentSetupState {
  step: number;
  title: string;
  level: BTECLevel | null;
  unitId: string | null;
  targetGrade: TargetGrade | null;
  briefFile: File | null;
  confirmed: boolean;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface GenerationResponse {
  jobId: string;
  assignmentId: string;
  estimatedTime: number; // minutes
}

export interface DownloadResponse {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const GRADE_REQUIREMENTS: Record<TargetGrade, GradeRequirements> = {
  PASS: {
    grade: 'PASS',
    wordCount: { min: 2000, max: 3000 },
    depth: 'Definitions, explanations, descriptions',
    requirements: [
      'Clear explanations of key concepts',
      'Basic examples and evidence',
      'Straightforward language',
      'Structured paragraphs'
    ]
  },
  MERIT: {
    grade: 'MERIT',
    wordCount: { min: 4000, max: 6000 },
    depth: 'Comparisons, justifications, analysis',
    requirements: [
      'Comparative analysis',
      'Justified arguments',
      'Multiple perspectives',
      'Evidence-based reasoning',
      'Pros and cons evaluation'
    ]
  },
  DISTINCTION: {
    grade: 'DISTINCTION',
    wordCount: { min: 7000, max: 9500 },
    depth: 'Evaluation, critical reflection, synthesis',
    requirements: [
      'Critical evaluation of theories',
      'Reflective analysis',
      'Synthesis of multiple frameworks',
      'Original conclusions',
      'Academic rigor',
      'Counterarguments addressed'
    ]
  }
};

export const LEVEL_DESCRIPTORS: Record<BTECLevel, string> = {
  3: 'Foundational knowledge with guided learning',
  4: 'Intermediate concepts with independent work',
  5: 'Advanced theories with critical thinking',
  6: 'Research-level synthesis and original insights'
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type AsyncState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

// ============================================================================
// ADMIN TYPES
// ============================================================================

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  discordUserId: string | null;
  createdAt: string;
  updatedAt: string;
  assignmentCount: number;
  jobCount: number;
}

export interface AdminUserDetail extends Omit<AdminUser, 'assignmentCount' | 'jobCount'> {
  assignments: AdminAssignment[];
}

export interface AdminAssignment {
  id: string;
  status: string;
  createdAt: string;
  grade?: string;
  language?: string;
  user?: {
    id: string;
    email: string;
    studentProfile?: {
      fullName: string;
    };
  };
  snapshot?: {
    id: string;
    unitName: string;
    subjectName: string;
    unitCode?: string;
    level?: number;
  };
}

export interface AdminStats {
  totals: {
    users: number;
    assignments: number;
    activeGenerations: number;
  };
  usersByRole: Record<string, number>;
  assignmentsByStatus: Record<string, number>;
  recentUsers?: Array<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
  }>;
  recentAssignments?: AdminAssignment[];
}

export interface LogEntry {
  type: string;
  lines: number;
  content: string;
  timestamp: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string;
  before?: any;
  after?: any;
  metadata?: any;
  createdAt: string;
  user?: {
    email: string;
    name: string | null;
  };
}
