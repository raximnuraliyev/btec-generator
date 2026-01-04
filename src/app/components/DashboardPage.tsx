import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAssignments } from '../context/AssignmentContext';
import { Assignment } from '../types';
import { Button } from './ui/button';
import { LogOut, FileText, Clock, CircleCheck, CircleAlert, Plus, MessageCircle, ChevronDown, ChevronUp, Link2, Shield, Pause, Play, AlertCircle, User } from 'lucide-react';
import { DiscordLinkCard } from './DiscordLinkCard';
import { generationApi } from '../services/api';

// Discord invite link - replace with your actual invite
const DISCORD_INVITE_LINK = 'https://discord.gg/vBNRXCdd';

interface DashboardPageProps {
  onNavigate: (page: 'create' | 'monitor' | 'review' | 'how-to-use' | 'admin' | 'issues' | 'support' | 'profile' | 'tokens' | 'teacher' | 'briefs', assignmentId?: string) => void;
}

/**
 * Dashboard Page (Platform Main Page)
 * Strictly black and white design
 * Clean, professional, grid-based layout
 */
export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user, logout, isAdmin } = useAuth();
  const { assignments, isLoading, deleteAssignment, startGeneration, fetchAssignments } = useAssignments();
  const [showDiscordLink, setShowDiscordLink] = useState(false);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await deleteAssignment(id);
        // Refresh assignments list after deletion
        await fetchAssignments();
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete assignment: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  // Note: Pause functionality is intentionally disabled as backend doesn't support job cancellation
  // The AI generation process must complete once started to maintain data integrity
  const handlePause = async (assignmentId: string, jobId: string) => {
    try {
      // Backend does not have a cancel endpoint - generation must complete
      alert('Pause functionality is not available. Generation must complete once started.');
      await fetchAssignments();
    } catch (error) {
      alert('Failed to pause: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleStartGeneration = async (assignmentId: string) => {
    try {
      await startGeneration(assignmentId);
      onNavigate('monitor', assignmentId);
    } catch (error) {
      alert('Failed to start generation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* Top Navigation Bar */}
      <nav className="border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl tracking-tight" style={{ fontWeight: 700 }}>
              BTEC GENERATOR
            </h1>
            <button
              onClick={() => onNavigate('how-to-use')}
              className="text-sm underline hover:no-underline"
            >
              How to Use
            </button>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('tokens')}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded hover:bg-green-200 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Tokens
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            {(user?.role === 'TEACHER' || isAdmin) && (
              <button
                onClick={() => onNavigate('teacher')}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors font-semibold"
              >
                <Shield className="w-4 h-4" />
                Teacher
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500 text-black text-sm rounded hover:bg-yellow-400 transition-colors font-semibold"
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
            )}
            <button
              onClick={() => onNavigate('support')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
            >
              <AlertCircle className="w-4 h-4" />
              Support
            </button>
            <a
              href={DISCORD_INVITE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-[#5865F2] text-white text-sm rounded hover:bg-[#4752C4] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Discord
            </a>
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Button
              onClick={logout}
              variant="outline"
              className="border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        
        {/* Header with CTA */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl mb-2" style={{ fontWeight: 600 }}>
              Your Assignments
            </h2>
            <p className="text-gray-600">
              {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'} total
            </p>
          </div>

          <Button
            onClick={() => onNavigate('create')}
            className="bg-black text-white px-6 py-3 hover:bg-gray-800 border-0 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Assignment
          </Button>
        </div>

        {/* Discord Link Section */}
        <div className="mb-8 border-2 border-black">
          <button
            onClick={() => setShowDiscordLink(!showDiscordLink)}
            className="w-full px-6 py-4 flex items-center justify-between bg-[#5865F2] text-white hover:bg-[#4752C4] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Link2 className="w-5 h-5" />
              <span className="font-semibold">Link Your Discord Account</span>
              <span className="text-sm opacity-80">Get notifications & use bot commands</span>
            </div>
            {showDiscordLink ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {showDiscordLink && (
            <div className="p-6 bg-gray-50">
              <DiscordLinkCard />
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading assignments...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && assignments.length === 0 && (
          <div className="border-2 border-black p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 stroke-1" />
            <h3 className="text-xl mb-2" style={{ fontWeight: 600 }}>
              No assignments yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first BTEC assignment to get started
            </p>
            <Button
              onClick={() => onNavigate('create')}
              className="bg-black text-white px-6 py-2 hover:bg-gray-800 border-0"
            >
              Create Assignment
            </Button>
          </div>
        )}

        {/* Assignments Grid */}
        {!isLoading && assignments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map(assignment => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onView={() => {
                  if (assignment.status === 'GENERATING' || assignment.status === 'HUMANIZING') {
                    onNavigate('monitor', assignment.id);
                  } else if (assignment.status === 'COMPLETED') {
                    onNavigate('review', assignment.id);
                  }
                }}
                onDelete={() => handleDelete(assignment.id)}
                onPause={() => {
                  if (assignment.job?.id) {
                    handlePause(assignment.id, assignment.job.id);
                  }
                }}
                onStartGeneration={() => handleStartGeneration(assignment.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer - Sticky at bottom */}
      <footer className="border-t-2 border-black mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-gray-600">Made by Ajax Manson | BTEC Generator v1.0</p>
          <p className="text-xs text-gray-500 mt-2">
            © {new Date().getFullYear()} All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Assignment Card Component
 * Displays individual assignment with status
 */
function AssignmentCard({ 
  assignment, 
  onView, 
  onDelete,
  onPause,
  onStartGeneration,
}: { 
  assignment: Assignment; 
  onView: () => void; 
  onDelete: () => void;
  onPause?: () => void;
  onStartGeneration?: () => void;
}) {
  const getStatusIcon = () => {
    switch (assignment.status) {
      case 'DRAFT':
        return <FileText className="w-5 h-5" />;
      case 'GENERATING':
      case 'HUMANIZING':
        return <Clock className="w-5 h-5" />;
      case 'COMPLETED':
        return <CircleCheck className="w-5 h-5" />;
      case 'FAILED':
        return <CircleAlert className="w-5 h-5" />;
    }
  };

  const getStatusText = () => {
    switch (assignment.status) {
      case 'DRAFT':
        return 'Draft';
      case 'GENERATING':
        return 'Generating...';
      case 'HUMANIZING':
        return 'Humanizing...';
      case 'COMPLETED':
        return 'Completed';
      case 'FAILED':
        return 'Failed';
    }
  };

  const getStatusColor = () => {
    switch (assignment.status) {
      case 'COMPLETED':
        return 'bg-black text-white';
      case 'FAILED':
        return 'bg-gray-800 text-white';
      default:
        return 'bg-white text-black border border-black';
    }
  };

  return (
    <div className="border-2 border-black p-6 hover:shadow-lg transition-shadow">
      
      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`px-3 py-1 text-xs flex items-center gap-2 ${getStatusColor()}`}>
          {getStatusIcon()}
          {getStatusText()}
        </div>
      </div>

      {/* Assignment Info */}
      <h3 className="text-lg mb-2 line-clamp-2" style={{ fontWeight: 600 }}>
        {assignment.title}
      </h3>

      <div className="space-y-1 text-sm text-gray-600 mb-4">
        <p>Level {assignment.level} • {assignment.targetGrade}</p>
        <p>Created {new Date(assignment.createdAt).toLocaleDateString()}</p>
        {assignment.wordCount && assignment.wordCount > 0 && (
          <p>{assignment.wordCount.toLocaleString()} words</p>
        )}
      </div>

      {/* Progress (if generating) */}
      {(assignment.status === 'GENERATING' || assignment.status === 'HUMANIZING') && assignment.job && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 h-2 mb-1">
            <div 
              className="bg-black h-2 transition-all duration-300"
              style={{ 
                width: `${(assignment.job.currentStep / assignment.job.totalSteps) * 100}%` 
              }}
            />
          </div>
          <p className="text-xs text-gray-600">
            Step {assignment.job.currentStep} of {assignment.job.totalSteps}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {assignment.status === 'DRAFT' ? (
          <Button
            onClick={onStartGeneration}
            className="flex-1 bg-black text-white py-2 hover:bg-gray-800 border-0"
          >
            Start Generation
          </Button>
        ) : (
          <Button
            onClick={onView}
            className="flex-1 bg-black text-white py-2 hover:bg-gray-800 border-0"
          >
            {assignment.status === 'COMPLETED' ? 'View' : 'Monitor'}
          </Button>
        )}
        {(assignment.status === 'GENERATING' || assignment.status === 'HUMANIZING') && onPause && (
          <Button
            onClick={onPause}
            variant="outline"
            className="border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-colors"
            title="Pause Generation"
          >
            <Pause className="w-4 h-4" />
          </Button>
        )}
        <Button
          onClick={onDelete}
          variant="outline"
          className="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
          title="Delete Assignment"
        >
          Delete
        </Button>
      </div>
    </div>
  );
}