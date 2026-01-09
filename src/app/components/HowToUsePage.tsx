import React, { useState } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, TriangleAlert, MessageCircle, CreditCard, Coins, BookOpen, HelpCircle, ChevronDown, ChevronUp, Shield, FileText, GraduationCap, Sparkles, CheckCircle, Clock, Download, AlertTriangle } from 'lucide-react';

interface HowToUsePageProps {
  onNavigate: (page: 'dashboard' | 'terms' | 'privacy' | 'disclaimer') => void;
}

// Discord invite link
const DISCORD_INVITE_LINK = 'https://discord.gg/wjPGhY6X';

/**
 * How to Use Page
 * Comprehensive guide with payment info, FAQs, and step-by-step instructions
 */
export function HowToUsePage({ onNavigate }: HowToUsePageProps) {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'getting-started' | 'tokens' | 'assignments' | 'faq'>('getting-started');

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col">
      
      {/* Header */}
      <header className="bg-white border-b-2 border-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Button
                onClick={() => onNavigate('dashboard')}
                variant="ghost"
                className="mb-2 hover:bg-gray-100 flex items-center gap-2 -ml-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm sm:text-base">Back to Dashboard</span>
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold">
                How to Use BTEC Generator
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
                Complete guide to getting started and generating assignments
              </p>
            </div>
            
            {/* Discord Link */}
            <a
              href={DISCORD_INVITE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors text-sm sm:text-base"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Join Discord</span>
            </a>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b-2 border-black sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto scrollbar-hide">
            {[
              { id: 'getting-started', label: 'Getting Started', icon: BookOpen },
              { id: 'tokens', label: 'Tokens & Payment', icon: Coins },
              { id: 'assignments', label: 'Assignments', icon: FileText },
              { id: 'faq', label: 'FAQ', icon: HelpCircle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-black text-black' 
                    : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Important Notice Banner */}
        <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-amber-800 text-sm sm:text-base">Educational Tool Disclaimer</h2>
              <p className="text-amber-700 text-xs sm:text-sm mt-1">
                BTEC Generator is designed as a <strong>learning and reference tool</strong>. Generated content is for educational purposes only and should not be submitted directly as your own work. 
                <button 
                  onClick={() => onNavigate('disclaimer')} 
                  className="underline hover:no-underline ml-1"
                >
                  Read full Academic Disclaimer
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Getting Started Tab */}
        {activeTab === 'getting-started' && (
          <div className="space-y-6 sm:space-y-8">
            <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                Welcome to BTEC Generator
              </h2>
              <p className="text-gray-700 text-sm sm:text-base mb-4">
                BTEC Generator helps you understand how to structure BTEC assignments by providing reference examples and learning materials. 
                Follow these steps to get started:
              </p>
              
              <div className="space-y-6">
                <QuickStartStep 
                  number={1}
                  title="Create Your Account"
                  description="Sign up with your email address. You'll need to accept our Terms of Use, Privacy Policy, and Academic Disclaimer."
                />
                <QuickStartStep 
                  number={2}
                  title="Join Our Discord"
                  description="Connect to our Discord server to purchase tokens, get support, and access exclusive updates."
                  action={
                    <a href={DISCORD_INVITE_LINK} target="_blank" rel="noopener noreferrer" 
                       className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#5865F2] text-white text-sm rounded hover:bg-[#4752C4]">
                      <MessageCircle className="w-4 h-4" /> Join Discord
                    </a>
                  }
                />
                <QuickStartStep 
                  number={3}
                  title="Purchase Tokens"
                  description="Use the !buy command in Discord to see available token plans and make a purchase via bank transfer."
                />
                <QuickStartStep 
                  number={4}
                  title="Link Your Discord"
                  description="Use the !link command in Discord with the code from your profile page to connect your accounts."
                />
                <QuickStartStep 
                  number={5}
                  title="Create Your First Assignment"
                  description="Click 'Create New Assignment' on your dashboard and follow the wizard to set up your brief."
                />
              </div>
            </section>

            {/* What's Included */}
            <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-lg sm:text-xl font-bold mb-4">What BTEC Generator Provides</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FeatureCard 
                  icon={FileText}
                  title="Structured Examples"
                  description="Learn how professional BTEC assignments are structured across P, M, and D criteria."
                />
                <FeatureCard 
                  icon={BookOpen}
                  title="Learning Reference"
                  description="Use generated content to understand what assessors look for in different grade levels."
                />
                <FeatureCard 
                  icon={GraduationCap}
                  title="Multiple Levels"
                  description="Support for BTEC Levels 3, 4, 5, and 6 with appropriate academic language."
                />
                <FeatureCard 
                  icon={Download}
                  title="DOCX Export"
                  description="Download generated content in Word format for easy editing and reference."
                />
              </div>
            </section>
          </div>
        )}

        {/* Tokens & Payment Tab */}
        {activeTab === 'tokens' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Token System Explanation */}
            <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                Understanding Plans & Limits
              </h2>
              <p className="text-gray-700 text-sm sm:text-base mb-4">
                Each plan gives you tokens, a time limit, and a specific number of assignments you can generate.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm mb-2">Plan Restrictions:</h3>
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <span className="text-gray-700">Plan P (Pass)</span>
                  <span className="text-green-700 text-sm">Can only generate PASS grades</span>
                </div>
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <span className="text-gray-700">Plan PM (Pass + Merit)</span>
                  <span className="text-blue-700 text-sm">Can generate PASS or MERIT grades</span>
                </div>
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <span className="text-gray-700">Plan PMD (All Grades)</span>
                  <span className="text-purple-700 text-sm">Can generate any grade level</span>
                </div>
              </div>
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-amber-800 text-xs sm:text-sm">
                  <strong>Note:</strong> Each plan has a limited number of assignments and expires after the plan duration. Use <code className="bg-amber-100 px-1 rounded">!status</code> to check your remaining assignments and time.
                </p>
              </div>
            </section>

            {/* How to Purchase */}
            <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-500" />
                How to Purchase Tokens
              </h2>
              <div className="space-y-4">
                <PaymentStep 
                  step={1}
                  title="Join Discord & Run !buy"
                  description="Join our Discord server and use the !buy command to see available token plans with pricing."
                />
                <PaymentStep 
                  step={2}
                  title="Select a Plan"
                  description="Choose your plan with !buy P, !buy PM, !buy PMD, or !buy custom <grade> <tokens>. You'll receive payment details."
                />
                <PaymentStep 
                  step={3}
                  title="Make a Bank Transfer"
                  description="Transfer the exact amount to the payment card shown. Include your Discord username as reference in the payment."
                />
                <PaymentStep 
                  step={4}
                  title="Wait for Admin Confirmation"
                  description="An admin will verify your payment and activate your plan. This usually happens within a few hours."
                />
                <PaymentStep 
                  step={5}
                  title="Start Generating"
                  description="Once confirmed, your tokens and assignments are ready! Use !status to check your plan details."
                />
              </div>
              
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 text-sm mb-2">💳 Payment Information</h3>
                <p className="text-blue-700 text-xs sm:text-sm">
                  Payments are made via direct bank transfer to the card shown in Discord. We do not store your banking information. 
                  All transactions are peer-to-peer transfers that you initiate through your own banking service.
                </p>
              </div>
            </section>

            {/* Available Plans */}
            <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-lg sm:text-xl font-bold mb-4">Available Plans</h2>
              <p className="text-gray-600 text-sm mb-4">Use <code className="bg-gray-100 px-2 py-0.5 rounded">!buy</code> in Discord to purchase.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <PlanCard 
                  name="PLAN P"
                  price="30,000 UZS"
                  duration="3 days"
                  assignments={5}
                  grades="PASS only"
                  tokens="100,000"
                  color="green"
                />
                <PlanCard 
                  name="PLAN PM"
                  price="50,000 UZS"
                  duration="5 days"
                  assignments={7}
                  grades="PASS & MERIT"
                  tokens="150,000"
                  color="blue"
                  highlighted
                />
                <PlanCard 
                  name="PLAN PMD"
                  price="100,000 UZS"
                  duration="7 days"
                  assignments={10}
                  grades="All grades"
                  tokens="200,000"
                  color="purple"
                />
                <PlanCard 
                  name="CUSTOM"
                  price="1 UZS/token"
                  duration="One-time"
                  assignments={1}
                  grades="Choose grade"
                  tokens="Min 20k-25k"
                  color="gray"
                  isCustom
                />
              </div>
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-xs sm:text-sm">
                  <strong>Custom Plan:</strong> Pay per token (1 UZS = 1 token). Minimum tokens: 20,000 for PASS/MERIT, 25,000 for DISTINCTION. One assignment only, no expiry.
                </p>
              </div>
            </section>

            {/* Discord Bot Commands */}
            <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#5865F2]" />
                Discord Bot Commands
              </h2>
              <div className="space-y-3">
                <CommandItem 
                  command="!buy"
                  description="View available plans with pricing and details"
                />
                <CommandItem 
                  command="!buy [plan]"
                  description="Start purchase for a specific plan (e.g., !buy PM)"
                />
                <CommandItem 
                  command="!buy custom [grade] [tokens]"
                  description="Buy custom tokens (e.g., !buy custom MERIT 25000)"
                />
                <CommandItem 
                  command="!status"
                  description="Check your current plan, tokens, and assignments remaining"
                />
                <CommandItem 
                  command="!link [code]"
                  description="Link your Discord to website account using your profile code"
                />
                <CommandItem 
                  command="!payments"
                  description="View your payment history"
                />
                <CommandItem 
                  command="!help"
                  description="Show all available commands"
                />
              </div>
            </section>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Step by Step */}
            <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-lg sm:text-xl font-bold mb-6">Creating an Assignment</h2>
              <div className="space-y-6">
                <AssignmentStep 
                  number={1}
                  title="Select BTEC Level"
                  description="Choose your qualification level (3, 4, 5, or 6). Each level has different academic expectations and writing styles."
                />
                <AssignmentStep 
                  number={2}
                  title="Choose Unit"
                  description="Select the specific BTEC unit you're working on. Units are filtered by your selected level."
                />
                <AssignmentStep 
                  number={3}
                  title="Select Target Grade"
                  description="Choose Pass, Merit, or Distinction. This affects word count and depth of analysis."
                />
                <AssignmentStep 
                  number={4}
                  title="Upload Assignment Brief"
                  description="Upload your brief as .docx or .pdf. The system extracts criteria and requirements automatically."
                />
                <AssignmentStep 
                  number={5}
                  title="Add Student Context (Optional)"
                  description="Provide details about yourself, your course, and any specific examples you want included."
                />
                <AssignmentStep 
                  number={6}
                  title="Review & Generate"
                  description="Confirm your selections. Generation takes 10-20 minutes depending on grade level."
                />
                <AssignmentStep 
                  number={7}
                  title="Download & Learn"
                  description="Export as DOCX and study the structure, format, and approach used."
                />
              </div>
            </section>

            {/* Word Count Guide */}
            <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-lg sm:text-xl font-bold mb-4">Expected Word Counts</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-800">Pass (P)</span>
                  <span className="text-green-700 text-sm">2,000 - 3,000 words</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium text-blue-800">Merit (M)</span>
                  <span className="text-blue-700 text-sm">4,000 - 6,000 words</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="font-medium text-purple-800">Distinction (D)</span>
                  <span className="text-purple-700 text-sm">7,000 - 9,500 words</span>
                </div>
              </div>
            </section>

            {/* Best Practices */}
            <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-lg sm:text-xl font-bold mb-4">Best Practices for Learning</h2>
              <div className="space-y-3">
                <BestPracticeItem 
                  title="Study the Structure"
                  description="Pay attention to how content is organized for each criterion (P, M, D)."
                />
                <BestPracticeItem 
                  title="Note the Language"
                  description="Observe academic vocabulary and how arguments are constructed at your level."
                />
                <BestPracticeItem 
                  title="Understand Criteria"
                  description="See how different grading criteria are addressed in practice."
                />
                <BestPracticeItem 
                  title="Create Your Own Work"
                  description="Use insights gained to write your own original assignment with proper research."
                />
              </div>
            </section>
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="space-y-6 sm:space-y-8">
            <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                <FAQItem 
                  question="How do I get tokens?"
                  answer="Join our Discord server and use the !buy command to see available plans. Select a plan with !buy P, !buy PM, or !buy PMD, then make a bank transfer. An admin will verify and activate your plan."
                  isOpen={openFAQ === 0}
                  onToggle={() => toggleFAQ(0)}
                />
                <FAQItem 
                  question="How long does generation take?"
                  answer="Generation typically takes 10-20 minutes depending on the grade level. Pass grades are fastest, while Distinction grades take longer due to higher word counts."
                  isOpen={openFAQ === 1}
                  onToggle={() => toggleFAQ(1)}
                />
                <FAQItem 
                  question="Can I pause and resume generation?"
                  answer="Yes! Generation can be paused at any time and resumed later. Your progress is saved automatically."
                  isOpen={openFAQ === 2}
                  onToggle={() => toggleFAQ(2)}
                />
                <FAQItem 
                  question="What file formats are supported?"
                  answer="You can upload briefs in .docx or .pdf format. Generated assignments can be exported as .docx files."
                  isOpen={openFAQ === 3}
                  onToggle={() => toggleFAQ(3)}
                />
                <FAQItem 
                  question="How do I link my Discord account?"
                  answer="Go to your Profile page to get your unique linking code. Then use the !link command in Discord followed by your code."
                  isOpen={openFAQ === 4}
                  onToggle={() => toggleFAQ(4)}
                />
                <FAQItem 
                  question="Are refunds available?"
                  answer="Tokens are non-refundable once purchased and verified. Please ensure you understand the service before purchasing."
                  isOpen={openFAQ === 5}
                  onToggle={() => toggleFAQ(5)}
                />
                <FAQItem 
                  question="Can I use generated content directly?"
                  answer="No. Generated content is for educational reference only. Direct submission as your own work violates academic integrity policies. Use it to learn structure and approach, then create your own original work."
                  isOpen={openFAQ === 6}
                  onToggle={() => toggleFAQ(6)}
                />
                <FAQItem 
                  question="What BTEC levels are supported?"
                  answer="We support BTEC Levels 3, 4, 5, and 6. Each level generates content appropriate for its academic expectations."
                  isOpen={openFAQ === 7}
                  onToggle={() => toggleFAQ(7)}
                />
                <FAQItem 
                  question="Why can't I generate a certain grade?"
                  answer="Your plan determines which grades you can generate. Plan P allows only PASS, Plan PM allows PASS and MERIT, and Plan PMD allows all grades. You also have a limited number of assignments per plan. Use !status in Discord to check your remaining assignments and allowed grades."
                  isOpen={openFAQ === 8}
                  onToggle={() => toggleFAQ(8)}
                />
                <FAQItem 
                  question="How do I report an issue?"
                  answer="Use the 'Report Issue' button in your dashboard or contact us through Discord. We typically respond within 24 hours."
                  isOpen={openFAQ === 9}
                  onToggle={() => toggleFAQ(9)}
                />
              </div>
            </section>

            {/* Need More Help */}
            <section className="bg-[#5865F2]/10 border-2 border-[#5865F2] rounded-xl p-4 sm:p-6">
              <h3 className="text-lg font-bold mb-2">Still Have Questions?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Join our Discord community for real-time support and to connect with other users.
              </p>
              <a
                href={DISCORD_INVITE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Join Discord Server
              </a>
            </section>
          </div>
        )}
      </main>

      {/* Footer with Legal Links */}
      <footer className="border-t-2 border-black mt-auto bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
              <button onClick={() => onNavigate('terms')} className="hover:text-black hover:underline">Terms of Use</button>
              <span className="hidden sm:inline">•</span>
              <button onClick={() => onNavigate('privacy')} className="hover:text-black hover:underline">Privacy Policy</button>
              <span className="hidden sm:inline">•</span>
              <button onClick={() => onNavigate('disclaimer')} className="hover:text-black hover:underline">Academic Disclaimer</button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              © {new Date().getFullYear()} BTEC Generator | Made by Ajax Manson
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper Components

function QuickStartStep({ number, title, description, action }: { number: number; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 flex-shrink-0 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-sm sm:text-base">{title}</h3>
        <p className="text-gray-600 text-xs sm:text-sm mt-1">{description}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <Icon className="w-5 h-5 text-gray-700 mb-2" />
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-gray-600 text-xs mt-1">{description}</p>
    </div>
  );
}

function PaymentStep({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-6 h-6 flex-shrink-0 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-xs">
        {step}
      </div>
      <div>
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-gray-600 text-xs sm:text-sm mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function TokenPlanCard({ name, tokens, description, highlighted }: { name: string; tokens: number; description: string; highlighted?: boolean }) {
  return (
    <div className={`p-4 rounded-lg border-2 ${highlighted ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
      <h3 className="font-bold text-base">{name}</h3>
      <p className="text-2xl font-bold mt-1">{tokens}</p>
      <p className="text-xs text-gray-500">tokens</p>
      <p className="text-xs text-gray-600 mt-2">{description}</p>
    </div>
  );
}

function PlanCard({ name, price, duration, assignments, grades, tokens, color, highlighted, isCustom }: { 
  name: string; 
  price: string; 
  duration: string; 
  assignments: number; 
  grades: string; 
  tokens: string; 
  color: 'green' | 'blue' | 'purple' | 'gray';
  highlighted?: boolean;
  isCustom?: boolean;
}) {
  const colorClasses = {
    green: 'bg-green-50 border-green-300',
    blue: 'bg-blue-50 border-blue-300',
    purple: 'bg-purple-50 border-purple-300',
    gray: 'bg-gray-50 border-gray-300'
  };
  
  return (
    <div className={`p-4 rounded-lg border-2 ${highlighted ? 'border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : colorClasses[color]}`}>
      <h3 className="font-bold text-base">{name}</h3>
      <p className="text-xl font-bold mt-1">{price}</p>
      <div className="mt-3 space-y-1 text-xs text-gray-600">
        <p>⏱️ {duration}</p>
        <p>📝 {assignments} assignment{assignments !== 1 ? 's' : ''}</p>
        <p>🎯 {grades}</p>
        <p>💎 {tokens} tokens{isCustom ? '*' : ''}</p>
      </div>
    </div>
  );
}

function CommandItem({ command, description }: { command: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-purple-700 flex-shrink-0">{command}</code>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

function AssignmentStep({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 flex-shrink-0 border-2 border-black flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-sm sm:text-base">{title}</h3>
        <p className="text-gray-600 text-xs sm:text-sm mt-1">{description}</p>
      </div>
    </div>
  );
}

function BestPracticeItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-medium text-sm">{title}</h4>
        <p className="text-gray-600 text-xs mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function FAQItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-sm pr-4">{question}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-3 text-gray-600 text-sm border-t border-gray-100">
          <p className="pt-3">{answer}</p>
        </div>
      )}
    </div>
  );
}