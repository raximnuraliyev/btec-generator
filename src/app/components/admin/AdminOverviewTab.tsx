import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Button } from '../ui/button';
import { 
  RefreshCw, Users, FileText, Play, Pause, AlertCircle, 
  Shield, Crown, User as UserIcon, Activity, Zap, Clock,
  AlertTriangle, CheckCircle, XCircle, Server
} from 'lucide-react';

interface SystemStats {
  totals: {
    users: number;
    assignments: number;
    activeGenerations: number;
  };
  usersByRole: Record<string, number>;
  assignmentsByStatus: Record<string, number>;
  recentUsers: any[];
  recentAssignments: any[];
}

interface SystemStatus {
  generationPaused: boolean;
  activeJobs: number;
  queuedJobs: number;
  failedJobsLast24h: number;
  averageGenerationTime: number;
  aiModelsHealth: { model: string; status: string; failRate: number }[];
}

export function AdminOverviewTab() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
    let interval: ReturnType<typeof setInterval>;
    if (autoRefresh) {
      interval = setInterval(loadData, 30000); // 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadData = async () => {
    try {
      const [statsData, statusData, approvalsData] = await Promise.all([
        adminApi.getOverviewStats(),
        adminApi.getSystemStatus().catch(() => null),
        adminApi.getPendingApprovals().catch(() => ({ assignments: [] }))
      ]);
      setStats(statsData);
      setSystemStatus(statusData);
      setPendingApprovals(approvalsData?.assignments || []);
    } catch (error) {
      console.error('Failed to load overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseGeneration = async () => {
    if (!confirm('Are you sure you want to PAUSE all generation? This is an emergency action.')) return;
    setActionLoading(true);
    try {
      await adminApi.pauseAllGeneration();
      await loadData();
    } catch (error) {
      alert('Failed to pause generation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeGeneration = async () => {
    setActionLoading(true);
    try {
      await adminApi.resumeAllGeneration();
      await loadData();
    } catch (error) {
      alert('Failed to resume generation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await adminApi.approveAssignment(id);
      await loadData();
    } catch (error) {
      alert('Failed to approve: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Controls Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">System Overview</h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            Auto-refresh (30s)
          </label>
          <Button onClick={loadData} variant="outline" className="border-2 border-black">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Alert */}
      {systemStatus?.generationPaused && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-bold">GENERATION PAUSED</span>
            <span className="text-sm">- All generation is currently stopped</span>
            <Button 
              onClick={handleResumeGeneration} 
              disabled={actionLoading}
              className="ml-auto bg-red-600 hover:bg-red-700 text-white"
            >
              <Play className="w-4 h-4 mr-1" /> Resume Generation
            </Button>
          </div>
        </div>
      )}

      {/* Pending Approvals Alert */}
      {pendingApprovals.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-orange-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Pending Approvals ({pendingApprovals.length})
            </h3>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pendingApprovals.slice(0, 5).map((assignment) => (
              <div key={assignment.id} className="bg-white p-3 rounded border border-orange-200 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{assignment.snapshot?.unitName || 'Untitled'}</p>
                  <p className="text-sm text-gray-500">
                    {assignment.user?.email} • Level {assignment.snapshot?.level} • {assignment.grade}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleApprove(assignment.id)}
                    disabled={approvingId === assignment.id}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    {approvingId === assignment.id ? '...' : '✓ Approve'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          label="Total Users" 
          value={stats?.totals?.users || 0} 
          icon={Users} 
          breakdown={stats?.usersByRole}
        />
        <StatCard 
          label="Total Assignments" 
          value={stats?.totals?.assignments || 0} 
          icon={FileText}
          breakdown={stats?.assignmentsByStatus}
        />
        <StatCard 
          label="Active Generations" 
          value={systemStatus?.activeJobs || stats?.totals?.activeGenerations || 0} 
          icon={Zap}
          highlight={true}
        />
        <StatCard 
          label="Queued Jobs" 
          value={systemStatus?.queuedJobs || 0} 
          icon={Clock}
        />
      </div>

      {/* Queue & AI Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Queue Status */}
        <div className="bg-white border-2 border-black p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5" />
            Queue Status
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Active Jobs</span>
              <span className="font-mono font-bold text-green-600">{systemStatus?.activeJobs || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Waiting Jobs</span>
              <span className="font-mono font-bold text-yellow-600">{systemStatus?.queuedJobs || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Failed (24h)</span>
              <span className="font-mono font-bold text-red-600">{systemStatus?.failedJobsLast24h || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Avg Generation Time</span>
              <span className="font-mono">{systemStatus?.averageGenerationTime ? `${Math.round(systemStatus.averageGenerationTime / 1000)}s` : 'N/A'}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            {systemStatus?.generationPaused ? (
              <Button 
                onClick={handleResumeGeneration} 
                disabled={actionLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Resume All Generation
              </Button>
            ) : (
              <Button 
                onClick={handlePauseGeneration} 
                disabled={actionLoading}
                variant="outline"
                className="w-full border-red-500 text-red-600 hover:bg-red-50"
              >
                <Pause className="w-4 h-4 mr-2" />
                Emergency: Pause All
              </Button>
            )}
          </div>
        </div>

        {/* AI Health */}
        <div className="bg-white border-2 border-black p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            AI Models Health
          </h3>
          {systemStatus?.aiModelsHealth && systemStatus.aiModelsHealth.length > 0 ? (
            <div className="space-y-3">
              {systemStatus.aiModelsHealth.map((model, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    {model.status === 'healthy' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : model.status === 'degraded' ? (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="font-mono text-sm">{model.model}</span>
                  </div>
                  <div className="text-sm">
                    <span className={model.failRate > 10 ? 'text-red-600' : 'text-gray-500'}>
                      {model.failRate.toFixed(1)}% fail rate
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No AI health data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-black p-6">
          <h3 className="font-bold mb-4">Recent Users</h3>
          <div className="space-y-3">
            {stats?.recentUsers && stats.recentUsers.length > 0 ? (
              stats.recentUsers.slice(0, 5).map(user => (
                <div key={user.id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{user.name || 'No name'}</p>
                    <p className="text-gray-500">{user.email}</p>
                  </div>
                  <RoleBadge role={user.role} />
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent users</p>
            )}
          </div>
        </div>

        <div className="bg-white border-2 border-black p-6">
          <h3 className="font-bold mb-4">Recent Assignments</h3>
          <div className="space-y-3">
            {stats?.recentAssignments && stats.recentAssignments.length > 0 ? (
              stats.recentAssignments.slice(0, 5).map(assignment => (
                <div key={assignment.id} className="flex justify-between items-center text-sm">
                  <div className="overflow-hidden">
                    <p className="font-medium truncate">
                      {assignment.snapshot?.unitName || 'Untitled Assignment'}
                    </p>
                    <p className="text-gray-500">{assignment.user?.email || 'Unknown user'}</p>
                  </div>
                  <StatusBadge status={assignment.status} />
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent assignments</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ 
  label, 
  value, 
  icon: Icon,
  highlight = false,
  breakdown
}: { 
  label: string; 
  value: number; 
  icon: React.ElementType;
  highlight?: boolean;
  breakdown?: Record<string, number>;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <div 
      className={`border-2 p-6 ${highlight ? 'border-yellow-500 bg-yellow-50' : 'border-black bg-white'} cursor-pointer transition-all hover:shadow-lg`}
      onClick={() => breakdown && setShowBreakdown(!showBreakdown)}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-6 h-6 ${highlight ? 'text-yellow-600' : 'text-gray-400'}`} />
        {breakdown && (
          <span className="text-xs text-gray-400">{showBreakdown ? '▲' : '▼'}</span>
        )}
      </div>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-600">{label}</p>
      
      {showBreakdown && breakdown && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-1">
          {Object.entries(breakdown).map(([key, count]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-gray-600">{key}</span>
              <span className="font-mono">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    ADMIN: 'bg-yellow-100 text-yellow-800 border-yellow-500',
    VIP: 'bg-purple-100 text-purple-800 border-purple-500',
    TEACHER: 'bg-blue-100 text-blue-800 border-blue-500',
    USER: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const icons: Record<string, React.ElementType> = {
    ADMIN: Shield,
    VIP: Crown,
    TEACHER: UserIcon,
    USER: UserIcon,
  };

  const Icon = icons[role] || UserIcon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs border rounded ${styles[role] || styles.USER}`}>
      <Icon className="w-3 h-3" />
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const badges: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    GENERATING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 text-xs rounded ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}

export default AdminOverviewTab;
