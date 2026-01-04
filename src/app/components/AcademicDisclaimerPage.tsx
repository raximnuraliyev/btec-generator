import { ArrowLeft, AlertTriangle, GraduationCap, BookOpen, Scale, Shield, XCircle, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AcademicDisclaimerPageProps {
  onBack: () => void;
  onNavigate?: (page: 'terms' | 'privacy') => void;
}

export default function AcademicDisclaimerPage({ onBack, onNavigate }: AcademicDisclaimerPageProps) {
  const { t } = useLanguage();
  const lastUpdated = "January 2025";

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm sm:text-base">Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-amber-100 rounded-xl border-2 border-black">
              <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Academic Disclaimer</h1>
              <p className="text-xs sm:text-sm text-gray-500">Last updated: {lastUpdated}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Critical Warning Banner */}
        <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-red-800 text-base sm:text-lg">Critical Academic Warning</h2>
              <p className="text-red-700 text-sm sm:text-base mt-1">
                <strong>Submitting AI-generated content as your own work is a violation of academic integrity policies</strong> 
                at virtually all educational institutions. This can result in serious consequences including failing grades, 
                academic probation, or expulsion.
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer Sections */}
        <div className="space-y-6 sm:space-y-8">
          {/* Section 1: Educational Purpose */}
          <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg border-2 border-black">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">1. Educational Purpose Statement</h2>
            </div>
            <div className="space-y-3 text-gray-700 text-sm sm:text-base">
              <p>
                BTEC Generator is designed and intended <strong>solely as an educational assistance tool</strong>. 
                The purpose of this service is to:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                  <span>Help students understand BTEC assignment structures and requirements</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                  <span>Provide examples of how to approach different grading criteria</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                  <span>Assist in learning proper academic writing techniques</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                  <span>Serve as a reference and study guide for coursework preparation</span>
                </li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mt-4">
                <p className="text-blue-800 text-sm">
                  <strong>Remember:</strong> The goal is to help you learn and understand, not to do your work for you. 
                  Use generated content as a learning resource to improve your own skills.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Not for Direct Submission */}
          <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg border-2 border-black">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">2. Not Intended for Direct Submission</h2>
            </div>
            <div className="space-y-3 text-gray-700 text-sm sm:text-base">
              <p className="font-semibold text-red-700">
                Content generated by BTEC Generator is NOT intended to be submitted directly as your own work.
              </p>
              <p>By using this service, you acknowledge and agree that:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Generated content is for <strong>reference purposes only</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>You will use generated content to <strong>inform and guide your own original work</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Direct submission of generated content <strong>violates academic integrity</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>You are solely responsible for <strong>any academic consequences</strong> resulting from misuse</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3: User Responsibility */}
          <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg border-2 border-black">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">3. User Responsibility & Academic Integrity</h2>
            </div>
            <div className="space-y-3 text-gray-700 text-sm sm:text-base">
              <p>
                <strong>You are entirely responsible</strong> for how you use the content generated by this service. 
                This includes:
              </p>
              <ul className="space-y-2 ml-4">
                <li>• Understanding and complying with your institution's academic integrity policies</li>
                <li>• Ensuring that any work you submit is genuinely your own</li>
                <li>• Using generated content only as a learning aid and reference material</li>
                <li>• Making independent decisions about how to approach your assignments</li>
              </ul>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4 mt-4">
                <p className="text-purple-800 text-sm">
                  <strong>Academic Integrity Tip:</strong> If you're unsure whether your use of this service complies 
                  with your institution's policies, ask your tutor or academic advisor for guidance.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Consequences of Misuse */}
          <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg border-2 border-black">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">4. Potential Consequences of Misuse</h2>
            </div>
            <div className="space-y-3 text-gray-700 text-sm sm:text-base">
              <p>
                Misusing AI-generated content by submitting it as your own work can lead to severe consequences, including but not limited to:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">⚠</span>
                  <span><strong>Failing grade</strong> for the assignment or course</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">⚠</span>
                  <span><strong>Academic probation</strong> or disciplinary action</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">⚠</span>
                  <span><strong>Suspension or expulsion</strong> from your institution</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">⚠</span>
                  <span><strong>Permanent record</strong> of academic misconduct</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">⚠</span>
                  <span><strong>Impact on future opportunities</strong> (university applications, employment)</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 5: Legal Disclaimer */}
          <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg border-2 border-black">
                <Scale className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">5. Legal Disclaimer</h2>
            </div>
            <div className="space-y-3 text-gray-700 text-sm sm:text-base">
              <p>
                <strong>BTEC Generator and its operators expressly disclaim all liability</strong> for any consequences 
                arising from the use or misuse of this service, including but not limited to:
              </p>
              <ul className="space-y-2 ml-4">
                <li>• Academic penalties, disciplinary actions, or expulsion</li>
                <li>• Damage to academic record or reputation</li>
                <li>• Loss of educational opportunities</li>
                <li>• Any other direct, indirect, incidental, or consequential damages</li>
              </ul>
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 sm:p-4 mt-4">
                <p className="text-gray-700 text-sm">
                  By using this service, you acknowledge that you have read and understood this disclaimer, and 
                  you accept full responsibility for your use of any generated content. You agree to indemnify 
                  and hold harmless BTEC Generator and its operators from any claims arising from your use of this service.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Proper Use Guidelines */}
          <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg border-2 border-black">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">6. How to Use This Service Properly</h2>
            </div>
            <div className="space-y-4 text-gray-700 text-sm sm:text-base">
              <div>
                <h3 className="font-semibold text-green-700 mb-2">✓ Recommended Uses:</h3>
                <ul className="space-y-1 ml-4 text-gray-600">
                  <li>• Study the structure and format of well-written assignments</li>
                  <li>• Learn how different grading criteria should be addressed</li>
                  <li>• Get ideas and inspiration for your own original content</li>
                  <li>• Understand what assessors are looking for in your work</li>
                  <li>• Practice and develop your academic writing skills</li>
                  <li>• Use as a template to guide your own research and writing</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-red-700 mb-2">✗ Prohibited Uses:</h3>
                <ul className="space-y-1 ml-4 text-gray-600">
                  <li>• Submitting generated content directly as your own work</li>
                  <li>• Copying generated content with only minor modifications</li>
                  <li>• Sharing generated content for others to submit</li>
                  <li>• Any use that violates your institution's academic integrity policy</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Acknowledgment Box */}
          <section className="bg-amber-50 border-2 border-amber-500 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <h2 className="text-lg sm:text-xl font-bold text-amber-800">Your Acknowledgment</h2>
            </div>
            <p className="text-amber-700 text-sm sm:text-base">
              By using BTEC Generator, you confirm that you have read, understood, and agree to this Academic Disclaimer. 
              You acknowledge that you are solely responsible for ensuring your use of this service complies with 
              your institution's academic integrity policies, and you accept full responsibility for any consequences 
              of your actions.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black mt-auto bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 text-center">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-4">
            <button onClick={onBack} className="hover:text-black hover:underline">Dashboard</button>
            <span className="hidden sm:inline">•</span>
            <button onClick={() => onNavigate?.('terms')} className="hover:text-black hover:underline">Terms of Use</button>
            <span className="hidden sm:inline">•</span>
            <button onClick={() => onNavigate?.('privacy')} className="hover:text-black hover:underline">Privacy Policy</button>
            <span className="hidden sm:inline">•</span>
            <span className="text-black font-medium">Academic Disclaimer</span>
          </div>
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} BTEC Generator. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
