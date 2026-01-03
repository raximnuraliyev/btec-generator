import React, { useState } from 'react';
import { Button } from './ui/button';
import { 
  BookOpen, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb, 
  FileText,
  Target,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Lock,
  Unlock
} from 'lucide-react';

interface OverviewGuidance {
  whatThisIsAbout: string;
  whatAssessorLooksFor: string[];
  howToStructure: string;
  howToReachGrade: string;
}

interface CriterionGuidance {
  criterionCode: string;
  criterionGoal: string;
  whatToInclude: string[];
  howToApproach: string;
  commonMistakes: string[];
  gradeDepthReminder: string;
}

interface WritingGuidanceData {
  overview: OverviewGuidance;
  criteriaGuidance: CriterionGuidance[];
}

interface Assignment {
  id: string;
  title: string;
  level: number;
  targetGrade: string;
  status: string;
  content?: any;
  guidance?: WritingGuidanceData;
  totalTokensUsed?: number;
  snapshot?: {
    unitName?: string;
    unitCode?: string;
  };
}

interface WritingGuidanceProps {
  grade: 'PASS' | 'MERIT' | 'DISTINCTION';
  level: number;
  assignment: Assignment;
}

/**
 * Assignment Writing Guidance System
 * Teaches students HOW to write, not WHAT to write
 * Separate instructional layer, non-copyable
 */
export function WritingGuidance({ grade, level, assignment }: WritingGuidanceProps) {
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());
  const [unlockedCriteria, setUnlockedCriteria] = useState<Set<string>>(new Set());

  const guidance = assignment.guidance;
  const isCompleted = assignment.status === 'COMPLETED';
  const isGenerating = assignment.status === 'GENERATING';

  // If no guidance yet, show loading state
  if (!guidance) {
    return (
      <div className="border-2 border-black p-8">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-8 h-8 stroke-1" />
          <h3 className="text-2xl font-semibold">Assignment Writing Guidance</h3>
        </div>
        {isGenerating ? (
          <p className="text-gray-600">✨ Generating your personalized writing guidance...</p>
        ) : (
          <p className="text-gray-600">📝 Guidance will be available after generation completes</p>
        )}
      </div>
    );
  }

  const toggleCriterion = (code: string) => {
    setExpandedCriteria((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const unlockCriterion = (code: string) => {
    if (isCompleted) {
      setUnlockedCriteria((prev) => new Set(prev).add(code));
    }
  };

  // Truncate text for blur preview (first 2 sentences)
  const truncateText = (text: string, sentences: number = 2): string => {
    const matches = text.match(/[^.!?]+[.!?]+/g);
    if (!matches || matches.length <= sentences) return text;
    return matches.slice(0, sentences).join(' ');
  };

  return (
    <div 
      className="border-2 border-black p-8 select-none"
      onCopy={(e) => e.preventDefault()}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-8 h-8 stroke-1" />
        <h3 className="text-2xl font-semibold">Assignment Writing Guidance</h3>
      </div>

      <div className="mb-6 p-4 bg-gray-100 border-l-4 border-black">
        <p className="text-sm font-medium">
          ⚠️ This guidance teaches you HOW to write your assignment, not WHAT to write. 
          Use it to understand the approach, then create your own original work.
        </p>
      </div>

      {/* SECTION 1: YOUR ASSIGNMENT OVERVIEW */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-black">
          <Target className="w-6 h-6 stroke-1" />
          <h4 className="text-xl font-semibold">Your Assignment Overview</h4>
        </div>

        {/* 1.1 What This Assignment Is About */}
        <div className="mb-6 p-5 bg-white border-2 border-gray-300">
          <h5 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 stroke-1" />
            What This Assignment Is About
          </h5>
          <p className="text-gray-700 leading-relaxed">
            {guidance.overview.whatThisIsAbout}
          </p>
        </div>

        {/* 1.2 What Your Assessor Is Looking For */}
        <div className="mb-6 p-5 bg-white border-2 border-gray-300">
          <h5 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 stroke-1" />
            What Your Assessor Is Looking For
          </h5>
          <ul className="space-y-2">
            {guidance.overview.whatAssessorLooksFor.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1">✓</span>
                <span className="text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 1.3 How to Structure Your Assignment */}
        <div className="mb-6 p-5 bg-white border-2 border-gray-300">
          <h5 className="font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 stroke-1" />
            How to Structure Your Assignment
          </h5>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {guidance.overview.howToStructure}
          </p>
        </div>

        {/* 1.4 How to Reach Your Selected Grade */}
        <div className="p-5 bg-gray-100 border-2 border-black">
          <h5 className="font-semibold mb-3 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 stroke-1" />
            How to Reach {grade} Grade
          </h5>
          <p className="text-gray-700 leading-relaxed">
            {guidance.overview.howToReachGrade}
          </p>
        </div>
      </div>

      {/* SECTION 2: YOUR SPECIFIC CRITERIA GUIDANCE */}
      <div>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-black">
          <AlertCircle className="w-6 h-6 stroke-1" />
          <h4 className="text-xl font-semibold">Your Specific Criteria Guidance</h4>
        </div>

        <div className="space-y-4">
          {guidance.criteriaGuidance.map((criterion) => {
            const isExpanded = expandedCriteria.has(criterion.criterionCode);
            const isUnlocked = unlockedCriteria.has(criterion.criterionCode);
            const gradeLevel = criterion.criterionCode.charAt(0);
            
            const borderColor = 
              gradeLevel === 'P' ? 'border-black' :
              gradeLevel === 'M' ? 'border-gray-600' :
              'border-gray-400';
            
            const badgeColor =
              gradeLevel === 'P' ? 'bg-black text-white' :
              gradeLevel === 'M' ? 'bg-gray-600 text-white' :
              'bg-gray-400 text-white';

            return (
              <div key={criterion.criterionCode} className={`bg-white border-2 ${borderColor}`}>
                {/* Criterion Header */}
                <button
                  onClick={() => toggleCriterion(criterion.criterionCode)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`${badgeColor} px-3 py-1 text-sm font-bold`}>
                      {criterion.criterionCode}
                    </span>
                    <span className="font-semibold">Criterion Guidance</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 stroke-1" />
                  ) : (
                    <ChevronDown className="w-5 h-5 stroke-1" />
                  )}
                </button>

                {/* Criterion Content */}
                {isExpanded && (
                  <div className="p-5 border-t-2 border-gray-300 space-y-4">
                    {/* Criterion Goal - Always visible */}
                    <div>
                      <h6 className="font-semibold mb-2 text-sm uppercase tracking-wide">
                        What This Criterion Asks
                      </h6>
                      <p className="text-gray-700">
                        {criterion.criterionGoal}
                      </p>
                    </div>

                    {/* Blurred content unless unlocked */}
                    <div className="relative">
                      <div className={!isUnlocked && isCompleted ? 'blur-sm pointer-events-none' : ''}>
                        {/* What to Include */}
                        <div className="mb-4">
                          <h6 className="font-semibold mb-2 text-sm uppercase tracking-wide">
                            What You Should Include
                          </h6>
                          <ul className="space-y-1">
                            {criterion.whatToInclude.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="mt-1">•</span>
                                <span className="text-gray-700 text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* How to Approach */}
                        <div className="mb-4">
                          <h6 className="font-semibold mb-2 text-sm uppercase tracking-wide">
                            How to Approach Writing It
                          </h6>
                          <p className="text-gray-700 text-sm whitespace-pre-line">
                            {criterion.howToApproach}
                          </p>
                        </div>

                        {/* Common Mistakes */}
                        <div className="mb-4">
                          <h6 className="font-semibold mb-2 text-sm uppercase tracking-wide">
                            Common Mistakes to Avoid
                          </h6>
                          <ul className="space-y-1">
                            {criterion.commonMistakes.map((mistake, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="mt-1">✗</span>
                                <span className="text-gray-700 text-sm">{mistake}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Grade Depth Reminder */}
                        <div className="p-3 bg-gray-100 border-2 border-gray-300">
                          <p className="text-sm text-gray-700 italic">
                            💡 {criterion.gradeDepthReminder}
                          </p>
                        </div>
                      </div>

                      {/* Unlock overlay */}
                      {!isUnlocked && isCompleted && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                          <Button
                            onClick={() => unlockCriterion(criterion.criterionCode)}
                            className="bg-black hover:bg-gray-800 text-white border-2 border-black"
                          >
                            <Unlock className="w-4 h-4 mr-2" />
                            Unlock Full Guidance
                          </Button>
                        </div>
                      )}

                      {/* Lock message before completion */}
                      {!isCompleted && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                          <div className="text-center">
                            <Lock className="w-8 h-8 stroke-1 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              Full guidance unlocks after generation completes
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Notice */}
      <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
        <p className="text-sm text-blue-800">
          <strong>Remember:</strong> This guidance is for learning purposes only. 
          Your final assignment must be written in your own words and reflect your own understanding.
        </p>
      </div>
    </div>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <label className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer group">
      <input 
        type="checkbox" 
        className="mt-1 w-4 h-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span className="text-gray-700 group-hover:text-gray-900">{text}</span>
    </label>
  );
}
