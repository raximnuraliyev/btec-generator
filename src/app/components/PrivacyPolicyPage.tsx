import { ArrowLeft, Shield, Eye, Database, Lock, UserCheck, Globe, Trash2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface PrivacyPolicyPageProps {
  onBack: () => void;
  onNavigate?: (page: 'terms' | 'disclaimer') => void;
}

export default function PrivacyPolicyPage({ onBack, onNavigate }: PrivacyPolicyPageProps) {
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
            <div className="p-2 sm:p-3 bg-green-100 rounded-xl border-2 border-black">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Privacy Policy</h1>
              <p className="text-xs sm:text-sm text-gray-500">Last updated: {lastUpdated}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Summary Banner */}
        <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-start gap-3">
            <Lock className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-green-800 text-base sm:text-lg">Your Privacy Matters</h2>
              <p className="text-green-700 text-sm sm:text-base mt-1">
                We are committed to protecting your privacy. This policy explains what information we collect, 
                how we use it, and your rights regarding your data.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-6 sm:space-y-8">
          {/* Section 1: Information We Collect */}
          <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg border-2 border-black">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">1. Information We Collect</h2>
            </div>
            <div className="space-y-4 text-gray-700 text-sm sm:text-base">
              <div>
                <h3 className="font-semibold mb-2">Account Information</h3>
                <ul className="space-y-1 ml-4 text-gray-600">
                  <li>• Discord username and user ID (when you link your account)</li>
                  <li>• Email address (if provided during registration)</li>
                  <li>• Account creation date and timestamps</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Usage Information</h3>
                <ul className="space-y-1 ml-4 text-gray-600">
                  <li>• Assignment briefs you create and their settings</li>
                  <li>• Generated content associated with your account</li>
                  <li>• Token purchase and usage history</li>
                  <li>• Timestamps of your activity on the platform</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Technical Information</h3>
                <ul className="space-y-1 ml-4 text-gray-600">
                  <li>• IP address (for security and verification purposes)</li>
                  <li>• Browser type and version</li>
                  <li>• Device information</li>
                  <li>• Cookies and similar tracking technologies</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mt-4">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> We do NOT collect or store your banking/payment card information. 
                  All payments are peer-to-peer transfers handled through your own banking service.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: How We Use Your Information */}
          <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg border-2 border-black">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">2. How We Use Your Information</h2>
            </div>
            <div className="space-y-3 text-gray-700 text-sm sm:text-base">
              <p>We use the information we collect to:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Provide, maintain, and improve our services</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Process your token purchases and verify payments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Store and manage your assignments and generated content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Communicate with you about your account and service updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Prevent fraud, abuse, and unauthorized access</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Comply with legal obligations</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3: Data Storage & Security */}
          <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg border-2 border-black">
                <Lock className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">3. Data Storage & Security</h2>
            </div>
            <div className="space-y-3 text-gray-700 text-sm sm:text-base">
              <p>We take the security of your data seriously:</p>
              <ul className="space-y-2 ml-4">
                <li>• All data is stored on secure servers with encryption</li>
                <li>• We use industry-standard security measures to protect your information</li>
                <li>• Access to your data is restricted to authorized personnel only</li>
                <li>• Passwords are hashed and never stored in plain text</li>
                <li>• We regularly review and update our security practices</li>
              </ul>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 mt-4">
                <p className="text-amber-800 text-sm">
                  <strong>Important:</strong> While we implement strong security measures, no method of transmission 
                  over the Internet is 100% secure. We cannot guarantee absolute security of your data.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Data Sharing */}
          <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg border-2 border-black">
                <Globe className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">4. Data Sharing</h2>
            </div>
            <div className="space-y-3 text-gray-700 text-sm sm:text-base">
              <p>
                <strong>We do not sell your personal information.</strong> We may share your information only in 
                the following circumstances:
              </p>
              <ul className="space-y-2 ml-4">
                <li>• <strong>Service Providers:</strong> Third-party services that help us operate our platform 
                  (e.g., hosting providers, AI services for content generation)</li>
                <li>• <strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li>• <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li>• <strong>With Your Consent:</strong> When you have given explicit permission</li>
              </ul>
            </div>
          </section>

          {/* Section 5: Your Rights */}
          <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg border-2 border-black">
                <UserCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">5. Your Rights</h2>
            </div>
            <div className="space-y-3 text-gray-700 text-sm sm:text-base">
              <p>You have the right to:</p>
              <ul className="space-y-2 ml-4">
                <li>• <strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                <li>• <strong>Correction:</strong> Request that we correct any inaccurate information</li>
                <li>• <strong>Deletion:</strong> Request deletion of your account and associated data</li>
                <li>• <strong>Export:</strong> Request a copy of your data in a portable format</li>
                <li>• <strong>Objection:</strong> Object to certain types of processing</li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, please contact us through our Discord server or the 
                Issue Reporting feature.
              </p>
            </div>
          </section>

          {/* Section 6: Data Retention */}
          <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg border-2 border-black">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">6. Data Retention</h2>
            </div>
            <div className="space-y-3 text-gray-700 text-sm sm:text-base">
              <p>We retain your information for as long as:</p>
              <ul className="space-y-2 ml-4">
                <li>• Your account remains active</li>
                <li>• It is necessary to provide our services to you</li>
                <li>• Required by law or for legitimate business purposes</li>
              </ul>
              <p className="mt-3">
                When you delete your account, we will delete or anonymize your personal information within 
                30 days, except where we are required to retain it for legal, regulatory, or security purposes.
              </p>
            </div>
          </section>

          {/* Section 7: Cookies */}
          <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg border-2 border-black">
                <Database className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">7. Cookies & Local Storage</h2>
            </div>
            <div className="space-y-3 text-gray-700 text-sm sm:text-base">
              <p>We use cookies and local storage to:</p>
              <ul className="space-y-2 ml-4">
                <li>• Keep you logged in to your account</li>
                <li>• Remember your preferences and settings</li>
                <li>• Analyze how you use our service to improve it</li>
              </ul>
              <p className="mt-3">
                Most web browsers automatically accept cookies, but you can modify your browser settings to 
                decline cookies if you prefer. Note that disabling cookies may affect the functionality of our service.
              </p>
            </div>
          </section>

          {/* Section 8: Children's Privacy */}
          <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-pink-100 rounded-lg border-2 border-black">
                <AlertCircle className="w-5 h-5 text-pink-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">8. Children's Privacy</h2>
            </div>
            <div className="space-y-3 text-gray-700 text-sm sm:text-base">
              <p>
                Our service is intended for users aged 16 and above. We do not knowingly collect personal 
                information from children under 16. If you believe we have inadvertently collected information 
                from a child under 16, please contact us immediately.
              </p>
            </div>
          </section>

          {/* Section 9: Changes to This Policy */}
          <section className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg border-2 border-black">
                <Shield className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">9. Changes to This Policy</h2>
            </div>
            <div className="space-y-3 text-gray-700 text-sm sm:text-base">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
              <p>
                We encourage you to review this Privacy Policy periodically for any changes. Your continued 
                use of the service after any changes constitutes your acceptance of the new Privacy Policy.
              </p>
            </div>
          </section>

          {/* Contact Section */}
          <section className="bg-gray-100 border-2 border-black rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-3">Contact Us</h2>
            <p className="text-gray-700 text-sm sm:text-base">
              If you have any questions about this Privacy Policy or your personal data, please contact us 
              through our Discord server or the Issue Reporting feature in your dashboard.
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
            <span className="text-black font-medium">Privacy Policy</span>
            <span className="hidden sm:inline">•</span>
            <button onClick={() => onNavigate?.('disclaimer')} className="hover:text-black hover:underline">Academic Disclaimer</button>
          </div>
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} BTEC Generator. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
