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
  GraduationCap
} from 'lucide-react';

interface WritingGuidanceProps {
  grade: 'PASS' | 'MERIT' | 'DISTINCTION';
  level: number;
}

/**
 * Writing Guidance Component
 * Teaches students how to structure and write good BTEC assignments
 * Provides grade-specific tips and examples
 */
export function WritingGuidance({ grade, level }: WritingGuidanceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('structure');

  const sections = {
    structure: {
      icon: FileText,
      title: 'Assignment Structure',
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" />
            How to Structure Your Assignment
          </h4>
          <div className="space-y-3 text-sm">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
              <p className="font-medium text-blue-900">Introduction (10% of word count)</p>
              <ul className="mt-2 space-y-1 text-blue-800">
                <li>• State the purpose of the assignment</li>
                <li>• Outline what you will cover</li>
                <li>• Define key terms and concepts</li>
                <li>• Explain your approach</li>
              </ul>
            </div>
            
            <div className="bg-green-50 border-l-4 border-green-500 p-3">
              <p className="font-medium text-green-900">Main Body (75% of word count)</p>
              <ul className="mt-2 space-y-1 text-green-800">
                <li>• One section per assessment criterion (P1, P2, M1, etc.)</li>
                <li>• Start each section with the criterion code and description</li>
                <li>• Use clear subheadings to organize ideas</li>
                <li>• Include examples, diagrams, and evidence</li>
                <li>• Link theory to practice</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 border-l-4 border-purple-500 p-3">
              <p className="font-medium text-purple-900">Conclusion (10% of word count)</p>
              <ul className="mt-2 space-y-1 text-purple-800">
                <li>• Summarize key findings</li>
                <li>• Address all criteria</li>
                <li>• Provide final thoughts or recommendations</li>
                <li>• No new information</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 border-l-4 border-gray-500 p-3">
              <p className="font-medium text-gray-900">References (5%)</p>
              <ul className="mt-2 space-y-1 text-gray-800">
                <li>• Use Harvard or APA referencing style</li>
                <li>• Include all sources cited in text</li>
                <li>• List alphabetically by author surname</li>
                <li>• Include books, journals, websites, reports</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    
    grading: {
      icon: GraduationCap,
      title: 'Understanding Grade Criteria',
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold">What Each Grade Requires</h4>
          
          <div className="space-y-3 text-sm">
            <div className="border-2 border-blue-400 bg-blue-50 p-4">
              <h5 className="font-semibold text-blue-900 mb-2">PASS Level</h5>
              <ul className="space-y-1 text-blue-800">
                <li><CheckCircle className="w-3 h-3 inline mr-1" /> Describe, explain, and outline concepts</li>
                <li><CheckCircle className="w-3 h-3 inline mr-1" /> Show understanding of key principles</li>
                <li><CheckCircle className="w-3 h-3 inline mr-1" /> Provide examples and basic explanations</li>
                <li><CheckCircle className="w-3 h-3 inline mr-1" /> Use appropriate terminology</li>
              </ul>
              <p className="mt-2 text-xs italic text-blue-700">
                Example: "Describe the features of..." or "Explain the process of..."
              </p>
            </div>
            
            <div className="border-2 border-amber-400 bg-amber-50 p-4">
              <h5 className="font-semibold text-amber-900 mb-2">MERIT Level</h5>
              <ul className="space-y-1 text-amber-800">
                <li><CheckCircle className="w-3 h-3 inline mr-1" /> Compare and contrast different approaches</li>
                <li><CheckCircle className="w-3 h-3 inline mr-1" /> Analyze relationships and patterns</li>
                <li><CheckCircle className="w-3 h-3 inline mr-1" /> Justify decisions with evidence</li>
                <li><CheckCircle className="w-3 h-3 inline mr-1" /> Show deeper understanding</li>
              </ul>
              <p className="mt-2 text-xs italic text-amber-700">
                Example: "Compare the effectiveness of..." or "Justify your approach to..."
              </p>
            </div>
            
            <div className="border-2 border-purple-400 bg-purple-50 p-4">
              <h5 className="font-semibold text-purple-900 mb-2">DISTINCTION Level</h5>
              <ul className="space-y-1 text-purple-800">
                <li><CheckCircle className="w-3 h-3 inline mr-1" /> Evaluate and critically assess</li>
                <li><CheckCircle className="w-3 h-3 inline mr-1" /> Make evidence-based judgments</li>
                <li><CheckCircle className="w-3 h-3 inline mr-1" /> Consider multiple perspectives</li>
                <li><CheckCircle className="w-3 h-3 inline mr-1" /> Reflect on limitations and improvements</li>
              </ul>
              <p className="mt-2 text-xs italic text-purple-700">
                Example: "Evaluate the impact of..." or "Critically assess the effectiveness of..."
              </p>
            </div>
          </div>
        </div>
      )
    },
    
    writing: {
      icon: Lightbulb,
      title: 'Writing Tips & Techniques',
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold">How to Write High-Quality Content</h4>
          
          <div className="space-y-3 text-sm">
            <div className="bg-white border-2 border-black p-3">
              <p className="font-medium mb-2">✓ Use Clear Academic Language</p>
              <p className="text-gray-700">
                Avoid casual language. Write formally but clearly. Use technical terms correctly and define them when first mentioned.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-red-50 p-2 border border-red-200">
                  <p className="font-medium text-red-800">❌ Don't write:</p>
                  <p className="text-red-700">"It's really cool how..."</p>
                </div>
                <div className="bg-green-50 p-2 border border-green-200">
                  <p className="font-medium text-green-800">✓ Do write:</p>
                  <p className="text-green-700">"This demonstrates..."</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border-2 border-black p-3">
              <p className="font-medium mb-2">✓ Provide Evidence and Examples</p>
              <p className="text-gray-700">
                Support all claims with evidence. Use real-world examples, case studies, statistics, or research findings.
              </p>
              <p className="mt-2 text-xs text-gray-600 italic">
                "According to Smith (2023), the implementation of [technique] resulted in a 45% improvement..."
              </p>
            </div>
            
            <div className="bg-white border-2 border-black p-3">
              <p className="font-medium mb-2">✓ Use Proper Paragraphs</p>
              <ul className="mt-2 space-y-1 text-gray-700">
                <li>• One main idea per paragraph</li>
                <li>• Start with a topic sentence</li>
                <li>• Provide supporting details</li>
                <li>• Link to the next paragraph</li>
                <li>• Aim for 4-6 sentences per paragraph</li>
              </ul>
            </div>
            
            <div className="bg-white border-2 border-black p-3">
              <p className="font-medium mb-2">✓ Reference Everything</p>
              <p className="text-gray-700">
                Cite sources in-text and in your reference list. This shows research and avoids plagiarism.
              </p>
              <p className="mt-2 text-xs text-gray-600 font-mono">
                In-text: (Jones, 2024)<br/>
                Reference: Jones, A. (2024) Title of Work. Publisher.
              </p>
            </div>
          </div>
        </div>
      )
    },
    
    checklist: {
      icon: CheckCircle,
      title: 'Quality Checklist',
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold">Before Submitting - Check These:</h4>
          
          <div className="space-y-2 text-sm">
            <ChecklistItem text="All assessment criteria are addressed with clear headings" />
            <ChecklistItem text="Introduction explains purpose and structure" />
            <ChecklistItem text="Each criterion has sufficient detail and examples" />
            <ChecklistItem text="Academic language used throughout" />
            <ChecklistItem text="Proper paragraphs with clear structure" />
            <ChecklistItem text="All claims supported by evidence" />
            <ChecklistItem text="Sources cited correctly (in-text and references)" />
            <ChecklistItem text="Spelling and grammar checked" />
            <ChecklistItem text="Diagrams/tables labeled and referenced" />
            <ChecklistItem text="Conclusion summarizes key points" />
            <ChecklistItem text="Reference list complete and formatted correctly" />
            <ChecklistItem text="Met word count requirements" />
            <ChecklistItem text="Checked for plagiarism and AI detection" />
          </div>
          
          <div className="bg-yellow-50 border-2 border-yellow-500 p-4 mt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-900">Important Reminder</p>
                <p className="text-yellow-800 mt-1">
                  AI-generated content is a starting point. You must verify all information, add your own insights, 
                  and ensure it meets your brief requirements. Submitting unmodified AI content violates academic integrity.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  };

  if (!isExpanded) {
    return (
      <Button
        onClick={() => setIsExpanded(true)}
        variant="outline"
        className="w-full border-2 border-blue-500 text-blue-700 hover:bg-blue-50"
      >
        <BookOpen className="w-4 h-4 mr-2" />
        How to Write a Good Assignment - Click for Guidance
        <ChevronDown className="w-4 h-4 ml-2" />
      </Button>
    );
  }

  const SectionIcon = sections[activeSection as keyof typeof sections].icon;

  return (
    <div className="border-2 border-blue-500 bg-white">
      {/* Header */}
      <div className="bg-blue-500 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6" />
          <div>
            <h3 className="font-bold text-lg">Assignment Writing Guidance</h3>
            <p className="text-sm text-blue-100">Level {level} • Target Grade: {grade}</p>
          </div>
        </div>
        <Button
          onClick={() => setIsExpanded(false)}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-blue-600"
        >
          <ChevronUp className="w-5 h-5" />
        </Button>
      </div>

      {/* Navigation */}
      <div className="border-b-2 border-gray-200 bg-gray-50 p-2 flex gap-2 overflow-x-auto">
        {Object.entries(sections).map(([key, section]) => {
          const Icon = section.icon;
          return (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded whitespace-nowrap transition-colors ${
                activeSection === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{section.title}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-6">
        {sections[activeSection as keyof typeof sections].content}
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
