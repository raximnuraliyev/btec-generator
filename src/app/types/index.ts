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

// Guidance types
export interface OverviewGuidance {
  whatThisIsAbout: string;
  whatAssessorLooksFor: string[];
  howToStructure: string;
  howToReachGrade: string;
}

export interface CriterionGuidance {
  criterionCode: string;
  criterionGoal: string;
  whatToInclude: string[];
  howToApproach: string;
  commonMistakes: string[];
  gradeDepthReminder: string;
}

export interface WritingGuidanceData {
  overview: OverviewGuidance;
  criteriaGuidance: CriterionGuidance[];
}

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
  guidance?: WritingGuidanceData; // Writing guidance from backend
  content?: any; // Generated content
  // New fields for student input system
  studentInputs?: StudentInputData;
  studentInputsCompletedAt?: Date | null;
  studentProfileSnapshot?: StudentProfileSnapshot;
  briefSnapshot?: {
    requiredInputs?: InputFieldDefinition[];
    [key: string]: any;
  };
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
// STUDENT INPUT REQUIREMENTS
// ============================================================================

/**
 * Types of input fields that teachers can define for briefs
 */
export type InputFieldType = 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'boolean' | 'array';

/**
 * Definition of a single input field that students must complete
 */
export interface InputFieldDefinition {
  id: string;                    // Unique identifier (e.g., 'projectTitle', 'toolsUsed')
  label: string;                 // Display label (e.g., 'Project Title')
  type: InputFieldType;          // Field type
  required: boolean;             // Whether field is mandatory
  options?: string[];            // For select/multiselect types
  placeholder?: string;          // Placeholder text
  description?: string;          // Help text explaining what to enter
  category?: string;             // Grouping category (e.g., 'Project Details', 'Technical')
  minLength?: number;            // Minimum text length
  maxLength?: number;            // Maximum text length
}

/**
 * Brief with required inputs schema
 */
export interface Brief {
  id: string;
  title: string;
  unitCode: string;
  unitName: string;
  subjectName: string;
  level: BTECLevel;
  scenario: string;
  language: string;
  requiredInputs?: InputFieldDefinition[];
  createdAt: string;
  updatedAt: string;
  createdById: string;
  isActive: boolean;
  assignmentCount?: number;
}

/**
 * Pre-built input templates for common unit types
 */
export const INPUT_TEMPLATES: Record<string, InputFieldDefinition[]> = {
  programming: [
    { id: 'projectTitle', label: 'Project Title', type: 'text', required: true, placeholder: 'e.g., Inventory Management System' },
    { id: 'projectDescription', label: 'Project Description', type: 'textarea', required: true, placeholder: 'Describe what your project does...', minLength: 100 },
    { id: 'programmingLanguages', label: 'Programming Languages Used', type: 'multiselect', required: true, options: ['Python', 'Java', 'JavaScript', 'C#', 'C++', 'PHP', 'Other'] },
    { id: 'toolsUsed', label: 'Tools & Technologies', type: 'array', required: true, placeholder: 'e.g., VS Code, Git, MySQL' },
    { id: 'featuresImplemented', label: 'Features Implemented', type: 'array', required: true, placeholder: 'e.g., User authentication, Data validation' },
    { id: 'challengesFaced', label: 'Challenges Faced', type: 'textarea', required: false, placeholder: 'Describe any difficulties you encountered...' },
    { id: 'lessonsLearned', label: 'What You Learned', type: 'textarea', required: false, placeholder: 'What did you learn from this project?' },
  ],
  bigData: [
    { id: 'projectTitle', label: 'Project Title', type: 'text', required: true },
    { id: 'projectDescription', label: 'Project Description', type: 'textarea', required: true, minLength: 100 },
    { id: 'dataSources', label: 'Data Sources Used', type: 'array', required: true, placeholder: 'e.g., Kaggle dataset, Company database' },
    { id: 'dataSize', label: 'Approximate Data Size', type: 'text', required: true, placeholder: 'e.g., 100,000 records, 5GB' },
    { id: 'toolsUsed', label: 'Analytics Tools Used', type: 'multiselect', required: true, options: ['Python/Pandas', 'R', 'SQL', 'Tableau', 'Power BI', 'Excel', 'Other'] },
    { id: 'analysisPerformed', label: 'Analysis Performed', type: 'array', required: true, placeholder: 'e.g., Trend analysis, Correlation study' },
    { id: 'keyFindings', label: 'Key Findings', type: 'textarea', required: true, placeholder: 'Summarize your main findings...' },
  ],
  business: [
    { id: 'projectTitle', label: 'Project/Case Study Title', type: 'text', required: true },
    { id: 'projectDescription', label: 'Project Description', type: 'textarea', required: true, minLength: 100 },
    { id: 'businessContext', label: 'Business Context', type: 'textarea', required: true, placeholder: 'Describe the business situation or problem...' },
    { id: 'methodsUsed', label: 'Methods/Frameworks Applied', type: 'array', required: true, placeholder: 'e.g., SWOT, PESTLE, Porter\'s Five Forces' },
    { id: 'stakeholders', label: 'Key Stakeholders', type: 'array', required: false, placeholder: 'e.g., Management, Customers, Suppliers' },
    { id: 'recommendations', label: 'Your Recommendations', type: 'textarea', required: true, placeholder: 'What solutions did you propose?' },
  ],
  generic: [
    { id: 'projectTitle', label: 'Project/Assignment Title', type: 'text', required: true },
    { id: 'projectDescription', label: 'Description of Your Work', type: 'textarea', required: true, minLength: 50, placeholder: 'Describe what you did for this assignment...' },
    { id: 'methodsUsed', label: 'Methods/Approaches Used', type: 'array', required: false, placeholder: 'e.g., Research, Design, Analysis' },
    { id: 'keyOutcomes', label: 'Key Outcomes', type: 'textarea', required: false, placeholder: 'What were the main results or conclusions?' },
    { id: 'challengesFaced', label: 'Challenges Faced', type: 'textarea', required: false },
    { id: 'lessonsLearned', label: 'Lessons Learned', type: 'textarea', required: false },
  ],
};

/**
 * Student's actual input data (dynamic key-value pairs)
 */
export type StudentInputData = Record<string, string | string[] | number | boolean>;

/**
 * Snapshot of student profile at assignment creation time
 */
export interface StudentProfileSnapshot {
  fullName: string;
  universityName: string;
  faculty: string;
  groupName: string;
  city: string;
  academicYear?: string;
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
