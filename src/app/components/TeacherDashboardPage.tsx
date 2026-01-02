import { useEffect, useState } from 'react';
import { briefsApi, assignmentsApi } from '../services/api';
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
  assignmentsByLevel: Record<string, number>;
  assignmentsByLanguage: Record<string, number>;
  recentBriefs: any[];
  popularBriefs: any[];
}

export function TeacherDashboardPage({ onNavigate }: TeacherDashboardPageProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBriefs: 0,
    totalAssignments: 0,
    assignmentsByLevel: {},
    assignmentsByLanguage: {},
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

      // Load teacher's briefs
      const briefs = await briefsApi.getBriefs({
        createdById: user?.id,
      });

      // For each brief, count how many assignments use it
      const briefUsageMap = new Map<string, number>();
      const assignmentsByLevel: Record<string, number> = {};
      const assignmentsByLanguage: Record<string, number> = {};

      // Note: This is a simplified version. In production, you'd want a dedicated
      // analytics endpoint to avoid N+1 queries
      for (const brief of briefs) {
        try {
          const assignments = await assignmentsApi.getAssignments({
            briefId: brief.id,
          });
          briefUsageMap.set(brief.id, assignments.length || 0);

          // Count by level and language
          assignments.forEach((assignment: any) => {
            const level = `Level ${assignment.snapshot?.level || 'Unknown'}`;
            assignmentsByLevel[level] = (assignmentsByLevel[level] || 0) + 1;

            const language = assignment.language || 'Unknown';
            assignmentsByLanguage[language] = (assignmentsByLanguage[language] || 0) + 1;
          });
        } catch (err) {
          briefUsageMap.set(brief.id, 0);
        }
      }

      // Sort briefs by usage
      const briefsWithUsage = briefs.map((b) => ({
        ...b,
        usageCount: briefUsageMap.get(b.id) || 0,
      }));

      const popularBriefs = [...briefsWithUsage]
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5);

      const recentBriefs = [...briefsWithUsage]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      const totalAssignments = Array.from(briefUsageMap.values()).reduce(
        (sum, count) => sum + count,
        0
      );

      setStats({
        totalBriefs: briefs.length,
        totalAssignments,
        assignmentsByLevel,
        assignmentsByLanguage,
        recentBriefs,
        popularBriefs,
      });
    } catch (err) {
      console.error('[TEACHER_DASHBOARD] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'TEACHER' && user?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="p-12 text-center">
          <p className="text-lg text-gray-600">
            This page is only accessible to teachers and administrators.
          </p>
          <Button onClick={() => onNavigate('dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Teacher Dashboard</h1>
        <div className="grid md:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <Button onClick={() => onNavigate('briefs')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Brief
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Briefs</p>
              <p className="text-3xl font-bold">{stats.totalBriefs}</p>
            </div>
          </div>
          <Button
            variant="link"
            className="text-blue-600 p-0 h-auto"
            onClick={() => onNavigate('briefs')}
          >
            Manage Briefs →
          </Button>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Assignments Generated</p>
              <p className="text-3xl font-bold">{stats.totalAssignments}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">From your briefs</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Avg. Usage</p>
              <p className="text-3xl font-bold">
                {stats.totalBriefs > 0
                  ? (stats.totalAssignments / stats.totalBriefs).toFixed(1)
                  : 0}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Assignments per brief</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Assignments by Level */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Assignments by Level</h2>
          {Object.keys(stats.assignmentsByLevel).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.assignmentsByLevel)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([level, count]) => {
                  const percentage =
                    (count / stats.totalAssignments) * 100;
                  return (
                    <div key={level}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{level}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>

        {/* Assignments by Language */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Assignments by Language</h2>
          {Object.keys(stats.assignmentsByLanguage).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.assignmentsByLanguage)
                .sort(([, a], [, b]) => b - a)
                .map(([language, count]) => {
                  const percentage =
                    (count / stats.totalAssignments) * 100;
                  const languageNames: Record<string, string> = {
                    en: 'English',
                    ru: 'Russian',
                    uz: 'Uzbek',
                    es: 'Spanish',
                  };
                  return (
                    <div key={language}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{languageNames[language] || language}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      </div>

      {/* Popular Briefs */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Most Used Briefs
        </h2>
        {stats.popularBriefs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No briefs created yet. Create your first brief to see usage stats!
          </p>
        ) : (
          <div className="space-y-3">
            {stats.popularBriefs.map((brief) => (
              <div
                key={brief.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{brief.unitName}</h3>
                  <p className="text-sm text-gray-600">{brief.unitCode}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge>Level {brief.level}</Badge>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{brief.usageCount}</p>
                    <p className="text-xs text-gray-600">uses</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('briefs')}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Briefs */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Recent Briefs
        </h2>
        {stats.recentBriefs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No briefs created yet</p>
            <Button onClick={() => onNavigate('briefs')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Brief
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recentBriefs.map((brief) => (
              <div
                key={brief.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onNavigate('briefs')}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold line-clamp-1">{brief.unitName}</h3>
                  <Badge variant="outline">L{brief.level}</Badge>
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
