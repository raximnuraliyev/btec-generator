import React, { useState } from 'react';
import { 
  LayoutDashboard, FileText, Users, AlertCircle, 
  BarChart3, Scroll, ArrowLeft
} from 'lucide-react';
import { Button } from './ui/button';
import { AdminOverviewTab } from './admin/AdminOverviewTab';
import { AdminUsersTab } from './admin/AdminUsersTab';
import { AdminAssignmentsTab } from './admin/AdminAssignmentsTab';
import { AdminIssuesTab } from './admin/AdminIssuesTab';
import { AdminAnalyticsTab } from './admin/AdminAnalyticsTab';
import { AdminLogsTab } from './admin/AdminLogsTab';

type AdminTab = 'overview' | 'assignments' | 'users' | 'issues' | 'analytics' | 'logs';

interface AdminPageProps {
  onNavigate: (page: 'dashboard') => void;
}

const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'assignments', label: 'Assignments', icon: FileText },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'issues', label: 'Issues', icon: AlertCircle },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'logs', label: 'Logs', icon: Scroll },
];

export function AdminPage({ onNavigate }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverviewTab />;
      case 'assignments':
        return <AdminAssignmentsTab />;
      case 'users':
        return <AdminUsersTab />;
      case 'issues':
        return <AdminIssuesTab />;
      case 'analytics':
        return <AdminAnalyticsTab />;
      case 'logs':
        return <AdminLogsTab />;
      default:
        return <AdminOverviewTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-black sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => onNavigate('dashboard')}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b-2 border-black sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-4 ${
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </main>
    </div>
  );
}

export default AdminPage;
