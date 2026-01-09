import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AssignmentProvider } from './context/AssignmentContext';
import { LanguageProvider } from './context/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './components/LoginPage';
import { DashboardPage } from './components/DashboardPage';
import { HowToUsePage } from './components/HowToUsePage';
import { AssignmentSetup } from './components/AssignmentSetup';
import AssignmentWizard from './components/AssignmentWizard';
import StudentProfilePage from './components/StudentProfilePage';
import { MonitorPage } from './components/MonitorPageNew';
import { ReviewPage } from './components/ReviewPage';
import { AdminPage } from './components/AdminPage';
import { IssuePage } from './components/IssuePage';
import { SupportPage } from './components/SupportPage';
import { TokenBalanceWidget } from './components/TokenBalanceWidget';
import { TokenManagementPage } from './components/TokenManagementPage';
import { BriefManagementPage } from './components/BriefManagementPage';
import { BriefCreationPage } from './components/BriefCreationPage';
import { AssignmentPreviewPage } from './components/AssignmentPreviewPage';
import { TeacherDashboardPage } from './components/TeacherDashboardPage';
import { StudentInputPage } from './components/StudentInputPage';
import TermsOfUsePage from './components/TermsOfUsePage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import AcademicDisclaimerPage from './components/AcademicDisclaimerPage';
import { Toaster } from 'sonner';

/**
 * AI Academic Generation Platform
 * BTEC Assignment Generator (Levels 3-6)
 * 
 * Production-ready state-managed AI generation system
 * Black and white design system
 * 
 * Made by Ajax Manson
 */

type Page = 'login' | 'dashboard' | 'how-to-use' | 'create' | 'profile' | 'monitor' | 'review' | 'admin' | 'issues' | 'support' | 'tokens' | 'briefs' | 'create-brief' | 'preview' | 'teacher' | 'student-inputs' | 'terms' | 'privacy' | 'disclaimer';

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <AssignmentProvider>
            <Toaster position="top-right" richColors />
            <Router />
          </AssignmentProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

/**
 * Client-side Router
 * Manages navigation between pages
 */
function Router() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [currentAssignmentId, setCurrentAssignmentId] = useState<string | null>(null);

  // CRITICAL: All hooks must be called before any conditional returns (Rules of Hooks)
  React.useEffect(() => {
    // Only update page after auth state is loaded
    if (!isLoading) {
      if (!isAuthenticated && currentPage !== 'login') {
        setCurrentPage('login');
      } else if (isAuthenticated && currentPage === 'login') {
        setCurrentPage('dashboard');
      }
    }
  }, [isAuthenticated, isLoading, currentPage]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const navigate = (page: Page, assignmentId?: string) => {
    setCurrentPage(page);
    if (assignmentId) {
      setCurrentAssignmentId(assignmentId);
    }
  };

  // Render current page
  switch (currentPage) {
    case 'login':
      return <LoginPage />;

    case 'dashboard':
      return <DashboardPage onNavigate={navigate} />;

    case 'how-to-use':
      return <HowToUsePage onNavigate={navigate} />;

    case 'create':
      return <AssignmentWizard onNavigate={navigate} />;

    case 'profile':
      return <StudentProfilePage onNavigate={navigate} />;

    case 'monitor':
      if (!currentAssignmentId) {
        navigate('dashboard');
        return null;
      }
      return (
        <MonitorPage 
          assignmentId={currentAssignmentId} 
          onBack={() => navigate('dashboard')}
          onComplete={() => navigate('review', currentAssignmentId)}
        />
      );

    case 'review':
      if (!currentAssignmentId) {
        navigate('dashboard');
        return null;
      }
      return <ReviewPage assignmentId={currentAssignmentId} onNavigate={navigate} />;

    case 'admin':
      return <AdminPage onNavigate={navigate} />;

    case 'issues':
      return <IssuePage onNavigate={navigate} />;

    case 'support':
      return <SupportPage onBack={() => navigate('dashboard')} onNavigate={navigate} />;

    case 'tokens':
      return <TokenManagementPage onNavigate={navigate} />;

    case 'briefs':
      return <BriefManagementPage onNavigate={navigate} />;

    case 'create-brief':
      return <BriefCreationPage onNavigate={navigate} />;

    case 'preview':
      if (!currentAssignmentId) {
        navigate('dashboard');
        return null;
      }
      return <AssignmentPreviewPage assignmentId={currentAssignmentId} onNavigate={navigate} />;

    case 'teacher':
      return <TeacherDashboardPage onNavigate={navigate} />;

    case 'student-inputs':
      if (!currentAssignmentId) {
        navigate('dashboard');
        return null;
      }
      return <StudentInputPage assignmentId={currentAssignmentId} onNavigate={navigate} />;

    case 'terms':
      return <TermsOfUsePage onBack={() => navigate('dashboard')} onNavigate={(page) => navigate(page)} />;

    case 'privacy':
      return <PrivacyPolicyPage onBack={() => navigate('dashboard')} onNavigate={(page) => navigate(page)} />;

    case 'disclaimer':
      return <AcademicDisclaimerPage onBack={() => navigate('dashboard')} onNavigate={(page) => navigate(page)} />;

    default:
      return <DashboardPage onNavigate={navigate} />;
  }
}
