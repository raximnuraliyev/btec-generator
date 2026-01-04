import React, { useState } from 'react';
import { 
  LayoutDashboard, FileText, Users, AlertCircle, 
  BarChart3, ArrowLeft, CreditCard, Menu
} from 'lucide-react';
import { Button } from './ui/button';
import { AdminOverviewTab } from './admin/AdminOverviewTab';
import { AdminUsersTab } from './admin/AdminUsersTab';
import { AdminAssignmentsTab } from './admin/AdminAssignmentsTab';
import { AdminIssuesTab } from './admin/AdminIssuesTab';
import { AdminAnalyticsTab } from './admin/AdminAnalyticsTab';
import { AdminPaymentsTab } from './admin/AdminPaymentsTab';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';

type AdminTab = 'overview' | 'assignments' | 'users' | 'payments' | 'issues' | 'analytics';

interface AdminPageProps {
  onNavigate: (page: 'dashboard') => void;
}

const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'assignments', label: 'Assignments', icon: FileText },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'issues', label: 'Issues', icon: AlertCircle },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export function AdminPage({ onNavigate }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverviewTab />;
      case 'assignments':
        return <AdminAssignmentsTab />;
      case 'users':
        return <AdminUsersTab />;
      case 'payments':
        return <AdminPaymentsTab />;
      case 'issues':
        return <AdminIssuesTab />;
      case 'analytics':
        return <AdminAnalyticsTab />;
      default:
        return <AdminOverviewTab />;
    }
  };

  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-black sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button 
                variant="ghost" 
                onClick={() => onNavigate('dashboard')}
                className="hover:bg-gray-100 min-h-[44px] px-2 sm:px-4"
              >
                <ArrowLeft className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="h-6 w-px bg-gray-300 hidden sm:block" />
              <h1 className="text-lg sm:text-xl font-bold">Admin Panel</h1>
            </div>
            
            {/* Mobile: Current tab indicator */}
            <div className="flex items-center gap-2 md:hidden">
              {currentTab && (
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <currentTab.icon className="w-4 h-4" />
                  {currentTab.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs - Desktop: horizontal, Mobile: sheet */}
      <nav className="bg-white border-b-2 border-black sticky top-14 sm:top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Tab Selector */}
          <div className="md:hidden py-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full justify-between min-h-[44px]">
                  <span className="flex items-center gap-2">
                    {currentTab && <currentTab.icon className="w-4 h-4" />}
                    {currentTab?.label || 'Select Tab'}
                  </span>
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Admin Sections</SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors min-h-[48px] ${
                          activeTab === tab.id
                            ? 'bg-black text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Desktop Tabs */}
          <div className="hidden md:flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 lg:px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-4 min-h-[48px] ${
                    activeTab === tab.id
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {renderTabContent()}
      </main>
    </div>
  );
}

export default AdminPage;
