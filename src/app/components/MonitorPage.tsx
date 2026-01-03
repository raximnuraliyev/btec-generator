import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAssignments } from '../context/AssignmentContext';
import { Button } from './ui/button';
import { 
  ArrowLeft, 
  CircleCheck, 
  CircleAlert, 
  FileText, 
  Zap,
  Pause,
  Play,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  Coins
} from 'lucide-react';
import { generationApi, JobWebSocket } from '../services/api';

interface MonitorPageProps {
  assignmentId: string;
  onNavigate: (page: 'dashboard' | 'review', assignmentId?: string) => void;
}

interface RealTimeProgress {
  stage: string;
  progress: number;
  wordCount: number;
  message?: string;
  taskIndex?: number;
  totalTasks?: number;
  taskName?: string;
  currentCriteria?: string;
  grade?: string;
  wordsGenerated?: number;
  targetWords?: number;
}

interface JobState {
  id: string;
  status: string;
  currentStage: string;
  progress: number;
  currentWordCount: number;
  targetWordCount: number;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
}

/**
 * Generation Monitor Page
 * Real-time progress tracking with WebSocket updates
 * Shows detailed micro-task progress: Task X/Y, current task name, words generated
 */
export function MonitorPage({ assignmentId, onNavigate }: MonitorPageProps) {
  const { getAssignment, fetchAssignments } = useAssignments();
  const [jobState, setJobState] = useState<JobState | null>(null);
  const [realTimeProgress, setRealTimeProgress] = useState<RealTimeProgress | null>(null);
  const [logs, setLogs] = useState<{ time: string; message: string }[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedJobId, setCopiedJobId] = useState(false);
  const [assignmentNotFound, setAssignmentNotFound] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tokensUsed, setTokensUsed] = useState<number>(0);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const wsRef = useRef<JobWebSocket | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRefreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastProgressRef = useRef<number>(0);

  const assignment = getAssignment(assignmentId);

  // If assignment not found, try to fetch it
  useEffect(() => {
    if (!assignment && !assignmentNotFound) {
      fetchAssignments().then(() => {
        // Check again after fetch
        const foundAssignment = getAssignment(assignmentId);
        if (!foundAssignment) {
          setAssignmentNotFound(true);
          setIsLoading(false);
        }
      });
    }
  }, [assignment, assignmentId, fetchAssignments, getAssignment, assignmentNotFound]);

  // Add log entry
  const addLog = useCallback((message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-50), { time, message }]); // Keep last 50 logs
  }, []);

  // Fetch job status from API
  const fetchJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await generationApi.getStatus(jobId);
      setJobState({
        id: response.jobId,
        status: response.status,
        currentStage: response.currentStage,
        progress: response.progress,
        currentWordCount: response.currentWordCount || 0,
        targetWordCount: response.targetWordCount || 3000,
        errorMessage: response.errorMessage,
        createdAt: response.createdAt,
        startedAt: response.startedAt,
      });
      setIsPaused(response.status === 'AWAITING_APPROVAL');
      setIsLoading(false);
      return response;
    } catch (err) {
      console.error('Failed to fetch job status:', err);
      setIsLoading(false);
      return null;
    }
  }, []);

  // Setup WebSocket connection and polling
  useEffect(() => {
    if (!assignment) return;

    // Add initial log
    addLog('Monitoring assignment generation...');

    // Poll for updates every 3 seconds
    const pollInterval = setInterval(async () => {
      await fetchAssignments();
      const updated = getAssignment(assignmentId);
      
      if (updated) {
        // Log status changes
        if (updated.status !== assignment.status) {
          addLog(`Status changed: ${updated.status}`);
        }
        
        // Update local state
        if (updated.status === 'COMPLETED') {
          addLog('✓ Generation complete!');
          setJobState(prev => prev ? { ...prev, status: 'COMPLETED', progress: 100 } : null);
          clearInterval(pollInterval);
          
          // Auto-navigate after delay
          setTimeout(() => {
            onNavigate('review', assignmentId);
          }, 2000);
        } else if (updated.status === 'FAILED') {
          addLog('✗ Generation failed');
          setJobState(prev => prev ? { ...prev, status: 'FAILED' } : null);
          clearInterval(pollInterval);
        } else if (updated.status === 'GENERATING') {
          // Estimate progress based on time elapsed
          const elapsed = Date.now() - new Date(updated.createdAt).getTime();
          const estimatedProgress = Math.min(95, Math.floor((elapsed / 120000) * 100)); // 2 min estimate
          
          setJobState(prev => prev ? { 
            ...prev, 
            status: 'PROCESSING',
            progress: estimatedProgress,
            currentStage: 'Generating content...'
          } : null);
          
          // Only log every 10% change to avoid spam
          if (Math.floor(estimatedProgress / 10) !== Math.floor(lastProgressRef.current / 10)) {
            addLog(`Progress: ${estimatedProgress}% - Generating content blocks...`);
            lastProgressRef.current = estimatedProgress;
          }
        }
      }
    }, 3000); // Poll every 3 seconds

    // Initial state setup
    if (assignment.status === 'GENERATING') {
      setJobState({
        id: assignment.id,
        status: 'PROCESSING',
        currentStage: 'Generating content...',
        progress: 0,
        currentWordCount: 0,
        targetWordCount: 3000,
        createdAt: assignment.createdAt,
      });
    } else if (assignment.status === 'COMPLETED') {
      setJobState({
        id: assignment.id,
        status: 'COMPLETED',
        currentStage: 'Completed',
        progress: 100,
        currentWordCount: 0,
        targetWordCount: 3000,
        createdAt: assignment.createdAt,
      });
    }

    setIsLoading(false);

    return () => {
      clearInterval(pollInterval);
    };
  }, [assignment?.id, assignment?.status, assignmentId, fetchAssignments, getAssignment, addLog, onNavigate]);

  // Status helpers (defined early for use in effects)
  const isComplete = jobState?.status === 'COMPLETED';
  const isFailed = jobState?.status === 'FAILED';
  const isCancelled = jobState?.status === 'CANCELLED';
  const isTerminal = isComplete || isFailed || isCancelled;
  const isProcessing = jobState?.status === 'PROCESSING' || jobState?.status === 'QUEUED';
  const percentage = realTimeProgress?.progress ?? jobState?.progress ?? 0;

  // Manual refresh function (defined after fetchJobStatus)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchAssignments();
      if (jobState?.id) {
        await fetchJobStatus(jobState.id);
      }
      addLog('Status refreshed');
    } catch (error) {
      addLog('Failed to refresh status');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchAssignments, jobState?.id, fetchJobStatus, addLog]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefreshEnabled || isTerminal) {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
      return;
    }

    autoRefreshIntervalRef.current = setInterval(() => {
      handleRefresh();
    }, 10000); // 10 seconds

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [autoRefreshEnabled, isTerminal, handleRefresh]);

  // Update tokens used when assignment changes
  useEffect(() => {
    if (assignment?.totalTokensUsed) {
      setTokensUsed(assignment.totalTokensUsed);
    }
  }, [assignment?.totalTokensUsed]);

  // Handle pause
  const handlePause = async () => {
    if (!jobState?.id) return;
    setActionLoading(true);
    try {
      await generationApi.pause(jobState.id);
      setIsPaused(true);
      setJobState(prev => prev ? { ...prev, status: 'AWAITING_APPROVAL' } : null);
      addLog('Job paused');
    } catch (err: any) {
      addLog(`Failed to pause: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle resume
  const handleResume = async () => {
    if (!jobState?.id) return;
    setActionLoading(true);
    try {
      await generationApi.resume(jobState.id);
      setIsPaused(false);
      setJobState(prev => prev ? { ...prev, status: 'QUEUED' } : null);
      addLog('Job resumed');
    } catch (err: any) {
      addLog(`Failed to resume: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    if (!jobState?.id) return;
    setActionLoading(true);
    try {
      await generationApi.cancel(jobState.id);
      setJobState(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
      addLog('Job cancelled');
      setTimeout(() => onNavigate('dashboard'), 1000);
    } catch (err: any) {
      addLog(`Failed to cancel: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle retry
  const handleRetry = async () => {
    if (!jobState?.id) return;
    setActionLoading(true);
    try {
      await generationApi.retry(jobState.id);
      setJobState(prev => prev ? { ...prev, status: 'QUEUED', errorMessage: undefined } : null);
      addLog('Job retry queued');
    } catch (err: any) {
      addLog(`Failed to retry: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Copy job ID
  const copyJobId = () => {
    if (jobState?.id) {
      navigator.clipboard.writeText(jobState.id);
      setCopiedJobId(true);
      setTimeout(() => setCopiedJobId(false), 2000);
    }
  };

  // Get status display
  const getStatusDisplay = () => {
    if (!jobState) return { text: 'Loading...', color: 'text-gray-600' };
    switch (jobState.status) {
      case 'COMPLETED': return { text: 'Completed', color: 'text-green-600' };
      case 'FAILED': return { text: 'Failed', color: 'text-red-600' };
      case 'CANCELLED': return { text: 'Cancelled', color: 'text-gray-600' };
      case 'AWAITING_APPROVAL': return { text: 'Paused', color: 'text-yellow-600' };
      case 'PROCESSING': return { text: 'Generating...', color: 'text-blue-600' };
      case 'QUEUED': return { text: 'Queued', color: 'text-orange-600' };
      default: return { text: jobState.status, color: 'text-gray-600' };
    }
  };

  // Get current message
  const getCurrentMessage = () => {
    if (realTimeProgress?.taskName) {
      return realTimeProgress.taskName;
    }
    if (realTimeProgress?.stage) {
      return `Stage: ${realTimeProgress.stage}`;
    }
    if (jobState?.currentStage) {
      return `Stage: ${jobState.currentStage}`;
    }
    return 'Processing...';
  };

  // Not found state
  if (assignmentNotFound) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <CircleAlert className="w-12 h-12 mx-auto mb-4" />
          <p>Assignment not found</p>
          <Button
            onClick={() => onNavigate('dashboard')}
            className="mt-4 bg-black text-white"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  // Loading state while fetching assignment
  if (!assignment && isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-white">
      
      {/* Header */}
      <header className="border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <Button
              onClick={() => onNavigate('dashboard')}
              variant="ghost"
              className="hover:bg-gray-100 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {isTerminal ? 'Back to Dashboard' : 'Back (Generation continues)'}
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="border-2 border-black flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <h1 className="text-3xl" style={{ fontWeight: 700 }}>
            {assignment.title}
          </h1>
          <p className={`mt-2 ${statusDisplay.color}`} style={{ fontWeight: 600 }}>
            {statusDisplay.text}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Job ID Card */}
        {jobState?.id && (
          <div className="border-2 border-black p-4 mb-6 flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-600">Job ID:</span>
              <code className="ml-2 text-sm font-mono bg-gray-100 px-2 py-1">
                {jobState.id}
              </code>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyJobId}
              className="flex items-center gap-1"
            >
              {copiedJobId ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        )}

        {/* Status Card */}
        <div className="border-2 border-black p-8 mb-6">
          
          {/* Status Icon */}
          <div className="text-center mb-8">
            {isComplete ? (
              <div className="inline-flex items-center justify-center w-20 h-20 border-2 border-black bg-green-500 text-white">
                <CircleCheck className="w-10 h-10" />
              </div>
            ) : isFailed || isCancelled ? (
              <div className="inline-flex items-center justify-center w-20 h-20 border-2 border-black bg-red-500 text-white">
                <CircleAlert className="w-10 h-10" />
              </div>
            ) : isPaused ? (
              <div className="inline-flex items-center justify-center w-20 h-20 border-2 border-black bg-yellow-500 text-white">
                <Pause className="w-10 h-10" />
              </div>
            ) : (
              <div className="inline-block w-20 h-20 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>

          {/* Progress Bar */}
          {!isFailed && !isCancelled && (
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm" style={{ fontWeight: 600 }}>
                  {Math.round(percentage)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 h-4 border border-black">
                <div 
                  className={`h-full transition-all duration-500 ease-out ${
                    isPaused ? 'bg-yellow-500' : 'bg-black'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Micro-Task Progress */}
          {realTimeProgress && !isTerminal && (
            <div className="mb-8 p-4 bg-gray-50 border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                {/* Task Counter */}
                {realTimeProgress.taskIndex !== undefined && (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm text-gray-600">Micro-Task</span>
                    </div>
                    <p className="text-2xl" style={{ fontWeight: 700 }}>
                      {realTimeProgress.taskIndex} / {realTimeProgress.totalTasks || '?'}
                    </p>
                  </div>
                )}

                {/* Word Counter */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm text-gray-600">Words</span>
                  </div>
                  <p className="text-2xl" style={{ fontWeight: 700 }}>
                    {(realTimeProgress.wordsGenerated || realTimeProgress.wordCount || jobState?.currentWordCount || 0).toLocaleString()}
                    {' / '}
                    {(realTimeProgress.targetWords || jobState?.targetWordCount || 3000).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Current Task Name */}
              {realTimeProgress.taskName && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Currently generating:</p>
                  <p className="text-sm" style={{ fontWeight: 600 }}>
                    {realTimeProgress.currentCriteria && (
                      <span className="inline-block px-2 py-0.5 bg-black text-white text-xs mr-2">
                        {realTimeProgress.currentCriteria}
                      </span>
                    )}
                    {realTimeProgress.taskName}
                  </p>
                </div>
              )}

              {/* Grade Badge */}
              {realTimeProgress.grade && (
                <div className="mt-3 text-center">
                  <span className={`inline-block px-3 py-1 text-xs border-2 ${
                    realTimeProgress.grade === 'DISTINCTION' ? 'border-black bg-black text-white' :
                    realTimeProgress.grade === 'MERIT' ? 'border-black bg-gray-800 text-white' :
                    'border-black text-black'
                  }`}>
                    {realTimeProgress.grade}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Current Step */}
          <div className="text-center">
            <p className="text-xl mb-2" style={{ fontWeight: 600 }}>
              {isLoading ? 'Loading...' : getCurrentMessage()}
            </p>
            {jobState && !isTerminal && (
              <p className="text-sm text-gray-600">
                Stage: {jobState.currentStage}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center gap-4">
            {isProcessing && !isPaused && (
              <Button
                onClick={handlePause}
                disabled={actionLoading}
                variant="outline"
                className="flex items-center gap-2 border-2 border-black"
              >
                <Pause className="w-4 h-4" />
                {actionLoading ? 'Pausing...' : 'Pause'}
              </Button>
            )}

            {isPaused && (
              <Button
                onClick={handleResume}
                disabled={actionLoading}
                className="flex items-center gap-2 bg-black text-white"
              >
                <Play className="w-4 h-4" />
                {actionLoading ? 'Resuming...' : 'Resume'}
              </Button>
            )}

            {(isProcessing || isPaused) && (
              <Button
                onClick={handleCancel}
                disabled={actionLoading}
                variant="outline"
                className="flex items-center gap-2 border-2 border-red-500 text-red-500 hover:bg-red-50"
              >
                {actionLoading ? 'Cancelling...' : 'Cancel'}
              </Button>
            )}

            {isFailed && (
              <Button
                onClick={handleRetry}
                disabled={actionLoading}
                className="bg-black text-white"
              >
                {actionLoading ? 'Retrying...' : 'Retry'}
              </Button>
            )}
          </div>

          {/* Completion Message */}
          {isComplete && (
            <div className="mt-6 text-center">
              <p className="text-gray-600 mb-2">
                Your assignment has been generated successfully!
              </p>
              {tokensUsed > 0 && (
                <div className="flex items-center justify-center gap-2 mb-4 text-sm text-gray-700">
                  <Coins className="w-4 h-4" />
                  <span><strong>{tokensUsed.toLocaleString()}</strong> tokens used</span>
                </div>
              )}
              <Button
                onClick={() => onNavigate('review', assignmentId)}
                className="bg-black text-white px-8 py-3 hover:bg-gray-800 border-0"
              >
                Review Assignment
              </Button>
            </div>
          )}

          {/* Failure Message */}
          {isFailed && (
            <div className="mt-6 text-center">
              <p className="text-red-600 mb-4">
                {jobState?.errorMessage || 'An error occurred during generation'}
              </p>
            </div>
          )}
        </div>

        {/* Generation Log */}
        <div className="border-2 border-black p-6">
          <h2 className="text-xl mb-4" style={{ fontWeight: 600 }}>
            Generation Log
          </h2>
          <div className="bg-gray-900 text-gray-100 p-4 max-h-64 overflow-y-auto font-mono text-xs space-y-1">
            {logs.length === 0 ? (
              <div className="text-gray-500">Waiting for updates...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-gray-500">[{log.time}]</span>
                  <span>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Process Steps */}
        {!isTerminal && (
          <div className="mt-8 border-2 border-black p-6">
            <h2 className="text-xl mb-4" style={{ fontWeight: 600 }}>
              Generation Process
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              <ProcessStep 
                title="Planning Content Structure"
                description="Analyzing unit requirements and creating content plan"
                complete={percentage > 10}
                active={percentage <= 10 && !isTerminal}
              />
              <ProcessStep 
                title="Generating Pass Content"
                description="Creating P1, P2, P3... criterion content"
                complete={percentage > 40}
                active={percentage > 10 && percentage <= 40}
              />
              {assignment?.targetGrade !== 'PASS' && (
                <ProcessStep 
                  title="Generating Merit Content"
                  description="Creating M1, M2... criterion content with analysis"
                  complete={percentage > 70}
                  active={percentage > 40 && percentage <= 70}
                />
              )}
              {assignment?.targetGrade === 'DISTINCTION' && (
                <ProcessStep 
                  title="Generating Distinction Content"
                  description="Creating D1, D2... criterion content with evaluation"
                  complete={percentage > 85}
                  active={percentage > 70 && percentage <= 85}
                />
              )}
              <ProcessStep 
                title="Building DOCX Document"
                description="Assembling final Word document with formatting"
                complete={isComplete}
                active={percentage > 85 && !isComplete}
              />
            </div>
          </div>
        )}

        {/* Estimated Time */}
        {!isTerminal && (
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>Estimated time: 5-15 minutes depending on grade level</p>
            <p className="mt-1">You can close this page - the generation will continue</p>
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Process Step Component
 */
function ProcessStep({ 
  title, 
  description, 
  complete, 
  active 
}: { 
  title: string; 
  description: string; 
  complete?: boolean; 
  active?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 mt-1">
        {complete ? (
          <div className="w-5 h-5 bg-green-500 text-white flex items-center justify-center rounded-sm">
            <CircleCheck className="w-4 h-4" />
          </div>
        ) : active ? (
          <div className="w-5 h-5 border-2 border-black bg-yellow-400 animate-pulse rounded-sm"></div>
        ) : (
          <div className="w-5 h-5 border-2 border-gray-300 rounded-sm"></div>
        )}
      </div>
      <div>
        <p style={{ fontWeight: 600 }}>{title}</p>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
    </div>
  );
}