import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from './ui/button';
import { 
  ArrowLeft, BookOpen, FileText, Users, BarChart3, 
  Plus, Eye, Edit, Trash2, CheckCircle, Clock
} from 'lucide-react';

interface TeacherStats {
  totalBriefs: number;
  publishedBriefs: number;
  draftBriefs: number;
  assignmentsUsingBriefs: number;
  studentsUsingBriefs: number;
}

interface Brief {
  id: string;
  title: string;
  unitNumber: string;
  unitName: string;
  level: number;
  status: 'DRAFT' | 'PUBLISHED';
  createdAt: string;
  updatedAt: string;
  _count?: {
    assignments: number;
  };
}

interface TeacherDashboardProps {
  onBack: () => void;
  onCreateBrief: () => void;
  onEditBrief: (briefId: string) => void;
  onViewBrief: (briefId: string) => void;
}

export function TeacherDashboard({ 
  onBack, 
  onCreateBrief, 
  onEditBrief, 
  onViewBrief 
}: TeacherDashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, briefsData] = await Promise.all([
        api.get('/api/briefs/teacher/stats') as Promise<TeacherStats>,
        api.get('/api/briefs/my') as Promise<{ briefs: Brief[] }>
      ]);
      setStats(statsData);
      setBriefs(briefsData.briefs || []);
    } catch (error) {
      console.error('Failed to load teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (briefId: string) => {
    if (!confirm('Are you sure you want to delete this brief? This action cannot be undone.')) return;
    
    setDeletingId(briefId);
    try {
      await api.delete(`/api/briefs/${briefId}`);
      setBriefs(prev => prev.filter(b => b.id !== briefId));
    } catch (error) {
      alert('Failed to delete brief: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (briefId: string) => {
    try {
      await api.put(`/api/briefs/${briefId}/publish`, {});
      await loadData();
    } catch (error) {
      alert('Failed to publish brief: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleUnpublish = async (briefId: string) => {
    if (!confirm('Unpublishing will make this brief unavailable to students. Continue?')) return;
    try {
      await api.put(`/api/briefs/${briefId}/unpublish`, {});
      await loadData();
    } catch (error) {
      alert('Failed to unpublish brief: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const filteredBriefs = briefs.filter(brief => {
    if (activeTab === 'published') return brief.status === 'PUBLISHED';
    if (activeTab === 'draft') return brief.status === 'DRAFT';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold">Teacher Dashboard</h1>
                <p className="text-sm text-gray-500">Manage your briefs and track usage</p>
              </div>
            </div>
            <Button onClick={onCreateBrief} className="bg-black text-white hover:bg-gray-800">
              <Plus className="w-4 h-4 mr-2" />
              Create Brief
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard 
            icon={BookOpen}
            label="Total Briefs"
            value={stats?.totalBriefs || 0}
          />
          <StatCard 
            icon={CheckCircle}
            label="Published"
            value={stats?.publishedBriefs || 0}
            color="green"
          />
          <StatCard 
            icon={Clock}
            label="Drafts"
            value={stats?.draftBriefs || 0}
            color="gray"
          />
          <StatCard 
            icon={FileText}
            label="Assignments"
            value={stats?.assignmentsUsingBriefs || 0}
            color="blue"
          />
          <StatCard 
            icon={Users}
            label="Students"
            value={stats?.studentsUsingBriefs || 0}
            color="purple"
          />
        </div>

        {/* Briefs Section */}
        <div className="bg-white border-2 border-black">
          {/* Tabs */}
          <div className="flex border-b-2 border-black">
            {[
              { id: 'all', label: 'All Briefs', count: briefs.length },
              { id: 'published', label: 'Published', count: briefs.filter(b => b.status === 'PUBLISHED').length },
              { id: 'draft', label: 'Drafts', count: briefs.filter(b => b.status === 'DRAFT').length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-black text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Briefs List */}
          {filteredBriefs.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-bold text-lg mb-2">No Briefs Yet</h3>
              <p className="text-gray-500 mb-4">
                {activeTab === 'draft' 
                  ? "You don't have any draft briefs." 
                  : activeTab === 'published'
                  ? "You haven't published any briefs yet."
                  : "Create your first brief to get started."}
              </p>
              <Button onClick={onCreateBrief} className="bg-black text-white hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                Create Brief
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredBriefs.map(brief => (
                <div key={brief.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold truncate">{brief.title}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          brief.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {brief.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Unit {brief.unitNumber}: {brief.unitName}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>Level {brief.level}</span>
                        <span>•</span>
                        <span>{brief._count?.assignments || 0} assignments</span>
                        <span>•</span>
                        <span>Updated {new Date(brief.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewBrief(brief.id)}
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditBrief(brief.id)}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      {brief.status === 'DRAFT' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePublish(brief.id)}
                          className="border-green-500 text-green-600 hover:bg-green-50"
                        >
                          Publish
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnpublish(brief.id)}
                          className="border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          Unpublish
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(brief.id)}
                        disabled={deletingId === brief.id}
                        className="text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 p-6 rounded">
          <h3 className="font-bold text-blue-800 mb-3">Tips for Creating Effective Briefs</h3>
          <ul className="space-y-2 text-blue-700 text-sm">
            <li>• Include clear learning outcomes and assessment criteria</li>
            <li>• Provide scenario context that students can relate to</li>
            <li>• Specify word count requirements and formatting guidelines</li>
            <li>• Add guidance notes to help students understand expectations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color = 'black' 
}: { 
  icon: React.ElementType;
  label: string;
  value: number;
  color?: 'black' | 'green' | 'blue' | 'purple' | 'gray';
}) {
  const colorClasses: Record<string, string> = {
    black: 'border-black',
    green: 'border-green-500',
    blue: 'border-blue-500',
    purple: 'border-purple-500',
    gray: 'border-gray-300'
  };

  const iconColorClasses: Record<string, string> = {
    black: 'text-black',
    green: 'text-green-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    gray: 'text-gray-400'
  };

  return (
    <div className={`bg-white border-2 ${colorClasses[color]} p-4`}>
      <Icon className={`w-5 h-5 ${iconColorClasses[color]} mb-2`} />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

export default TeacherDashboard;
