import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { 
  Assignment, 
  CreateAssignmentData, 
  GenerationJob, 
  ProgressUpdate,
  ContentBlock,
  BTECLevel,
  TargetGrade
} from '../types';
import { useAuth } from './AuthContext';
import { assignmentsApi, briefsApi, generationApi, JobWebSocket, ApiError } from '../services/api';

// =============================================================================
// HELPERS
// =============================================================================

// Convert frontend grade format to backend format
const gradeToBackend = (grade: TargetGrade): 'P' | 'M' | 'D' => {
  switch (grade) {
    case 'PASS': return 'P';
    case 'MERIT': return 'M';
    case 'DISTINCTION': return 'D';
    default: return 'P';
  }
};

// Convert backend grade format to frontend format
const gradeFromBackend = (grade: 'P' | 'M' | 'D'): TargetGrade => {
  switch (grade) {
    case 'P': return 'PASS';
    case 'M': return 'MERIT';
    case 'D': return 'DISTINCTION';
    default: return 'PASS';
  }
};

// Ensure level is a valid BTECLevel
const validateLevel = (level: number): BTECLevel => {
  if (level >= 3 && level <= 6) return level as BTECLevel;
  return 3;
};

// Map backend status to frontend AssignmentStatus
const mapBackendStatus = (status: string): Assignment['status'] => {
  switch (status) {
    case 'DRAFT':
    case 'BRIEF_UPLOADED':
    case 'PARSING':
      return 'DRAFT';
    case 'GENERATING':
    case 'AWAITING_APPROVAL':
      return 'GENERATING';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'FAILED':
      return 'FAILED';
    default:
      return 'DRAFT';
  }
};

interface AssignmentContextType {
  assignments: Assignment[];
  isLoading: boolean;
  error: string | null;
  fetchAssignments: () => Promise<void>;
  createAssignment: (data: CreateAssignmentData) => Promise<string>;
  getAssignment: (id: string) => Assignment | undefined;
  deleteAssignment: (id: string) => Promise<void>;
  activeJob: GenerationJob | null;
  subscribeToJob: (jobId: string, onProgress: (update: ProgressUpdate) => void) => () => void;
  startGeneration: (assignmentId: string) => Promise<string>;
}

const AssignmentContext = createContext<AssignmentContextType | undefined>(undefined);

/**
 * Assignment Context Provider
 * Manages assignment CRUD operations and generation jobs
 * 
 * Connects to backend API and WebSocket for real-time updates
 */
export function AssignmentProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null);
  const wsRef = useRef<JobWebSocket | null>(null);

  // Load assignments when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAssignments();
    } else {
      setAssignments([]);
    }
  }, [isAuthenticated, user]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.disconnect();
    };
  }, []);

  /**
   * Fetch all assignments for current user
   * GET /api/admin/assignments
   */
  const fetchAssignments = async (): Promise<void> => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await assignmentsApi.list();
      
      // Handle both formats: { assignments: [] } or direct array
      const assignmentsData = Array.isArray(response) ? response : response?.assignments || [];
      
      if (!assignmentsData || assignmentsData.length === 0) {
        setAssignments([]);
        setIsLoading(false);
        return;
      }
      
      const mapped: Assignment[] = assignmentsData.map(a => {
        // Assignment model has: grade (enum), snapshot relation (unitName, level, etc)
        // Need to map these to frontend format
        const level = a.snapshot?.level || a.level || 3;
        const title = a.snapshot?.unitName || a.title || 'Untitled Assignment';
        const unitCode = a.snapshot?.unitCode || a.unitCode || '';
        const grade = a.grade || a.targetGrade || 'PASS';
        
        return {
          id: a.id,
          userId: a.userId,
          level: validateLevel(level),
          unitId: unitCode,
          unit: { 
            id: unitCode || a.id,
            level: validateLevel(level),
            unitNumber: 1,
            name: title, 
            description: null
          },
          targetGrade: typeof grade === 'string' && ['PASS', 'MERIT', 'DISTINCTION'].includes(grade) 
            ? grade as TargetGrade
            : gradeFromBackend(grade as 'P' | 'M' | 'D'),
          title: title,
          outputFile: a.docxUrl ? 'output.docx' : null,
          status: mapBackendStatus(a.status),
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt),
          wordCount: 0,
          guidance: a.guidance || undefined, // Include writing guidance
          content: a.content || undefined, // Include generated content
          // Include job data if available (cast to any to avoid circular type dependency)
          job: a.currentJob ? {
            id: a.currentJob.id,
            userId: a.userId,
            assignmentId: a.id,
            status: a.currentJob.status,
            currentStep: Math.round(a.currentJob.progress / 10) || 0,
            totalSteps: 10,
            startedAt: a.currentJob.startedAt ? new Date(a.currentJob.startedAt) : null,
            completedAt: null,
            errorMessage: a.currentJob.errorMessage || null,
            retryCount: 0,
            createdAt: new Date(a.currentJob.createdAt),
            logs: [],
          } as any : undefined,
        };
      });
      
      setAssignments(mapped);

    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load assignments';
      setError(message);
      console.error('Failed to fetch assignments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create new assignment
   * POST /api/assignments
   */
  const createAssignment = async (data: CreateAssignmentData & { unitName?: string }): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      // Use unitName if provided, otherwise fall back to title
      const unitNameToUse = data.unitName || data.title;
      
      const response = await assignmentsApi.create({
        unitName: unitNameToUse,
        unitCode: data.unitId || undefined,
        level: data.level,
        targetGrade: gradeToBackend(data.targetGrade),
      });

      const newAssignment: Assignment = {
        id: response.assignment.id,
        userId: response.assignment.userId,
        level: validateLevel(response.assignment.level),
        unitId: response.assignment.unitCode || '',
        unit: { 
          id: response.assignment.unitCode || response.assignment.id,
          level: validateLevel(response.assignment.level),
          unitNumber: 1,
          name: response.assignment.title, 
          description: null
        },
        targetGrade: gradeFromBackend(response.assignment.targetGrade),
        title: response.assignment.title,
        outputFile: null,
        status: mapBackendStatus(response.assignment.status),
        createdAt: new Date(response.assignment.createdAt),
        updatedAt: new Date(response.assignment.updatedAt),
        wordCount: 0
      };

      setAssignments(prev => [...prev, newAssignment]);
      
      return newAssignment.id;

    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create assignment';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Start generation for assignment
   * POST /api/generate/start
   */
  const startGeneration = async (assignmentId: string): Promise<string> => {
    try {
      const response = await generationApi.start(assignmentId);
      
      // Update local assignment state
      setAssignments(prev => prev.map(a => 
        a.id === assignmentId 
          ? { ...a, status: 'GENERATING' }
          : a
      ));
      
      return response.jobId;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to start generation';
      throw new Error(message);
    }
  };

  /**
   * Get specific assignment by ID
   */
  const getAssignment = (id: string): Assignment | undefined => {
    return assignments.find(a => a.id === id);
  };

  /**
   * Delete assignment
   * DELETE /api/admin/assignments/:id
   */
  const deleteAssignment = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      await assignmentsApi.delete(id);
      setAssignments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete assignment';
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * Subscribe to job progress updates via WebSocket
   */
  const subscribeToJob = (
    jobId: string, 
    onProgress: (update: ProgressUpdate) => void
  ): (() => void) => {
    const token = localStorage.getItem('btec_token');
    if (!token) {
      console.error('No auth token for WebSocket');
      return () => {};
    }

    // Disconnect existing WebSocket
    wsRef.current?.disconnect();

    // Create new WebSocket connection
    const ws = new JobWebSocket(jobId);
    wsRef.current = ws;

    ws.onProgress((data) => {
      onProgress({
        jobId,
        step: Math.floor(data.progress / 10),
        total: 10,
        message: `Stage: ${data.stage}`,
        percentage: data.progress
      });
    });

    ws.onComplete((data) => {
      onProgress({
        jobId,
        step: 10,
        total: 10,
        message: 'Generation complete!',
        percentage: 100
      });
      
      // Refresh assignments to get updated content
      fetchAssignments();
    });

    ws.onError((data) => {
      setError(data.error);
    });

    ws.connect(token);

    // Return cleanup function
    return () => {
      ws.disconnect();
      wsRef.current = null;
    };
  };

  return (
    <AssignmentContext.Provider
      value={{
        assignments,
        isLoading,
        error,
        fetchAssignments,
        createAssignment,
        getAssignment,
        deleteAssignment,
        activeJob,
        subscribeToJob,
        startGeneration
      }}
    >
      {children}
    </AssignmentContext.Provider>
  );
}

/**
 * Hook to access assignment context
 */
export function useAssignments(): AssignmentContextType {
  const context = useContext(AssignmentContext);
  
  if (context === undefined) {
    throw new Error('useAssignments must be used within AssignmentProvider');
  }
  
  return context;
}
