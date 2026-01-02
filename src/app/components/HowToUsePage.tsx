import React from 'react';
import { Button } from './ui/button';
import { ArrowLeft, TriangleAlert, MessageCircle } from 'lucide-react';

interface HowToUsePageProps {
  onNavigate: (page: 'dashboard') => void;
}

// Discord invite link - replace with your actual invite
const DISCORD_INVITE_LINK = 'https://discord.com/invite/vBNRXCdd';

/**
 * How to Use Page
 * Documentation-style, black and white
 * Clear step-by-step instructions
 */
export function HowToUsePage({ onNavigate }: HowToUsePageProps) {
  return (
    <div className="min-h-screen bg-white">
      
      {/* Header */}
      <header className="border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <Button
                onClick={() => onNavigate('dashboard')}
                variant="ghost"
                className="mb-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <h1 className="text-3xl" style={{ fontWeight: 700 }}>
                How to Use the BTEC Generator
              </h1>
              <p className="mt-2 text-gray-600">
                Complete guide to generating AI-powered BTEC assignments
              </p>
            </div>
            
            {/* Discord Link */}
            <a
              href={DISCORD_INVITE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Join Discord
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Important Warning */}
        <div className="border-2 border-black bg-black text-white p-6 mb-12">
          <div className="flex gap-4">
            <TriangleAlert className="w-6 h-6 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl mb-2" style={{ fontWeight: 600 }}>
                Important Notice
              </h2>
              <p className="mb-2">
                This platform generates AI-powered academic content. All outputs MUST be manually reviewed, 
                verified, and personalized before submission.
              </p>
              <p>
                Submitting unverified AI-generated work may violate academic integrity policies. 
                You are responsible for ensuring accuracy and originality.
              </p>
            </div>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <section className="space-y-12">
          
          <InstructionStep
            number={1}
            title="Create Your Account"
            description="Sign up with your email address and create a secure password. Your account will store all generated assignments."
          />

          <InstructionStep
            number={2}
            title="Start a New Assignment"
            description="From the dashboard, click 'Create New Assignment' to begin the setup process."
          />

          <InstructionStep
            number={3}
            title="Select BTEC Level"
            description="Choose your qualification level (3, 4, 5, or 6). Each level has different academic expectations:"
            bullets={[
              'Level 3: Foundational knowledge with guided learning',
              'Level 4: Intermediate concepts with independent work',
              'Level 5: Advanced theories with critical thinking',
              'Level 6: Research-level synthesis and original insights'
            ]}
          />

          <InstructionStep
            number={4}
            title="Choose Unit"
            description="Select the specific BTEC unit you're working on. Units are filtered by your selected level."
          />

          <InstructionStep
            number={5}
            title="Select Target Grade"
            description="Choose your target achievement level. This determines the depth and word count:"
            bullets={[
              'Pass (P): 2,000-3,000 words – Definitions and explanations',
              'Merit (M): 4,000-6,000 words – Comparisons and justifications',
              'Distinction (D): 7,000-9,500 words – Evaluation and critical reflection'
            ]}
          />

          <InstructionStep
            number={6}
            title="Upload Assignment Brief"
            description="Upload your assignment brief document (.docx or .pdf). The system will automatically extract criteria and requirements."
          />

          <InstructionStep
            number={7}
            title="Confirm and Generate"
            description="Review your selections and click 'Generate Assignment'. The process typically takes 5-15 minutes depending on grade level."
          />

          <InstructionStep
            number={8}
            title="Monitor Progress"
            description="Watch real-time progress as the system:"
            bullets={[
              'Parses your assignment brief',
              'Generates content criterion-by-criterion (P → M → D)',
              'Humanizes the content for natural student voice',
              'Builds the final formatted document'
            ]}
          />

          <InstructionStep
            number={9}
            title="Review and Export"
            description="Once complete, review the generated content and export as a .docx file. Remember to:"
            bullets={[
              'Verify all facts, statistics, and references',
              'Check alignment with your specific brief requirements',
              'Add your own insights and examples',
              'Complete the references section with proper citations',
              'Ensure the content reflects your understanding'
            ]}
          />
        </section>

        {/* Technical Details */}
        <section className="mt-16 pt-16 border-t-2 border-black">
          <h2 className="text-2xl mb-6" style={{ fontWeight: 600 }}>
            How It Works (Technical)
          </h2>

          <div className="space-y-6 text-gray-800">
            <div>
              <h3 className="mb-2" style={{ fontWeight: 600 }}>Ultra-Micro Task Pipeline</h3>
              <p className="mb-2">
                The system breaks down your assignment into 50-70 small "micro-tasks", each generating 
                approximately 100-150 words. This approach ensures:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                <li>Consistent quality across the entire document</li>
                <li>Better handling of complex criteria</li>
                <li>More reliable generation with fewer errors</li>
                <li>Real-time progress tracking for each section</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2" style={{ fontWeight: 600 }}>Criterion-by-Criterion Approach</h3>
              <p>
                Each criterion (P1, P2, M1, D1, etc.) is broken into atomic units: definitions, 
                characteristics, examples, analysis, and evaluations. The system generates each 
                piece separately and assembles them into a cohesive document.
              </p>
            </div>

            <div>
              <h3 className="mb-2" style={{ fontWeight: 600 }}>Word Count Breakdown</h3>
              <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                <li><strong>Pass (P):</strong> ~2,500 words → ~17 micro-tasks</li>
                <li><strong>Merit (M):</strong> ~5,000 words → ~35 micro-tasks</li>
                <li><strong>Distinction (D):</strong> ~9,000 words → ~60 micro-tasks</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2" style={{ fontWeight: 600 }}>Stateless AI Architecture</h3>
              <p>
                Each micro-task is independent - the AI doesn't "remember" previous tasks. Instead, 
                all context is stored in our database and injected into each prompt. This means:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-sm mt-2">
                <li>Generation can be paused and resumed at any point</li>
                <li>Failed tasks are automatically retried</li>
                <li>No risk of losing progress due to AI timeouts</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2" style={{ fontWeight: 600 }}>Download Limits</h3>
              <p>
                To ensure fair usage and system stability, each student is limited to 
                <strong> 1 download per day</strong>. VIP users have unlimited downloads. 
                Make sure to review your brief carefully before generating.
              </p>
            </div>

            <div>
              <h3 className="mb-2" style={{ fontWeight: 600 }}>Technology Stack</h3>
              <p className="mb-2">Backend:</p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                <li>Node.js with TypeScript (state coordinator)</li>
                <li>PostgreSQL + Prisma (persistent memory)</li>
                <li>Claude AI via OpenRouter (micro-task generation)</li>
                <li>WebSocket for real-time progress updates</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mt-16 pt-16 border-t-2 border-black">
          <h2 className="text-2xl mb-6" style={{ fontWeight: 600 }}>
            Best Practices
          </h2>

          <div className="space-y-4">
            <BestPractice
              title="Provide Clear Briefs"
              description="The better your assignment brief, the more accurate the output. Ensure your brief includes all criteria clearly."
            />
            
            <BestPractice
              title="Use as a Starting Point"
              description="Treat generated content as a comprehensive first draft, not a final submission. Add your own research and insights."
            />
            
            <BestPractice
              title="Verify All Information"
              description="Check facts, statistics, examples, and case studies. Replace generic content with specific, relevant information."
            />
            
            <BestPractice
              title="Personalize the Content"
              description="Add your own voice, experiences, and understanding. Include specific examples from your own research."
            />
            
            <BestPractice
              title="Complete References"
              description="The system generates placeholder citations. You must add proper sources and ensure Harvard referencing is correct."
            />
          </div>
        </section>

        {/* Limitations */}
        <section className="mt-16 pt-16 border-t-2 border-black">
          <h2 className="text-2xl mb-6" style={{ fontWeight: 600 }}>
            Limitations
          </h2>

          <ul className="space-y-3 text-gray-800">
            <li className="flex gap-3">
              <span className="font-mono">•</span>
              <span>AI-generated content may contain factual errors or outdated information</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono">•</span>
              <span>Generic examples may not align perfectly with your specific brief</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono">•</span>
              <span>References require manual completion and verification</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono">•</span>
              <span>Content lacks personal insights and original research</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono">•</span>
              <span>May not perfectly match your institution's specific formatting requirements</span>
            </li>
          </ul>
        </section>

        {/* Footer CTA */}
        <div className="mt-16 text-center space-y-4">
          {/* Discord Community */}
          <div className="bg-[#5865F2]/10 border-2 border-[#5865F2] rounded-lg p-6">
            <h3 className="text-xl mb-2" style={{ fontWeight: 600 }}>Need Help?</h3>
            <p className="text-gray-600 mb-4">
              Join our Discord community for support, updates, and to report issues.
            </p>
            <a
              href={DISCORD_INVITE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Join Discord Server
            </a>
          </div>

          <Button
            onClick={() => onNavigate('dashboard')}
            className="bg-black text-white px-8 py-3 hover:bg-gray-800 border-0"
          >
            Back to Dashboard
          </Button>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="border-t-2 border-black mt-20">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center text-sm text-gray-600">
          <p>Made by Ajax Manson | Documentation v2.0</p>
          <p className="mt-1">
            <a 
              href={DISCORD_INVITE_LINK} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#5865F2] hover:underline"
            >
              Discord
            </a>
            {' • '}
            <span>Support available via Discord only</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Instruction Step Component
 */
function InstructionStep({ 
  number, 
  title, 
  description, 
  bullets 
}: { 
  number: number; 
  title: string; 
  description: string;
  bullets?: string[];
}) {
  return (
    <div className="flex gap-6">
      {/* Step Number */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 border-2 border-black flex items-center justify-center text-xl" style={{ fontWeight: 700 }}>
          {number}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-xl mb-2" style={{ fontWeight: 600 }}>
          {title}
        </h3>
        <p className="text-gray-800 mb-3">
          {description}
        </p>
        {bullets && bullets.length > 0 && (
          <ul className="space-y-2 mt-3">
            {bullets.map((bullet, index) => (
              <li key={index} className="flex gap-3 text-sm text-gray-700">
                <span className="font-mono mt-1">→</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Best Practice Component
 */
function BestPractice({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-l-4 border-black pl-4">
      <h3 className="mb-1" style={{ fontWeight: 600 }}>
        {title}
      </h3>
      <p className="text-sm text-gray-700">
        {description}
      </p>
    </div>
  );
}