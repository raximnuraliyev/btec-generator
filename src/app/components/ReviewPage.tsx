import React, { useState, useEffect } from 'react';
import { useAssignments } from '../context/AssignmentContext';
import { Button } from './ui/button';
import { ArrowLeft, Download, Trash2, TriangleAlert, FileText, Calendar, Target, CheckCircle } from 'lucide-react';
import { WritingGuidance } from './WritingGuidance';
import { assignmentsApi } from '../services/api';

interface ReviewPageProps {
  assignmentId: string;
  onNavigate: (page: 'dashboard') => void;
}

/**
 * Review & Export Page
 * View generated assignment and export as .docx
 * Black and white design
 */
export function ReviewPage({ assignmentId, onNavigate }: ReviewPageProps) {
  const { getAssignment, deleteAssignment, fetchAssignments } = useAssignments();
  const [isExporting, setIsExporting] = useState(false);
  const [assignment, setAssignment] = useState(getAssignment(assignmentId));

  // Refresh assignment when it completes
  useEffect(() => {
    const currentAssignment = getAssignment(assignmentId);
    if (currentAssignment) {
      setAssignment(currentAssignment);
    }
  }, [assignmentId, getAssignment]);

  // Poll for assignment updates if status is GENERATING
  useEffect(() => {
    if (assignment?.status === 'GENERATING') {
      const interval = setInterval(async () => {
        await fetchAssignments();
        const updated = getAssignment(assignmentId);
        if (updated && updated.status !== 'GENERATING') {
          setAssignment(updated);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [assignment?.status, assignmentId, fetchAssignments, getAssignment]);

  const canDownload = assignment?.status === 'COMPLETED' && assignment?.docxUrl;

  const handleExportClick = async () => {
    if (!canDownload) {
      alert('Assignment must be completed before downloading');
      return;
    }

    setIsExporting(true);
    try {
      // Direct download from backend
      const response = await assignmentsApi.download(assignmentId);
      
      // Create blob and download
      const blob = new Blob([response], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Assignment_${assignment.title || assignment.id}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert(`✓ Assignment downloaded successfully!\n\n⚠️ IMPORTANT:\n\n✓ Verify all content matches your brief\n✓ Check facts and references\n✓ Add your own insights\n✓ Complete the references section\n\nSubmitting unmodified AI-generated work may violate academic integrity policies.`);
    } catch (error: any) {
      console.error('Export error:', error);
      alert(error.message || 'Failed to download assignment');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this assignment? This cannot be undone.')) {
      try {
        await deleteAssignment(assignmentId);
        onNavigate('dashboard');
      } catch (error) {
        alert('Failed to delete assignment');
      }
    }
  };

  if (!assignment) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-4" />
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

  // Mock word count (in production, calculate from actual content blocks)
  const mockWordCount = assignment.targetGrade === 'PASS' ? 2500 
    : assignment.targetGrade === 'MERIT' ? 5000 
    : 8000;

  return (
    <div className="min-h-screen bg-white">
      
      {/* Header */}
      <header className="border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Button
            onClick={() => onNavigate('dashboard')}
            variant="ghost"
            className="mb-2 hover:bg-gray-100 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl" style={{ fontWeight: 700 }}>
                {assignment.title}
              </h1>
              <p className="mt-2 text-gray-600">
                Generated assignment ready for review
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleExportClick}
                disabled={isExporting || !canDownload}
                className="bg-black text-white px-6 hover:bg-gray-800 border-0 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {canDownload ? <CheckCircle className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                {isExporting ? 'Downloading...' : canDownload ? 'Download .DOCX' : 'Not Ready'}
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                className="border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Warning Banner */}
        <div className="bg-black text-white p-6 mb-8 flex gap-4">
          <TriangleAlert className="w-6 h-6 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-xl mb-2" style={{ fontWeight: 600 }}>
              Manual Review Required
            </h2>
            <p className="mb-3">
              This assignment was AI-generated and MUST be manually reviewed before submission.
            </p>
            <ul className="text-sm space-y-1">
              <li>✓ Verify all content matches your assignment brief requirements</li>
              <li>✓ Check all facts, statistics, and references for accuracy</li>
              <li>✓ Ensure examples and case studies are relevant and correct</li>
              <li>✓ Add proper citations and complete the references section</li>
              <li>✓ Personalize content with your own insights and understanding</li>
            </ul>
          </div>
        </div>

        {/* Writing Guidance Section */}
        <div className="mb-8">
          <WritingGuidance 
            grade={assignment.targetGrade} 
            level={assignment.level} 
          />
        </div>

        <div className="grid grid-cols-3 gap-8">
          
          {/* Left Sidebar - Metadata */}
          <div className="col-span-1 space-y-6">
            
            {/* Assignment Info */}
            <div className="border-2 border-black p-6">
              <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>
                Assignment Details
              </h3>
              <div className="space-y-3 text-sm">
                <InfoItem 
                  icon={<Target className="w-4 h-4" />}
                  label="Level"
                  value={`Level ${assignment.level}`}
                />
                <InfoItem 
                  icon={<Target className="w-4 h-4" />}
                  label="Target Grade"
                  value={assignment.targetGrade}
                />
                <InfoItem 
                  icon={<FileText className="w-4 h-4" />}
                  label="Word Count"
                  value={`${mockWordCount.toLocaleString()} words`}
                />
                <InfoItem 
                  icon={<Calendar className="w-4 h-4" />}
                  label="Generated"
                  value={new Date(assignment.createdAt).toLocaleDateString()}
                />
              </div>
            </div>

            {/* Section Navigator */}
            <div className="border-2 border-black p-6">
              <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>
                Sections
              </h3>
              <nav className="space-y-2 text-sm">
                <NavItem label="Introduction" />
                <NavItem label="P1: Basic Concepts" />
                <NavItem label="P2: Key Principles" />
                {assignment.targetGrade !== 'PASS' && (
                  <>
                    <NavItem label="M1: Comparative Analysis" />
                    <NavItem label="M2: Justification" />
                  </>
                )}
                {assignment.targetGrade === 'DISTINCTION' && (
                  <>
                    <NavItem label="D1: Critical Evaluation" />
                    <NavItem label="D2: Reflection" />
                  </>
                )}
                <NavItem label="Conclusion" />
                <NavItem label="References" />
              </nav>
            </div>
          </div>

          {/* Main Content - Preview */}
          <div className="col-span-2">
            <div className="border-2 border-black p-8">
              <h2 className="text-2xl mb-6" style={{ fontWeight: 600 }}>
                Content Preview
              </h2>

              {/* Mock Content */}
              <div className="space-y-6 text-sm">
                <ContentSection 
                  title="Introduction"
                  content="This assignment explores the fundamental concepts and principles of [subject area]. Through a comprehensive analysis of key theories and practical applications, this work demonstrates an understanding of [core concepts]. The assignment is structured to address all required criteria, progressing from foundational knowledge to critical evaluation and reflection."
                />

                <ContentSection 
                  title={`P1: ${getMockCriterionTitle('P1', assignment.level)}`}
                  content="[AI-generated content for Pass criterion 1 would appear here. This section typically includes definitions, explanations, and basic examples demonstrating foundational understanding of key concepts. In the actual export, this would be 500-800 words with proper paragraphs, examples, and potentially diagrams or tables.]"
                />

                <ContentSection 
                  title={`P2: ${getMockCriterionTitle('P2', assignment.level)}`}
                  content="[AI-generated content for Pass criterion 2 would continue here with additional explanations, step-by-step processes, and real-world applications. The full exported document contains complete, detailed content for each criterion.]"
                />

                {assignment.targetGrade !== 'PASS' && (
                  <ContentSection 
                    title="M1: Comparative Analysis"
                    content="[Merit-level content includes comparative analysis, justifications, and evidence-based arguments. This section would contain detailed comparisons between different approaches, theories, or methodologies with supporting evidence.]"
                  />
                )}

                {assignment.targetGrade === 'DISTINCTION' && (
                  <ContentSection 
                    title="D1: Critical Evaluation"
                    content="[Distinction-level content demonstrates critical thinking, evaluation of effectiveness, and synthesis of multiple frameworks. This section would include counterarguments, reflective analysis, and original conclusions.]"
                  />
                )}

                {/* Preview Note */}
                <div className="border-2 border-gray-300 bg-gray-50 p-4 text-center">
                  <p className="text-xs text-gray-600">
                    This is a preview. Export the full document to see complete content.
                  </p>
                </div>
              </div>
            </div>

            {/* Export Again Button */}
            <div className="mt-6 text-center">
              <Button
                onClick={handleExportClick}
                disabled={isExporting}
                className="bg-black text-white px-8 py-3 hover:bg-gray-800 border-0"
              >
                <Download className="w-5 h-5 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Complete Assignment'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Info Item Component
 */
function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-gray-600 mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-gray-600">{label}</p>
        <p style={{ fontWeight: 600 }}>{value}</p>
      </div>
    </div>
  );
}

/**
 * Nav Item Component
 */
function NavItem({ label }: { label: string }) {
  return (
    <button className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors border-l-2 border-transparent hover:border-black">
      {label}
    </button>
  );
}

/**
 * Content Section Component
 */
function ContentSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h3 className="text-lg mb-3 pb-2 border-b-2 border-gray-200" style={{ fontWeight: 600 }}>
        {title}
      </h3>
      <p className="text-gray-700 leading-relaxed">
        {content}
      </p>
    </div>
  );
}

/**
 * Helper: Get mock criterion titles based on level
 */
function getMockCriterionTitle(criterion: string, level: number): string {
  const titles: Record<string, string[]> = {
    P1: [
      'Basic Concepts and Definitions',
      'Fundamental Principles',
      'Core Theories and Frameworks',
      'Advanced Foundational Knowledge'
    ],
    P2: [
      'Key Processes and Methods',
      'Practical Applications',
      'Implementation Strategies',
      'Research Methodologies'
    ]
  };

  const index = Math.min(level - 3, 3);
  return titles[criterion]?.[index] || 'Generated Criterion';
}