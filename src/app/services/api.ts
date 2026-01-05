/**
 * API Service
 * 
 * Handles all communication with the backend API.
 * Provides typed methods for authentication, assignments, generation, and more.
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

// @ts-ignore - import.meta.env is defined by Vite
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`  // Production: use ngrok URL + /api
  : '/api';  // Development: use Vite proxy

// @ts-ignore - import.meta.env is defined by Vite
const WS_URL = import.meta.env.DEV ? 'ws://localhost:3000' : window.location.origin.replace(/^http/, 'ws');

// =============================================================================
// TYPES
// =============================================================================

export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode: number;
  };
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    discordLinked: boolean;
  };
  token: string;
  expiresIn: string;
}

export interface AssignmentResponse {
  id: string;
  userId: string;
  title: string;
  level: number;
  targetGrade: 'P' | 'M' | 'D';
  targetWordCount?: number;
  status: string;
  currentJobId?: string;
  currentJob?: {
    id: string;
    status: string;
    currentStage: string;
    progress: number;
    currentWordCount: number;
    targetWordCount: number;
    errorMessage?: string;
    createdAt: string;
    startedAt?: string;
  };
  generatedContent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobStatusResponse {
  jobId: string;
  status: string;
  currentStage: string;
  progress: number;
  targetWordCount: number;
  currentWordCount: number;
  startedAt?: string;
  estimatedCompletion?: string;
  errorMessage?: string;
  createdAt: string;
  assignment?: {
    id: string;
    title: string;
    level: number;
    targetGrade: string;
  };
}

export interface BriefCriteriaResponse {
  criteria: {
    id: string;
    assignmentId: string;
    unitName: string;
    unitCode?: string;
    learningAims: { code: string; text: string; type: string }[];
    passCriteria: string[];
    meritCriteria: string[];
    distinctionCrit: string[];
    deadline?: string;
    submissionReqs?: string;
    additionalNotes?: string;
    scenario?: string;
    userApproved: boolean;
  };
}

// =============================================================================
// HTTP CLIENT
// =============================================================================

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('btec_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: { message: 'An error occurred', code: 'UNKNOWN_ERROR', statusCode: response.status },
      }));
      throw new ApiError(errorData.error?.message || 'Request failed', errorData.error?.code || 'UNKNOWN_ERROR');
    }
    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<T>(response);
  }
}

// Custom error class
export class ApiError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

// =============================================================================
// API INSTANCE
// =============================================================================

const api = new ApiClient(API_BASE_URL);

// Export for direct use in components
export { api };

// =============================================================================
// AUTH API
// =============================================================================

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  signup: (email: string, password: string, name: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, name }),

  logout: () => api.post<{ message: string }>('/auth/logout'),

  getProfile: () =>
    api.get<{ user: AuthResponse['user'] }>('/auth/me'),

  refreshToken: () =>
    api.post<{ token: string; expiresIn: string }>('/auth/refresh'),
};

// =============================================================================
// DISCORD API
// =============================================================================

export interface DiscordLinkCode {
  code: string;
  expiresAt: string;
  expiresIn: number;
}

export interface DiscordStatus {
  linked: boolean;
  discordUserId: string | null;
  activeCode: {
    code: string;
    expiresAt: string;
  } | null;
}

export const discordApi = {
  generateCode: () =>
    api.post<DiscordLinkCode>('/discord/generate-code'),

  getStatus: () =>
    api.get<DiscordStatus>('/discord/status'),

  unlink: () =>
    api.delete<{ unlinked: boolean }>('/discord/unlink'),
};

// =============================================================================
// ASSIGNMENTS API
// =============================================================================

export const assignmentsApi = {
  list: () =>
    api.get<{ assignments: AssignmentResponse[] }>('/assignments'),

  getAssignments: (params?: { briefId?: string }) => {
    const query = params?.briefId ? `?briefId=${params.briefId}` : '';
    return api.get<AssignmentResponse[]>(`/assignments${query}`);
  },

  get: (id: string) =>
    api.get<{ assignment: AssignmentResponse }>(`/assignments/${id}`),

  create: (data: {
    unitName: string;
    unitCode?: string;
    level: number;
    targetGrade: 'P' | 'M' | 'D';
    targetWordCount?: number;
  }) =>
    api.post<{ assignment: AssignmentResponse }>('/assignments', data),

  update: (id: string, data: Partial<{
    unitName: string;
    unitCode?: string;
    level: number;
    targetGrade: 'P' | 'M' | 'D';
    targetWordCount?: number;
  }>) =>
    api.put<{ assignment: AssignmentResponse }>(`/assignments/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/assignments/${id}`),

  /**
   * Download completed assignment as DOCX
   */
  download: async (id: string): Promise<ArrayBuffer> => {
    const token = localStorage.getItem('btec_token');
    const response = await fetch(`${API_BASE_URL}/assignments/${id}/download`, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to download assignment' }));
      throw new Error(error.message || 'Failed to download assignment');
    }

    return response.arrayBuffer();
  },

  /**
   * Generate a new assignment from a brief
   */
  generate: async (data: {
    briefId: string;
    grade: 'PASS' | 'MERIT' | 'DISTINCTION';
    language: 'en' | 'ru' | 'uz' | 'es';
    includeImages?: boolean;
    includeTables?: boolean;
  }, headers?: Record<string, string>) => {
    const token = localStorage.getItem('btec_token');
    const response = await fetch(`${API_BASE_URL}/assignments/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate assignment');
    }

    return response.json();
  },

  /**
   * Create a new assignment from a brief (NEW FLOW)
   * This creates an assignment in DRAFT status that requires student inputs before generation
   */
  createFromBrief: (data: {
    briefId: string;
    targetGrade: 'PASS' | 'MERIT' | 'DISTINCTION';
    language?: string;
  }) =>
    api.post<{ assignment: AssignmentResponse }>('/assignments', data),

  /**
   * Save student inputs for an assignment
   * Student must provide their project details before generation can start
   */
  saveStudentInputs: (assignmentId: string, studentInputs: Record<string, unknown>) =>
    api.put<{ assignment: AssignmentResponse; complete: boolean }>(`/assignments/${assignmentId}/inputs`, { studentInputs }),

  /**
   * Start generation after student inputs are complete
   */
  startGeneration: (assignmentId: string) =>
    api.post<{ assignment: AssignmentResponse; jobId: string }>(`/assignments/${assignmentId}/generate`, {}),

  /**
   * Check if student has completed required inputs
   */
  hasCompletedInputs: (assignmentId: string) =>
    api.get<{ complete: boolean; missingFields?: string[] }>(`/assignments/${assignmentId}/inputs/status`),
};

// =============================================================================
// EXPORT API
// =============================================================================

export const exportApi = {
  download: async (assignmentId: string, format: 'docx' | 'pdf' | 'markdown'): Promise<Blob> => {
    const token = localStorage.getItem('btec_token');
    const response = await fetch(`${API_BASE_URL}/export/${assignmentId}?format=${format}`, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  },

  getFormats: () =>
    api.get<{ formats: string[] }>('/export/formats'),
};

// =============================================================================
// WEBSOCKET CONNECTION
// =============================================================================

export class JobWebSocket {
  private socket: WebSocket | null = null;
  private jobId: string;
  private callbacks: {
    onProgress?: (data: { stage: string; progress: number; wordCount: number }) => void;
    onStageComplete?: (data: { stage: string; content?: string }) => void;
    onComplete?: (data: { jobId: string; content: string }) => void;
    onError?: (data: { error: string; recoverable: boolean }) => void;
    onApprovalRequired?: (data: { stage: string }) => void;
  } = {};

  constructor(jobId: string) {
    this.jobId = jobId;
  }

  connect(token: string): void {
    this.socket = new WebSocket(`${WS_URL}?token=${token}`);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.socket?.send(JSON.stringify({ type: 'subscribe', jobId: this.jobId }));
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'job:progress':
            this.callbacks.onProgress?.(data.payload);
            break;
          case 'job:stageComplete':
            this.callbacks.onStageComplete?.(data.payload);
            break;
          case 'job:complete':
            this.callbacks.onComplete?.(data.payload);
            break;
          case 'job:error':
            this.callbacks.onError?.(data.payload);
            break;
          case 'job:approvalRequired':
            this.callbacks.onApprovalRequired?.(data.payload);
            break;
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
    };
  }

  onProgress(callback: typeof this.callbacks.onProgress): this {
    this.callbacks.onProgress = callback;
    return this;
  }

  onStageComplete(callback: typeof this.callbacks.onStageComplete): this {
    this.callbacks.onStageComplete = callback;
    return this;
  }

  onComplete(callback: typeof this.callbacks.onComplete): this {
    this.callbacks.onComplete = callback;
    return this;
  }

  onError(callback: typeof this.callbacks.onError): this {
    this.callbacks.onError = callback;
    return this;
  }

  onApprovalRequired(callback: typeof this.callbacks.onApprovalRequired): this {
    this.callbacks.onApprovalRequired = callback;
    return this;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

// =============================================================================
// STUDENT VERIFICATION API
// =============================================================================

export interface StudentVerificationData {
  fullName: string;
  studentIdCode: string;
}

export interface StudentVerificationResponse {
  success: boolean;
  message: string;
  student?: {
    id: string;
    studentIdCode: string;
    fullName: string;
    statusLabel?: string;
  };
  isVIP?: boolean;
  downloadsUsed?: number;
  downloadsRemaining?: number | string;
  error?: string;
}

export const studentsApi = {
  /**
   * Verify student before download
   */
  async verify(data: StudentVerificationData): Promise<StudentVerificationResponse> {
    const response = await api.post<StudentVerificationResponse>('/students/verify', data);
    return response;
  },

  /**
   * Record a download
   */
  async recordDownload(studentId: string, assignmentId: string): Promise<{ success: boolean }> {
    return api.post('/students/record-download', { studentId, assignmentId });
  },

  /**
   * Import students from CSV (admin only)
   */
  async importStudents(): Promise<{ success: boolean; imported: number; skipped: number }> {
    return api.post('/students/import', {});
  },

  /**
   * Import students directly (no auth)
   */
  async importStudentsDirect(): Promise<{ success: boolean; imported: number; skipped: number }> {
    return api.post('/students/import-direct', {});
  },

  /**
   * List all students (admin only)
   */
  async list(): Promise<{ success: boolean; students: any[]; total: number }> {
    return api.get('/students/list');
  },

  /**
   * Get student profile
   */
  async getProfile(): Promise<{ confirmed: boolean; profile?: any }> {
    return api.get('/students/profile');
  },

  /**
   * Create/update student profile
   */
  async saveProfile(data: any): Promise<{ success: boolean; profile: any }> {
    return api.post('/students/profile', data);
  },
};

// =============================================================================
// BRIEFS API
// =============================================================================

export const briefsApi = {
  /**
   * Get all briefs (optionally filter by level or createdById)
   */
  async getBriefs(params?: { level?: number; createdById?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.level) query.append('level', params.level.toString());
    if (params?.createdById) query.append('createdById', params.createdById);
    const url = query.toString() ? `/briefs?${query}` : '/briefs';
    return api.get(url);
  },

  /**
   * Get a specific brief by ID
   */
  async getBrief(id: string): Promise<any> {
    return api.get(`/briefs/${id}`);
  },

  /**
   * Get teacher's briefs with usage statistics
   */
  async getMyBriefsWithStats(): Promise<{
    briefs: any[];
    popularBriefs: any[];
    stats: { totalBriefs: number; totalAssignments: number };
  }> {
    return api.get('/briefs/my-stats');
  },

  /**
   * Create a new brief (ADMIN/TEACHER only)
   */
  async createBrief(data: any): Promise<any> {
    return api.post('/briefs', data);
  },

  /**
   * Update a brief (ADMIN/TEACHER only)
   */
  async updateBrief(id: string, data: any): Promise<any> {
    return api.put(`/briefs/${id}`, data);
  },

  /**
   * Delete a brief (ADMIN/TEACHER only)
   */
  async deleteBrief(id: string): Promise<{ success: boolean }> {
    return api.delete(`/briefs/${id}`);
  },
};

// =============================================================================
// ADMIN API
// =============================================================================

export const adminApi = {
  // Users
  getUsers: (params: { page?: number; limit?: number; search?: string; role?: string; plan?: string; status?: string } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.role) queryParams.set('role', params.role);
    if (params.plan) queryParams.set('plan', params.plan);
    if (params.status) queryParams.set('status', params.status);
    return api.get<{ users: any[]; pagination: { total: number; page: number; totalPages: number } }>(
      `/admin/users?${queryParams.toString()}`
    );
  },

  getUser: (id: string) =>
    api.get<{ user: any }>(`/admin/users/${id}`),

  updateUser: (id: string, data: { email?: string; password?: string; name?: string; role?: string }) =>
    api.put<{ user: any }>(`/admin/users/${id}`, data),

  updateUserRole: (id: string, role: string) =>
    api.put<{ user: any }>(`/admin/users/${id}/role`, { role }),

  // Assignments
  getAssignments: (params: { page?: number; limit?: number; search?: string; status?: string; grade?: string; level?: string; dateFrom?: string; dateTo?: string } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.status) queryParams.set('status', params.status);
    if (params.grade) queryParams.set('grade', params.grade);
    if (params.level) queryParams.set('level', params.level);
    if (params.dateFrom) queryParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.set('dateTo', params.dateTo);
    return api.get<{ assignments: any[]; pagination: { total: number; page: number; totalPages: number } }>(
      `/admin/assignments?${queryParams.toString()}`
    );
  },

  getAllAssignments: (page = 1, limit = 50, status?: string) =>
    api.get<{ assignments: any[]; total: number; page: number; pages: number }>(
      `/admin/all-assignments?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`
    ),

  pauseAssignment: (id: string) =>
    api.post<{ message: string; status: string }>(`/admin/assignments/${id}/pause`),

  resumeAssignment: (id: string) =>
    api.post<{ message: string; status: string }>(`/admin/assignments/${id}/resume`),

  stopAssignment: (id: string) =>
    api.post<{ message: string; status: string }>(`/admin/assignments/${id}/stop`),

  restartAssignment: (id: string) =>
    api.post<{ message: string; jobId: string; status: string }>(`/admin/assignments/${id}/restart`),

  deleteAssignment: (id: string) =>
    api.delete<{ message: string }>(`/admin/assignments/${id}`),

  // Logs
  getLogs: (params: { page?: number; limit?: number; search?: string; category?: string; action?: string; dateFrom?: string; dateTo?: string } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.category) queryParams.set('category', params.category);
    if (params.action) queryParams.set('action', params.action);
    if (params.dateFrom) queryParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.set('dateTo', params.dateTo);
    return api.get<{ logs: any[]; pagination: { total: number; page: number; totalPages: number } }>(
      `/admin/logs?${queryParams.toString()}`
    );
  },

  getAuditLogs: (params: { page?: number; limit?: number; search?: string; action?: string; dateFrom?: string; dateTo?: string } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.action) queryParams.set('action', params.action);
    if (params.dateFrom) queryParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.set('dateTo', params.dateTo);
    return api.get<{ logs: any[]; pagination: { total: number; page: number; totalPages: number } }>(
      `/admin/logs/audit?${queryParams.toString()}`
    );
  },

  // Issues
  getIssues: (params: { status?: string; category?: string; priority?: string } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.set('status', params.status);
    if (params.category) queryParams.set('category', params.category);
    if (params.priority) queryParams.set('priority', params.priority);
    return api.get<{ issues: any[] }>(`/admin/issues?${queryParams.toString()}`);
  },

  respondToIssue: (issueId: string, response: string) =>
    api.post<{ success: boolean }>(`/admin/issues/${issueId}/respond`, { response }),

  resolveIssue: (issueId: string) =>
    api.post<{ success: boolean }>(`/admin/issues/${issueId}/resolve`),

  reopenIssue: (issueId: string) =>
    api.post<{ success: boolean }>(`/admin/issues/${issueId}/reopen`),

  // Stats
  getStats: () =>
    api.get<any>('/admin/stats'),

  getOverviewStats: () =>
    api.get<any>('/admin/stats/overview'),

  // Jobs
  getJobs: (page = 1, limit = 20, status?: string) =>
    api.get<{ data: any[]; total: number; page: number; pages: number }>(
      `/admin/jobs?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`
    ),

  // Analytics
  getTokenAnalytics: (period: '24h' | '7d' | '30d' | '90d' | '1y' = '7d') =>
    api.get<{
      period: string;
      summary: {
        totalTokens: number;
        inputTokens: number;
        outputTokens: number;
        totalRequests: number;
      };
      byUser: {
        userId: string;
        email: string;
        name: string | null;
        tokens: number;
      }[];
      byDay: { date: string; tokens: number; requests: number }[];
    }>(`/admin/analytics/tokens?period=${period}`),

  getRecap: (type: 'weekly' | 'monthly' | 'yearly' = 'weekly') =>
    api.get<{
      type: string;
      period: { start: string; end: string };
      current: {
        newUsers: number;
        totalAssignments: number;
        completedAssignments: number;
        totalTokensUsed: number;
        assignmentsByGrade: Record<string, number>;
        assignmentsByLevel: Record<string, number>;
        topUsers: {
          email: string;
          name: string | null;
          tokensUsed: number;
          assignmentCount: number;
        }[];
      };
      previous: {
        newUsers: number;
        totalAssignments: number;
        totalTokensUsed: number;
      };
      growth: {
        users: number;
        assignments: number;
        tokens: number;
      };
    }>(`/admin/analytics/recap?type=${type}`),

  // Approval management
  getPendingApprovals: () =>
    api.get<{
      count: number;
      assignments: {
        id: string;
        title: string;
        level: number;
        targetGrade: string;
        userId: string;
        userEmail: string;
        userName: string | null;
        wordCount: number | null;
        completedAt: string | null;
        createdAt: string;
      }[];
    }>('/admin/pending-approvals'),

  approveAssignment: (id: string) =>
    api.post<{ success: boolean; message: string }>(`/admin/assignments/${id}/approve`),

  rejectAssignment: (id: string, reason?: string) =>
    api.post<{ success: boolean; message: string }>(`/admin/assignments/${id}/reject`, { reason }),

  // User Token Management (Admin)
  addUserTokens: (userId: string, amount: number, reason: string) =>
    api.post<{ success: boolean; newBalance: number }>(`/admin/users/${userId}/tokens/add`, { amount, reason }),

  deductUserTokens: (userId: string, amount: number, reason: string) =>
    api.post<{ success: boolean; newBalance: number }>(`/admin/users/${userId}/tokens/deduct`, { amount, reason }),

  resetUserTokens: (userId: string, reason: string) =>
    api.post<{ success: boolean; newBalance: number }>(`/admin/users/${userId}/tokens/reset`, { reason }),

  setUserPlan: (userId: string, plan: string) =>
    api.post<{ success: boolean }>(`/admin/users/${userId}/plan`, { plan }),

  // User Status Management
  suspendUser: (userId: string, reason: string) =>
    api.post<{ success: boolean }>(`/admin/users/${userId}/suspend`, { reason }),

  unsuspendUser: (userId: string) =>
    api.post<{ success: boolean }>(`/admin/users/${userId}/unsuspend`),

  banUser: (userId: string, reason: string) =>
    api.post<{ success: boolean }>(`/admin/users/${userId}/ban`, { reason }),

  unbanUser: (userId: string) =>
    api.post<{ success: boolean }>(`/admin/users/${userId}/unban`),

  resetUserState: (userId: string) =>
    api.post<{ success: boolean }>(`/admin/users/${userId}/reset-state`),

  // System Controls (Emergency)
  pauseAllGeneration: () =>
    api.post<{ success: boolean; message: string }>('/admin/system/pause-generation'),

  resumeAllGeneration: () =>
    api.post<{ success: boolean; message: string }>('/admin/system/resume-generation'),

  getSystemStatus: () =>
    api.get<{
      generationPaused: boolean;
      activeJobs: number;
      queuedJobs: number;
      failedJobsLast24h: number;
      averageGenerationTime: number;
      aiModelsHealth: { model: string; status: string; failRate: number }[];
    }>('/admin/system/status'),

  // Assignment Actions
  forceCompleteAssignment: (id: string) =>
    api.post<{ success: boolean }>(`/admin/assignments/${id}/force-complete`),

  regenerateAssignment: (id: string) =>
    api.post<{ success: boolean }>(`/admin/assignments/${id}/regenerate`),

  cancelAssignment: (id: string) =>
    api.post<{ success: boolean }>(`/admin/assignments/${id}/cancel`),

  // Bulk actions
  deleteAssignments: (ids: string[]) =>
    api.post<{ success: boolean; deleted: number }>('/admin/assignments/bulk-delete', { ids }),

  regenerateAssignments: (ids: string[]) =>
    api.post<{ success: boolean; regenerated: number }>('/admin/assignments/bulk-regenerate', { ids }),

  // Export
  exportAssignments: async (filters?: any): Promise<Blob> => {
    const token = localStorage.getItem('btec_token');
    const queryParams = new URLSearchParams();
    queryParams.set('format', 'csv');
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.set(key, String(value));
      });
    }
    const response = await fetch(`${API_BASE_URL}/admin/export/assignments?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  },

  exportUsers: async (filters?: any): Promise<Blob> => {
    const token = localStorage.getItem('btec_token');
    const queryParams = new URLSearchParams();
    queryParams.set('format', 'csv');
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.set(key, String(value));
      });
    }
    const response = await fetch(`${API_BASE_URL}/admin/export/users?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  },
};

// =============================================================================
// TOKEN API
// =============================================================================

export interface TokenBalance {
  userId: string;
  planType: 'FREE' | 'BASIC' | 'PRO' | 'UNLIMITED';
  tokensRemaining: number;
  tokensPerMonth: number;
  lastResetAt: Date;
  nextResetAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'ASSIGNMENT_GENERATION' | 'PLAN_UPGRADE' | 'ADMIN_ADJUSTMENT' | 'MONTHLY_RESET';
  description: string;
  assignmentId?: string;
  createdAt: Date;
}

export interface TokenPlanInfo {
  type: 'FREE' | 'BASIC' | 'PRO' | 'UNLIMITED';
  tokensPerMonth: number;
  price: number;
  features: string[];
}

export const tokenApi = {
  getBalance: () => api.get<TokenBalance>('/tokens/balance'),
  
  getHistory: (limit = 50) => 
    api.get<{ transactions: TokenTransaction[]; total: number }>(`/tokens/history?limit=${limit}`),
  
  getPlans: () => api.get<{ plans: TokenPlanInfo[] }>('/tokens/plans'),
  
  upgradePlan: (planType: 'BASIC' | 'PRO' | 'UNLIMITED') => 
    api.post<{ success: boolean; newBalance: TokenBalance }>('/tokens/upgrade', { planType }),
};

// =============================================================================
// GENERATION API
// =============================================================================

export interface GenerationStatus {
  assignmentId: string;
  status: 'DRAFT' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  progress: {
    stage: 'planning' | 'writing' | 'assembling' | 'completed' | 'failed';
    blocksCompleted: number;
    totalBlocks: number;
    currentBlock?: string;
  };
  totalTokensUsed?: number;
  generationDurationMs?: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface GenerationContent {
  assignmentId: string;
  content: string;
  blocks: {
    id: string;
    blockType: string;
    orderIndex: number;
    content: string;
    tokensUsed: number;
  }[];
  totalTokensUsed: number;
  generatedAt: Date;
}

export const generationApi = {
  start: (assignmentId: string) => 
    api.post<{ id: string; status: string; message: string }>(`/generation/start/${assignmentId}`),
  
  getStatus: (assignmentId: string) => 
    api.get<GenerationStatus>(`/generation/status/${assignmentId}`),
  
  getContent: (assignmentId: string) => 
    api.get<GenerationContent>(`/generation/content/${assignmentId}`),
};

// =============================================================================
// PAYMENT API
// =============================================================================

export type PaymentPlanType = 'P' | 'PM' | 'PMD' | 'CUSTOM';
export type PaymentMethod = 'HUMO' | 'UZCARD' | 'PAYME';
export type PaymentStatus = 'WAITING_PAYMENT' | 'PAID' | 'REJECTED' | 'EXPIRED';
export type GradeType = 'PASS' | 'MERIT' | 'DISTINCTION';

export interface PaymentPlan {
  type: PaymentPlanType;
  name: string;
  price: number;
  priceFormatted: string;
  tokensPerMonth: number;
  assignments: number;
  grades: GradeType[];
  durationDays: number;
  isCustom: boolean;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  planType: PaymentPlanType;
  customTokens?: number;
  customGrade?: GradeType;
  baseAmount: number;
  uniqueSuffix: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
  expiresAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  approvedByAdminId?: string;
  rejectionReason?: string;
  assignmentsGranted?: number;
  tokensGranted?: number;
  gradesGranted?: string[];
  planExpiresAt?: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface PaymentInstructions {
  cardNumber: string;
  exactAmount: number;
  expiresAt: string;
  warnings: string[];
}

export interface CreatePaymentResponse {
  payment: PaymentTransaction;
  cardNumber: string;
  instructions: PaymentInstructions;
}

export interface PaymentStats {
  totalPayments: number;
  pendingPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
  expiredPayments: number;
  totalRevenue: number;
}

export const paymentApi = {
  // User endpoints
  getPlans: () => 
    api.get<{ plans: PaymentPlan[]; cardNumber: string }>('/payments/plans'),
  
  createPayment: (data: {
    planType: PaymentPlanType;
    paymentMethod?: PaymentMethod;
    customTokens?: number;
    customGrade?: GradeType;
  }) => 
    api.post<CreatePaymentResponse>('/payments/create', data),
  
  getActivePayment: () => 
    api.get<{ payment: PaymentTransaction | null; cardNumber: string }>('/payments/active'),
  
  getPaymentHistory: () => 
    api.get<{ payments: PaymentTransaction[] }>('/payments/history'),
  
  cancelPayment: (paymentId: string) => 
    api.post<{ payment: PaymentTransaction; message: string }>(`/payments/${paymentId}/cancel`),
  
  calculateCustomPrice: (tokens: number) => 
    api.post<{ tokens: number; price: number; priceFormatted: string }>('/payments/calculate-custom', { tokens }),
  
  // Admin endpoints
  getAllPayments: (page = 1, limit = 50, status?: PaymentStatus, userId?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append('status', status);
    if (userId) params.append('userId', userId);
    return api.get<{ payments: PaymentTransaction[]; total: number; page: number; totalPages: number }>(
      `/payments/admin/all?${params}`
    );
  },
  
  getPendingPayments: (page = 1, limit = 50) => 
    api.get<{ payments: PaymentTransaction[]; total: number; page: number; totalPages: number }>(
      `/payments/admin/pending?page=${page}&limit=${limit}`
    ),
  
  getPaymentStats: () => 
    api.get<PaymentStats>('/payments/admin/stats'),
  
  getPaymentDetails: (paymentId: string) => 
    api.get<{ payment: PaymentTransaction }>(`/payments/admin/${paymentId}`),
  
  findPaymentByAmount: (amount: number) => 
    api.get<{ payment: PaymentTransaction }>(`/payments/admin/find-by-amount?amount=${amount}`),
  
  approvePayment: (paymentId: string) => 
    api.post<{ payment: PaymentTransaction; message: string }>(`/payments/admin/${paymentId}/approve`),
  
  rejectPayment: (paymentId: string, reason: string) => 
    api.post<{ payment: PaymentTransaction; message: string }>(`/payments/admin/${paymentId}/reject`, { reason }),
  
  expireOldPayments: () => 
    api.post<{ message: string; expiredCount: number }>('/payments/admin/expire-old'),
};
