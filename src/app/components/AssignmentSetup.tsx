import React, { useState } from 'react';
import { useAssignments } from '../context/AssignmentContext';
import { TargetGrade } from '../types';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface AssignmentSetupProps {
  onNavigate: (page: 'dashboard' | 'monitor', assignmentId?: string) => void;
}

/**
 * Assignment Setup - NEW ARCHITECTURE
 * Users select from admin-created briefs
 * No file uploads allowed
 */
export function AssignmentSetup({ onNavigate }: AssignmentSetupProps) {
  const { createAssignment } = useAssignments();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  // Note: This component uses old workflow. Admin briefs are now managed via BriefManagementPage
  // Users should use AssignmentWizard which fetches briefs directly from briefsApi
  const [adminBriefs] = useState([]);

  const [formData, setFormData] = useState<{
    briefId: string;
    targetGrade: TargetGrade | undefined;
    targetWordCount: number;
  }>({
    briefId: '',
    targetGrade: undefined,
    targetWordCount: 3000,
  });

  const totalSteps = 3;

  const handleNext = () => {
    setError('');
    
    if (currentStep === 1 && !formData.briefId) {
      setError('Please select a brief');
      return;
    }
    if (currentStep === 2 && !formData.targetGrade) {
      setError('Please select a target grade');
      return;
    }

    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!formData.briefId || !formData.targetGrade) {
      setError('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const assignmentId = await createAssignment({
        briefId: formData.briefId,
        targetGrade: formData.targetGrade,
        targetWordCount: formData.targetWordCount,
      });
      onNavigate('dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Button
            onClick={() => onNavigate('dashboard')}
            variant="ghost"
            className="mb-2 hover:bg-gray-100 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </Button>
          <h1 className="text-3xl" style={{ fontWeight: 700 }}>
            Create New Assignment
          </h1>
          <p className="mt-2 text-gray-600">
            Step {currentStep} of {totalSteps}
          </p>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="max-w-4xl mx-auto px-6 mt-8">
        <div className="flex items-center">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 border-2 flex items-center justify-center ${
                    index + 1 < currentStep 
                      ? 'bg-black text-white border-black' 
                      : index + 1 === currentStep
                      ? 'border-black text-black'
                      : 'border-gray-300 text-gray-300'
                  }`}
                >
                  {index + 1 < currentStep ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <span className="text-xs mt-2 text-gray-600">
                  {['Brief', 'Grade', 'Confirm'][index]}
                </span>
              </div>
              {index < totalSteps - 1 && (
                <div 
                  className={`flex-1 h-0.5 mx-2 ${
                    index + 1 < currentStep ? 'bg-black' : 'bg-gray-300'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Form Area */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {error && (
          <div className="bg-black text-white p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="border-2 border-black p-8">
          {/* Step 1: Select Brief */}
          {currentStep === 1 && (
            <Step1SelectBrief
              value={formData.briefId}
              onChange={(briefId) => setFormData(prev => ({ ...prev, briefId }))}
              briefs={adminBriefs}
            />
          )}

          {/* Step 2: Target Grade */}
          {currentStep === 2 && (
            <Step2Grade
              value={formData.targetGrade}
              onChange={(targetGrade) => setFormData(prev => ({ ...prev, targetGrade }))}
            />
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <Step3Confirm
              briefId={formData.briefId}
              targetGrade={formData.targetGrade}
              targetWordCount={formData.targetWordCount}
              onWordCountChange={(count) => setFormData(prev => ({ ...prev, targetWordCount: count }))}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-6">
          {currentStep > 1 && (
            <Button
              onClick={handleBack}
              variant="outline"
              className="border-2 border-black bg-white hover:bg-gray-100 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          
          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              className="flex-1 bg-black text-white border-2 border-black hover:bg-gray-900 flex items-center justify-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-black text-white border-2 border-black hover:bg-gray-900"
            >
              {isSubmitting ? 'Creating...' : 'Create Assignment'}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Step 1: Select Brief (Admin-created only)
 */
function Step1SelectBrief({ 
  value, 
  onChange,
  briefs
}: { 
  value: string; 
  onChange: (v: string) => void;
  briefs: any[];
}) {
  if (briefs.length === 0) {
    return (
      <div>
        <h2 className="text-2xl mb-4" style={{ fontWeight: 600 }}>
          Select Assignment Brief
        </h2>
        <p className="text-gray-600 mb-6">
          No briefs available. Please contact your teacher to create a brief.
        </p>
        <div className="bg-gray-50 border border-gray-300 p-4 text-center text-gray-600">
          Waiting for admin-created briefs...
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl mb-4" style={{ fontWeight: 600 }}>
        Select Assignment Brief
      </h2>
      <p className="text-gray-600 mb-6">
        Choose from briefs created by your teacher
      </p>

      <div className="space-y-3">
        {briefs.map((brief) => (
          <button
            key={brief.id}
            onClick={() => onChange(brief.id)}
            className={`w-full text-left border-2 p-4 transition-all ${
              value === brief.id
                ? 'border-black bg-black text-white'
                : 'border-black bg-white hover:bg-gray-50'
            }`}
          >
            <div style={{ fontWeight: 600 }}>{brief.unitName}</div>
            {brief.unitCode && <p className="text-sm opacity-80">Code: {brief.unitCode}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Step 2: Target Grade
 */
function Step2Grade({ 
  value, 
  onChange 
}: { 
  value: TargetGrade | undefined; 
  onChange: (v: TargetGrade) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl mb-4" style={{ fontWeight: 600 }}>
        Select Target Grade
      </h2>
      <p className="text-gray-600 mb-6">
        Choose the grade level you're aiming for
      </p>

      <div className="grid grid-cols-3 gap-4">
        {['P', 'M', 'D'].map(grade => (
          <button
            key={grade}
            onClick={() => onChange(grade as TargetGrade)}
            className={`border-2 p-6 text-center transition-all ${
              value === grade
                ? 'border-black bg-black text-white'
                : 'border-black bg-white hover:bg-gray-50'
            }`}
          >
            <div className="text-3xl mb-2" style={{ fontWeight: 700 }}>
              {grade}
            </div>
            <p className="text-sm">
              {grade === 'P' && 'Pass'}
              {grade === 'M' && 'Merit'}
              {grade === 'D' && 'Distinction'}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Step 3: Confirmation
 */
function Step3Confirm({ 
  briefId, 
  targetGrade,
  targetWordCount,
  onWordCountChange
}: { 
  briefId: string;
  targetGrade: TargetGrade | undefined;
  targetWordCount: number;
  onWordCountChange: (count: number) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl mb-4" style={{ fontWeight: 600 }}>
        Review & Create
      </h2>
      <p className="text-gray-600 mb-6">
        Verify your selections before creating the assignment
      </p>

      {/* Summary */}
      <div className="space-y-3 mb-8 pb-8 border-b-2 border-gray-200">
        <SummaryItem label="Brief ID" value={briefId} />
        <SummaryItem label="Target Grade" value={targetGrade || 'Not selected'} />
        <SummaryItem label="Target Word Count" value={targetWordCount.toLocaleString()} />
      </div>

      {/* Word Count Adjustment */}
      <div>
        <Label className="block mb-2">
          Target Word Count
        </Label>
        <input
          type="number"
          value={targetWordCount}
          onChange={(e) => onWordCountChange(parseInt(e.target.value, 10))}
          min="500"
          max="50000"
          className="w-full border-2 border-black px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {/* Disclaimer */}
      <div className="mt-8 border-2 border-black p-4 bg-gray-50">
        <p className="text-xs">
          <strong>Important:</strong> Generated content must be manually reviewed and verified before submission. 
          You are responsible for ensuring accuracy and academic integrity.
        </p>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}:</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
