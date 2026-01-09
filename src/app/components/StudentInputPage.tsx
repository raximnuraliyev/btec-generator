import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, AlertCircle, ArrowLeft, FileEdit, Sparkles } from 'lucide-react';
import { assignmentsApi } from '../services/api';
import { StudentInputForm } from './StudentInputForm';
import type { Brief, StudentInputData, InputFieldDefinition } from '../types';

type Page = 'login' | 'dashboard' | 'how-to-use' | 'create' | 'profile' | 'monitor' | 'review' | 'admin' | 'issues' | 'support' | 'tokens' | 'briefs' | 'create-brief' | 'preview' | 'teacher' | 'student-inputs' | 'terms' | 'privacy' | 'disclaimer';

interface StudentInputPageProps {
  assignmentId: string;
  onNavigate: (page: Page, id?: string) => void;
}

interface AssignmentWithInputs {
  id: string;
  status: string;
  studentInputs?: StudentInputData;
  studentInputsCompletedAt?: string | null;
  briefSnapshot?: {
    requiredInputs?: InputFieldDefinition[];
    unitName?: string;
    unitCode?: string;
    scenario?: string;
    [key: string]: unknown;
  };
}

/**
 * StudentInputPage - Page for students to fill in their project details
 * 
 * This page is shown after an assignment is created but before generation.
 * Students must fill in details about their actual work so the AI can write
 * personalised, first-person content based on what they actually did.
 */
export function StudentInputPage({ assignmentId, onNavigate }: StudentInputPageProps) {
  const [assignment, setAssignment] = useState<AssignmentWithInputs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [inputsComplete, setInputsComplete] = useState(false);

  useEffect(() => {
    loadAssignment();
  }, [assignmentId]);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await assignmentsApi.get(assignmentId);
      const data = response.assignment as unknown as AssignmentWithInputs;
      setAssignment(data);
      setInputsComplete(!!data.studentInputsCompletedAt);
    } catch (err: any) {
      setError(err.message || 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInputs = async (data: StudentInputData) => {
    try {
      setSaving(true);
      setError('');
      
      const response = await assignmentsApi.saveStudentInputs(assignmentId, data);
      setInputsComplete(response.complete);
      
      // Update local state
      setAssignment(prev => prev ? {
        ...prev,
        studentInputs: data,
        studentInputsCompletedAt: response.complete ? new Date().toISOString() : null
      } : null);

      if (response.complete) {
        // All required inputs are filled - can proceed to generation
        // Don't auto-start, let user click the button
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save inputs');
    } finally {
      setSaving(false);
    }
  };

  const handleStartGeneration = async () => {
    try {
      setGenerating(true);
      setError('');
      
      const response = await assignmentsApi.startGeneration(assignmentId);
      
      // Navigate to monitor page
      onNavigate('monitor', assignmentId);
    } catch (err: any) {
      setError(err.message || 'Failed to start generation');
      setGenerating(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-white/70">Loading assignment...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => onNavigate('dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Check if assignment has required inputs
  const briefSnapshot = assignment?.briefSnapshot;
  const requiredInputs = briefSnapshot?.requiredInputs || [];
  const hasRequiredInputs = requiredInputs.length > 0;

  // Create a Brief-like object for the form
  const briefForForm: Brief = {
    id: assignmentId,
    title: briefSnapshot?.unitName || 'Assignment',
    unitCode: briefSnapshot?.unitCode || '',
    unitName: briefSnapshot?.unitName || '',
    subjectName: '',
    level: 3,
    scenario: briefSnapshot?.scenario || '',
    language: 'en',
    requiredInputs: requiredInputs,
    createdAt: '',
    updatedAt: '',
    createdById: '',
    isActive: true,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => onNavigate('dashboard')}
            className="text-white/70 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {briefSnapshot?.unitName || 'Assignment'}
            </h1>
            {briefSnapshot?.unitCode && (
              <p className="text-white/60">{briefSnapshot.unitCode}</p>
            )}
          </div>
        </div>

        {/* Error display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main content */}
        <Card className="bg-slate-800/50 border-white/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <FileEdit className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-white">Your Project Details</CardTitle>
                <CardDescription className="text-white/60">
                  {hasRequiredInputs
                    ? 'Tell us about your work so we can write personalised, first-person content'
                    : 'This assignment is ready for generation'
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {hasRequiredInputs ? (
              <StudentInputForm
                brief={briefForForm}
                initialData={assignment?.studentInputs || {}}
                onSubmit={handleSaveInputs}
                onCancel={() => onNavigate('dashboard')}
                isSubmitting={saving}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-white/70 mb-6">
                  This brief does not require any project details. You can proceed directly to generation.
                </p>
                <Button
                  onClick={handleStartGeneration}
                  disabled={generating}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting Generation...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Start Generation
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Show generation button if inputs are complete */}
            {hasRequiredInputs && inputsComplete && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500/20">
                      <Sparkles className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Ready to Generate</p>
                      <p className="text-white/60 text-sm">All required details have been provided</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleStartGeneration}
                    disabled={generating}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Start Generation
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info card */}
        <Card className="mt-6 bg-blue-900/20 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="shrink-0">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-white font-medium">Why We Need This Information</h4>
                <p className="text-white/70 text-sm">
                  Your assignment will be written in <strong className="text-white">first person</strong> ("I designed...", "I implemented...") 
                  based on the details you provide here. This ensures the content reflects <strong className="text-white">your actual work</strong>, 
                  not generic examples.
                </p>
                <p className="text-white/70 text-sm">
                  The AI will use your project title, tools, features, and experiences to create personalised academic writing 
                  that accurately represents what you accomplished.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default StudentInputPage;
