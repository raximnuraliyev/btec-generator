import { useEffect, useState } from 'react';
import { briefsApi } from '../services/api';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { FileText, Users, TrendingUp, Calendar, Plus, Eye, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TeacherDashboardPageProps {
  onNavigate: (page: 'dashboard' | 'briefs') => void;
}

interface DashboardStats {
  totalBriefs: number;
  totalAssignments: number;
  recentBriefs: any[];
  popularBriefs: any[];
}

export function TeacherDashboardPage({ onNavigate }: TeacherDashboardPageProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBriefs: 0,
    totalAssignments: 0,
    recentBriefs: [],
    popularBriefs: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // Use the optimized API endpoint
      const result = await briefsApi.getMyBriefsWithStats();

      // Sort briefs by date for recent (with null check)
      const briefs = result?.briefs || [];
      const recentBriefs = [...briefs]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setStats({
        totalBriefs: result?.stats?.totalBriefs || 0,
        totalAssignments: result?.stats?.totalAssignments || 0,
        recentBriefs,
        popularBriefs: result?.popularBriefs || [],
      });
    } catch (err) {
      console.error('[TEACHER_DASHBOARD] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'TEACHER' && user?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto py-4 md:py-8 px-4">
        <Card className="p-6 md:p-12 text-center">
          <p className="text-base md:text-lg text-gray-600">
            This page is only accessible to teachers and administrators.
          </p>
          <Button onClick={() => onNavigate('dashboard')} className="mt-4 min-h-[44px]">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-4 md:py-8 px-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Teacher Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 md:p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 md:py-8 px-4 max-w-7xl">
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Teacher Dashboard</h1>
        <Button onClick={() => onNavigate('briefs')} className="flex items-center gap-2 min-h-[44px] w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Create Brief
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6 md:mb-8">
        <Card className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-6 w-6 md:h-8 md:w-8 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-600">Total Briefs</p>
              <p className="text-2xl md:text-3xl font-bold">{stats.totalBriefs}</p>
            </div>
          </div>
          <Button
            variant="link"
            className="text-blue-600 p-0 h-auto min-h-[44px]"
            onClick={() => onNavigate('briefs')}
          >
            Manage Briefs →
          </Button>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-6 w-6 md:h-8 md:w-8 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-600">Assignments Generated</p>
              <p className="text-2xl md:text-3xl font-bold">{stats.totalAssignments}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">From your briefs</p>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-purple-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-600">Avg. Usage</p>
              <p className="text-2xl md:text-3xl font-bold">
                {stats.totalBriefs > 0
                  ? (stats.totalAssignments / stats.totalBriefs).toFixed(1)
                  : 0}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Assignments per brief</p>
        </Card>
      </div>

      {/* Popular Briefs */}
      <Card className="p-4 md:p-6 mb-4 md:mb-6 border-2 border-black">
        <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Most Used Briefs
        </h2>
        {stats.popularBriefs.length === 0 ? (
          <p className="text-gray-500 text-center py-6 md:py-8">
            No briefs created yet. Create your first brief to see usage stats!
          </p>
        ) : (
          <div className="space-y-3">
            {stats.popularBriefs.map((brief) => (
              <div
                key={brief.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{brief.unitName}</h3>
                  <p className="text-sm text-gray-600">{brief.unitCode}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 md:gap-4">
                  <Badge>Level {brief.level}</Badge>
                  <div className="text-right">
                    <p className="text-xl md:text-2xl font-bold text-green-600">{brief.usageCount}</p>
                    <p className="text-xs text-gray-600">uses</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('briefs')}
                    className="min-h-[44px] min-w-[44px]"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Briefs */}
      <Card className="p-4 md:p-6 border-2 border-black">
        <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Recent Briefs
        </h2>
        {stats.recentBriefs.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <FileText className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No briefs created yet</p>
            <Button onClick={() => onNavigate('briefs')} className="bg-black text-white hover:bg-gray-800 min-h-[44px]">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Brief
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recentBriefs.map((brief) => (
              <div
                key={brief.id}
                className="p-4 border-2 border-black rounded-lg hover:shadow-md transition-shadow cursor-pointer min-h-[44px]"
                onClick={() => onNavigate('briefs')}
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <h3 className="font-semibold line-clamp-1">{brief.unitName}</h3>
                  <Badge variant="outline" className="flex-shrink-0">L{brief.level}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{brief.unitCode}</p>
                <p className="text-sm text-gray-700 line-clamp-2 mb-3">{brief.vocationalScenario || 'No scenario provided'}</p>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{new Date(brief.createdAt).toLocaleDateString()}</span>
                  <span>{brief.usageCount} uses</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
