import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAssignments } from '../context/AssignmentContext';
import { Assignment } from '../types';
import { Button } from './ui/button';
import { LogOut, FileText, Clock, CircleCheck, CircleAlert, Plus, MessageCircle, ChevronDown, ChevronUp, Link2, Shield, Pause, Play, AlertCircle, User, Menu } from 'lucide-react';
import { DiscordLinkCard } from './DiscordLinkCard';
import { generationApi } from '../services/api';
import { MobileNav, NavItem, ResponsiveNav } from './ui/mobile-nav';
import { ResponsiveContainer, ResponsiveGrid } from './ui/responsive-container';

// Discord invite link
const DISCORD_INVITE_LINK = 'https://discord.gg/wjPGhY6X';

interface DashboardPageProps {
  onNavigate: (page: 'create' | 'monitor' | 'review' | 'how-to-use' | 'admin' | 'issues' | 'support' | 'profile' | 'tokens' | 'teacher' | 'briefs' | 'terms' | 'privacy' | 'disclaimer', assignmentId?: string) => void;
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8">
            <h1 className="text-xl sm:text-2xl tracking-tight" style={{ fontWeight: 700 }}>
              BTEC GENERATOR
            </h1>
            <button
              onClick={() => onNavigate('how-to-use')}
              className="hidden sm:block text-sm underline hover:no-underline"
            >
              How to Use
            </button>
          </div>

          {/* Mobile Navigation */}
          <MobileNav
            items={[
              { id: 'how-to-use', label: 'How to Use', onClick: () => onNavigate('how-to-use') },
              { id: 'tokens', label: 'Tokens', icon: <FileText className="w-5 h-5" />, onClick: () => onNavigate('tokens') },
              { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" />, onClick: () => onNavigate('profile') },
              ...(user?.role === 'TEACHER' || isAdmin ? [{ id: 'teacher', label: 'Teacher Dashboard', icon: <Shield className="w-5 h-5" />, onClick: () => onNavigate('teacher'), group: 'Admin' }] : []),
              ...(isAdmin ? [{ id: 'admin', label: 'Admin Panel', icon: <Shield className="w-5 h-5" />, onClick: () => onNavigate('admin'), variant: 'admin' as const, group: 'Admin' }] : []),
              { id: 'support', label: 'Support', icon: <AlertCircle className="w-5 h-5" />, onClick: () => onNavigate('support') },
              { id: 'discord', label: 'Join Discord', icon: <MessageCircle className="w-5 h-5" />, onClick: () => window.open(DISCORD_INVITE_LINK, '_blank') },
            ]}
            userInfo={{ email: user?.email }}
            onLogout={logout}
          />

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4">
            <button
              onClick={() => onNavigate('tokens')}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded hover:bg-green-200 transition-colors min-h-[44px]"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden lg:inline">Tokens</span>
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors min-h-[44px]"
            >
              <User className="w-4 h-4" />
              <span className="hidden lg:inline">Profile</span>
            </button>
            {(user?.role === 'TEACHER' || isAdmin) && (
              <button
                onClick={() => onNavigate('teacher')}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors font-semibold min-h-[44px]"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden lg:inline">Teacher</span>
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500 text-black text-sm rounded hover:bg-yellow-400 transition-colors font-semibold min-h-[44px]"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden lg:inline">Admin</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('support')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors min-h-[44px]"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="hidden lg:inline">Support</span>
            </button>
            <a
              href={DISCORD_INVITE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-[#5865F2] text-white text-sm rounded hover:bg-[#4752C4] transition-colors min-h-[44px]"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden lg:inline">Discord</span>
            </a>
            <span className="text-sm text-gray-600 hidden xl:block">{user?.email}</span>
            <Button
              onClick={logout}
              variant="outline"
              className="border-2 border-black bg-white hover:bg-black hover:text-white transition-colors min-h-[44px]"
            >
              <LogOut className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">Log Out</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
        
        {/* Header with CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 lg:mb-12">
          <div>
            <h2 className="text-2xl sm:text-3xl mb-1 sm:mb-2" style={{ fontWeight: 600 }}>
              Your Assignments
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'} total
            </p>
          </div>

          <Button
            onClick={() => onNavigate('create')}
            className="bg-black text-white px-4 sm:px-6 py-3 hover:bg-gray-800 border-0 flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="w-5 h-5" />
            Create New Assignment
          </Button>
        </div>

        {/* Discord Link Section */}
        <div className="mb-6 sm:mb-8 border-2 border-black">
          <button
            onClick={() => setShowDiscordLink(!showDiscordLink)}
            className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between bg-[#5865F2] text-white hover:bg-[#4752C4] transition-colors min-h-[44px]"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <Link2 className="w-5 h-5 flex-shrink-0" />
              <div className="text-left">
                <span className="font-semibold text-sm sm:text-base">Link Your Discord Account</span>
                <span className="text-xs sm:text-sm opacity-80 hidden sm:inline ml-2">Get notifications & use bot commands</span>
              </div>
            </div>
            {showDiscordLink ? <ChevronUp className="w-5 h-5 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 flex-shrink-0" />}
          </button>
          {showDiscordLink && (
            <div className="p-4 sm:p-6 bg-gray-50">
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
          <div className="border-2 border-black p-6 sm:p-12 text-center">
            <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 stroke-1" />
            <h3 className="text-lg sm:text-xl mb-2" style={{ fontWeight: 600 }}>
              No assignments yet
            </h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Create your first BTEC assignment to get started
            </p>
            <Button
              onClick={() => onNavigate('create')}
              className="bg-black text-white px-6 py-2 hover:bg-gray-800 border-0 w-full sm:w-auto min-h-[44px]"
            >
              Create Assignment
            </Button>
          </div>
        )}

        {/* Assignments Grid - Responsive: 1 col mobile, 2 col tablet, 3 col desktop */}
        {!isLoading && assignments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-600">
              <button onClick={() => onNavigate('terms')} className="hover:text-black hover:underline min-h-[44px] flex items-center">Terms of Use</button>
              <span className="hidden sm:inline self-center">•</span>
              <button onClick={() => onNavigate('privacy')} className="hover:text-black hover:underline min-h-[44px] flex items-center">Privacy Policy</button>
              <span className="hidden sm:inline self-center">•</span>
              <button onClick={() => onNavigate('disclaimer')} className="hover:text-black hover:underline min-h-[44px] flex items-center">Academic Disclaimer</button>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-sm text-gray-600">Made by Ajax Manson | BTEC Generator v1.0</p>
              <p className="text-xs text-gray-500 mt-1">
                © {new Date().getFullYear()} All Rights Reserved
              </p>
            </div>
          </div>
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
    <div className="border-2 border-black p-4 sm:p-6 hover:shadow-lg transition-shadow">
      
      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <div className={`px-3 py-1 text-xs flex items-center gap-2 ${getStatusColor()}`}>
          {getStatusIcon()}
          {getStatusText()}
        </div>
      </div>

      {/* Assignment Info */}
      <h3 className="text-base sm:text-lg mb-2 line-clamp-2" style={{ fontWeight: 600 }}>
        {assignment.title}
      </h3>

      <div className="space-y-1 text-sm text-gray-600 mb-3 sm:mb-4">
        <p>Level {assignment.level} • {assignment.targetGrade}</p>
        <p>Created {new Date(assignment.createdAt).toLocaleDateString()}</p>
        {assignment.wordCount && assignment.wordCount > 0 && (
          <p>{assignment.wordCount.toLocaleString()} words</p>
        )}
      </div>

      {/* Progress (if generating) */}
      {(assignment.status === 'GENERATING' || assignment.status === 'HUMANIZING') && assignment.job && (
        <div className="mb-3 sm:mb-4">
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

      {/* Actions - Stack vertically on mobile for better touch targets */}
      <div className="flex flex-col sm:flex-row gap-2">
        {assignment.status === 'DRAFT' ? (
          <Button
            onClick={onStartGeneration}
            className="flex-1 bg-black text-white py-2 hover:bg-gray-800 border-0 min-h-[44px]"
          >
            Start Generation
          </Button>
        ) : (
          <Button
            onClick={onView}
            className="flex-1 bg-black text-white py-2 hover:bg-gray-800 border-0 min-h-[44px]"
          >
            {assignment.status === 'COMPLETED' ? 'View' : 'Monitor'}
          </Button>
        )}
        <div className="flex gap-2">
          {(assignment.status === 'GENERATING' || assignment.status === 'HUMANIZING') && onPause && (
            <Button
              onClick={onPause}
              variant="outline"
              className="border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-colors flex-1 sm:flex-none min-h-[44px]"
              title="Pause Generation"
            >
              <Pause className="w-4 h-4" />
            </Button>
          )}
          <Button
            onClick={onDelete}
            variant="outline"
            className="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex-1 sm:flex-none min-h-[44px]"
            title="Delete Assignment"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}