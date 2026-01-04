import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Button } from './ui/button';
import { 
  ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle,
  RefreshCw, Download, Eye, Users, Zap, Loader2
} from 'lucide-react';

interface GenerationJob {
  id: string;
  assignmentId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  queuePosition: number | null;
  estimatedTime: number | null;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  logs: { timestamp: string; message: string; level: string }[];
  preview: {
    introduction: string | null;
    wordCount: number;
    sections: number;
  } | null;
}

interface MonitorPageProps {
  assignmentId: string;
  onBack: () => void;
  onComplete: () => void;
}

const STEPS = [
  { id: 'queued', label: 'In Queue', icon: Users },
  { id: 'planning', label: 'Planning', icon: Zap },
  { id: 'generating', label: 'Writing', icon: Loader2 },
  { id: 'building', label: 'Building DOCX', icon: Download },
  { id: 'completed', label: 'Complete', icon: CheckCircle }
];

export function MonitorPage({ assignmentId, onBack, onComplete }: MonitorPageProps) {
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    loadJob();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [assignmentId]);

  useEffect(() => {
    // Auto-scroll logs
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [job?.logs]);

  const loadJob = async () => {
    try {
      const data = await api.get(`/generation/status/${assignmentId}`) as GenerationJob;
      setJob(data);
      
      if (data.status === 'completed') {
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job status');
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/generation/${assignmentId}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setJob(prev => prev ? { ...prev, ...data } : data);
          
          if (data.status === 'completed') {
            setTimeout(onComplete, 1500);
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        // Reconnect after 3 seconds if not completed
        setTimeout(() => {
          if (job?.status !== 'completed' && job?.status !== 'failed') {
            connectWebSocket();
          }
        }, 3000);
      };

      ws.onerror = () => {
        // Fall back to polling
        const pollInterval = setInterval(async () => {
          await loadJob();
          if (job?.status === 'completed' || job?.status === 'failed') {
            clearInterval(pollInterval);
          }
        }, 5000);
      };
    } catch (e) {
      // WebSocket not supported, use polling
      const pollInterval = setInterval(async () => {
        await loadJob();
        if (job?.status === 'completed' || job?.status === 'failed') {
          clearInterval(pollInterval);
        }
      }, 5000);
    }
  };

  const getCurrentStepIndex = () => {
    if (!job) return 0;
    if (job.status === 'queued') return 0;
    if (job.status === 'completed') return 4;
    if (job.status === 'failed') return -1;
    
    // Map currentStep to step index
    const stepMap: Record<string, number> = {
      'planning': 1,
      'generating_introduction': 2,
      'generating_content': 2,
      'generating_conclusion': 2,
      'building_document': 3
    };
    return stepMap[job.currentStep] || 2;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading generation status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border-2 border-red-500 p-8 max-w-md text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={onBack} className="bg-black text-white hover:bg-gray-800">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold">Generation Progress</h1>
            </div>
            <Button variant="outline" onClick={loadJob} className="border-2 border-black">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Queue Position Banner */}
        {job?.status === 'queued' && job.queuePosition !== null && (
          <div className="bg-yellow-50 border-2 border-yellow-400 p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-bold text-yellow-800">In Queue</p>
                <p className="text-sm text-yellow-700">
                  Position #{job.queuePosition} • {job.estimatedTime ? `~${formatTime(job.estimatedTime)} remaining` : 'Estimating...'}
                </p>
              </div>
            </div>
            <div className="text-4xl font-bold text-yellow-600">#{job.queuePosition}</div>
          </div>
        )}

        {/* Status Card */}
        <div className={`bg-white border-2 p-6 mb-6 ${
          job?.status === 'failed' ? 'border-red-500' :
          job?.status === 'completed' ? 'border-green-500' :
          'border-black'
        }`}>
          {/* Step Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
                <div 
                  className="h-full bg-black transition-all duration-500"
                  style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                />
              </div>
              
              {/* Steps */}
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;
                const isFailed = job?.status === 'failed' && index === currentStepIndex;
                
                return (
                  <div key={step.id} className="flex flex-col items-center z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isFailed ? 'border-red-500 bg-red-100' :
                      isCompleted ? 'border-black bg-black text-white' :
                      isActive ? 'border-black bg-white animate-pulse' :
                      'border-gray-300 bg-white'
                    }`}>
                      {isFailed ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className={`w-5 h-5 ${isActive ? 'animate-spin' : ''}`} />
                      )}
                    </div>
                    <span className={`text-xs mt-2 ${
                      isActive || isCompleted ? 'font-bold' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Status */}
          <div className="text-center mb-6">
            {job?.status === 'completed' ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-700">Generation Complete!</h2>
                <p className="text-gray-600 mt-2">Your assignment is ready for download.</p>
              </>
            ) : job?.status === 'failed' ? (
              <>
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-700">Generation Failed</h2>
                <p className="text-red-600 mt-2">{job.error || 'An unexpected error occurred.'}</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-bold">{job?.currentStep?.replace(/_/g, ' ').toUpperCase() || 'Processing...'}</h2>
                <p className="text-gray-600 mt-2">
                  {job?.progress ? `${job.progress}% complete` : 'Please wait...'}
                </p>
              </>
            )}
          </div>

          {/* Progress Bar */}
          {job?.status === 'processing' && (
            <div className="mb-6">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-black transition-all duration-300"
                  style={{ width: `${job.progress || 0}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2 text-center">
                {job.progress || 0}% complete
              </p>
            </div>
          )}

          {/* Time Info */}
          {job?.startedAt && (
            <div className="flex justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Started: {new Date(job.startedAt).toLocaleTimeString()}
              </span>
              {job.completedAt && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Completed: {new Date(job.completedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Preview Panel (Blurred until complete) */}
        {job?.preview && (
          <div className="bg-white border-2 border-black p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Preview
              </h3>
              {job.status !== 'completed' && (
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Full preview available when complete
                </span>
              )}
            </div>
            
            <div className={`relative ${job.status !== 'completed' ? 'select-none' : ''}`}>
              {job.status !== 'completed' && (
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white z-10" />
              )}
              <div className={job.status !== 'completed' ? 'blur-sm' : ''}>
                <p className="text-gray-700 leading-relaxed">
                  {job.preview.introduction || 'Generating introduction...'}
                </p>
              </div>
              
              <div className="mt-4 pt-4 border-t flex gap-6 text-sm text-gray-500">
                <span>Words: {job.preview.wordCount.toLocaleString()}</span>
                <span>Sections: {job.preview.sections}</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Logs */}
        {job?.logs && job.logs.length > 0 && (
          <div className="bg-white border-2 border-black overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b-2 border-black font-bold text-sm">
              Generation Logs
            </div>
            <div className="p-4 max-h-64 overflow-y-auto font-mono text-xs bg-gray-900 text-gray-100">
              {job.logs.map((log, index) => (
                <div key={index} className={`py-1 ${
                  log.level === 'error' ? 'text-red-400' :
                  log.level === 'warning' ? 'text-yellow-400' :
                  log.level === 'success' ? 'text-green-400' :
                  'text-gray-300'
                }`}>
                  <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                  {log.message}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* Actions */}
        {job?.status === 'completed' && (
          <div className="mt-6 flex justify-center gap-4">
            <Button 
              onClick={onComplete}
              className="bg-black text-white hover:bg-gray-800 px-8"
            >
              <Download className="w-4 h-4 mr-2" />
              View & Download
            </Button>
          </div>
        )}

        {job?.status === 'failed' && (
          <div className="mt-6 flex justify-center gap-4">
            <Button 
              onClick={onBack}
              variant="outline"
              className="border-2 border-black"
            >
              Go Back
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-black text-white hover:bg-gray-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MonitorPage;
