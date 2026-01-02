import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/api';
import { Button } from './ui/button';
import { 
  LogOut, Users, FileText, Settings, Activity, 
  Play, Pause, Square, RotateCcw, Trash2, Edit,
  ChevronDown, ChevronUp, X, Save, Eye, RefreshCw,
  Shield, Crown, User as UserIcon, BarChart3, TrendingUp, TrendingDown,
  MessageSquare, Bug, Lightbulb, FileWarning, Download, HelpCircle, AlertCircle, Clock
} from 'lucide-react';
import { AdminUser, AdminAssignment, AdminStats, UserRole } from '../types';

type AdminTab = 'overview' | 'assignments' | 'users' | 'logs' | 'analytics' | 'issues';
type LogType = 'backend' | 'error' | 'discord' | 'redis' | 'database' | 'audit';

interface AdminPageProps {
  onNavigate: (page: 'dashboard') => void;
}

/**
 * Admin Dashboard Page
 * Full admin control panel with:
 * - System overview and statistics
 * - Assignment management (pause, stop, restart, delete)
 * - User management (view, edit roles, edit credentials)
 * - System logs viewer
 */
export function AdminPage({ onNavigate }: AdminPageProps) {
  const { user, logout, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => onNavigate('dashboard')} className="bg-black text-white">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-black text-white border-b-4 border-yellow-500">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="w-6 h-6 text-yellow-500" />
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </button>
            <span className="text-sm text-gray-400">{user?.email}</span>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 border border-white text-white hover:bg-white hover:text-black transition-colors rounded"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-0">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'assignments', label: 'Assignments', icon: FileText },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'issues', label: 'Issues', icon: MessageSquare },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'logs', label: 'Logs', icon: Settings },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-black text-black font-semibold'
                    : 'border-transparent text-gray-500 hover:text-black'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'assignments' && <AssignmentsTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'issues' && <IssuesTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'logs' && <LogsTab />}
      </main>
    </div>
  );
}

// =============================================================================
// OVERVIEW TAB
// =============================================================================

function OverviewTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    loadPendingApprovals();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getOverviewStats();
      if (!data) {
        throw new Error('No data received from API');
      }
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Set default stats to prevent crashes
      setStats({
        totals: { users: 0, assignments: 0, activeGenerations: 0 },
        usersByRole: { ADMIN: 0, TEACHER: 0, USER: 0, VIP: 0 },
        assignmentsByStatus: { DRAFT: 0, GENERATING: 0, COMPLETED: 0, FAILED: 0 },
        recentUsers: [],
        recentAssignments: []
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPendingApprovals = async () => {
    try {
      const data = await adminApi.getPendingApprovals();
      setPendingApprovals(data.assignments || []);
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
    }
  };

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await adminApi.approveAssignment(id);
      await loadPendingApprovals();
    } catch (error) {
      alert('Failed to approve: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled
    
    setApprovingId(id);
    try {
      await adminApi.rejectAssignment(id, reason || undefined);
      await loadPendingApprovals();
    } catch (error) {
      alert('Failed to reject: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!stats) {
    return <div className="text-center py-12 text-gray-500">Failed to load statistics</div>;
  }

  return (
    <div className="space-y-8">
      {/* Pending Approvals Alert */}
      {pendingApprovals.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-orange-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Pending Approvals ({pendingApprovals.length})
            </h3>
            <button
              onClick={loadPendingApprovals}
              className="text-sm text-orange-600 hover:text-orange-800"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {pendingApprovals.slice(0, 5).map((assignment) => (
              <div key={assignment.id} className="bg-white p-3 rounded border border-orange-200 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{assignment.snapshot?.unitName || assignment.snapshot?.subjectName || 'Untitled'}</p>
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
                  <button
                    onClick={() => handleReject(assignment.id)}
                    disabled={approvingId === assignment.id}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50"
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {loading && !stats ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading stats...</p>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Total Users" value={stats.totals.users} icon={Users} />
          <StatCard label="Total Assignments" value={stats.totals.assignments} icon={FileText} />
          <StatCard 
            label="Active Generations" 
            value={stats.totals.activeGenerations} 
            icon={Play} 
            highlight={stats.totals.activeGenerations > 0}
          />
        </div>
      ) : null}

      {/* Status Breakdowns */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-2 border-black p-6">
            <h3 className="font-bold mb-4">Users by Role</h3>
            <div className="space-y-2">
              {Object.entries(stats.usersByRole).map(([role, count]) => (
              <div key={role} className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  {role === 'ADMIN' && <Shield className="w-4 h-4 text-yellow-500" />}
                  {role === 'VIP' && <Crown className="w-4 h-4 text-purple-500" />}
                  {role === 'USER' && <UserIcon className="w-4 h-4 text-gray-500" />}
                  {role}
                </span>
                <span className="font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border-2 border-black p-6">
          <h3 className="font-bold mb-4">Assignments by Status</h3>
          <div className="space-y-2">
            {Object.entries(stats.assignmentsByStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className={getStatusColor(status)}>{status}</span>
                <span className="font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border-2 border-black p-6">
          <h3 className="font-bold mb-4">Assignments by Status</h3>
          <div className="space-y-2">
            {stats.assignmentsByStatus && Object.entries(stats.assignmentsByStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className={getStatusColor(status)}>{status}</span>
                <span className="font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Recent Activity */}
      {stats && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-black p-6">
          <h3 className="font-bold mb-4">Recent Users</h3>
          <div className="space-y-3">
            {stats.recentUsers && stats.recentUsers.length > 0 ? (
              stats.recentUsers.map(user => (
                <div key={user.id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{user.name || 'No name'}</p>
                    <p className="text-gray-500">{user.email}</p>
                  </div>
                  <RoleBadge role={user.role as UserRole} />
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
            {stats.recentAssignments && stats.recentAssignments.length > 0 ? (
              stats.recentAssignments.slice(0, 5).map(assignment => (
                <div key={assignment.id} className="flex justify-between items-center text-sm">
                  <div className="overflow-hidden">
                    <p className="font-medium truncate">
                      {assignment.snapshot?.unitName || assignment.snapshot?.subjectName || 'Untitled Assignment'}
                    </p>
                    <p className="text-gray-500">{assignment.user?.email || 'Unknown user'}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs ${getStatusBadge(assignment.status)}`}>
                    {assignment.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent assignments</p>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

// =============================================================================
// ASSIGNMENTS TAB
// =============================================================================

function AssignmentsTab() {
  const [assignments, setAssignments] = useState<AdminAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadAssignments();
  }, [page, statusFilter]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAllAssignments(page, 20, statusFilter || undefined);
      setAssignments(data.assignments);
      setTotalPages(data.pages);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, id: string) => {
    try {
      switch (action) {
        case 'pause':
          await adminApi.pauseAssignment(id);
          break;
        case 'resume':
          await adminApi.resumeAssignment(id);
          break;
        case 'stop':
          await adminApi.stopAssignment(id);
          break;
        case 'restart':
          await adminApi.restartAssignment(id);
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this assignment?')) {
            await adminApi.deleteAssignment(id);
          } else {
            return;
          }
          break;
      }
      loadAssignments();
    } catch (error) {
      alert(`Failed to ${action} assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-2 border-black px-4 py-2 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="GENERATING">Generating</option>
            <option value="AWAITING_APPROVAL">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        <Button onClick={loadAssignments} variant="outline" className="border-2 border-black">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white border-2 border-black overflow-hidden">
          <table className="w-full">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-4 py-3 text-left">Assignment</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Progress</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(assignment => (
                <tr key={assignment.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium truncate max-w-xs">{assignment.snapshot?.unitName || assignment.snapshot?.subjectName || 'Untitled'}</p>
                      <p className="text-sm text-gray-500">Level {assignment.snapshot?.level} • {assignment.grade}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{assignment.user?.studentProfile?.fullName || 'No name'}</p>
                      <p className="text-sm text-gray-500">{assignment.user?.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs ${getStatusBadge(assignment.status)}`}>
                      {assignment.status === 'AWAITING_APPROVAL' ? 'PAUSED' : assignment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {assignment.currentJob ? (
                      <div>
                        <div className="w-32 bg-gray-200 h-2 rounded">
                          <div 
                            className="bg-black h-2 rounded transition-all"
                            style={{ width: `${assignment.currentJob.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {assignment.currentJob.currentStage}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {(assignment.status === 'GENERATING' || assignment.currentJob?.status === 'PROCESSING') && (
                        <button
                          onClick={() => handleAction('pause', assignment.id)}
                          className="p-2 hover:bg-gray-200 rounded"
                          title="Pause"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      {(assignment.status === 'AWAITING_APPROVAL' || assignment.currentJob?.status === 'AWAITING_APPROVAL') && (
                        <button
                          onClick={() => handleAction('resume', assignment.id)}
                          className="p-2 hover:bg-gray-200 rounded"
                          title="Resume"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {assignment.currentJob && !['COMPLETED', 'CANCELLED'].includes(assignment.currentJob.status) && (
                        <button
                          onClick={() => handleAction('stop', assignment.id)}
                          className="p-2 hover:bg-gray-200 rounded"
                          title="Stop"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleAction('restart', assignment.id)}
                        className="p-2 hover:bg-gray-200 rounded"
                        title="Restart"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAction('delete', assignment.id)}
                        className="p-2 hover:bg-red-100 rounded text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="outline"
            className="border-2 border-black"
          >
            Previous
          </Button>
          <span className="px-4">Page {page} of {totalPages}</span>
          <Button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            variant="outline"
            className="border-2 border-black"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// USERS TAB
// =============================================================================

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ email: '', name: '', password: '', role: '' });

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers(page, 50, search);
      setUsers(data.users);
      setTotalPages(data.pages);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user: AdminUser) => {
    setEditingUser(user.id);
    setEditForm({
      email: user.email,
      name: user.name || '',
      password: '',
      role: user.role,
    });
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    
    try {
      const updates: any = {};
      if (editForm.email) updates.email = editForm.email;
      if (editForm.name) updates.name = editForm.name;
      if (editForm.password) updates.password = editForm.password;
      if (editForm.role) updates.role = editForm.role;

      await adminApi.updateUser(editingUser, updates);
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      alert(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border-2 border-black px-4 py-2"
        />
        <Button onClick={loadUsers} variant="outline" className="border-2 border-black">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white border-2 border-black overflow-hidden">
          <table className="w-full">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Assignments</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <React.Fragment key={user.id}>
                  <tr className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{user.name || 'No name'}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.discordUserId && (
                          <p className="text-xs text-purple-500">Discord linked</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        {user.assignmentCount} assignments
                        {selectedUser === user.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(user)}
                          className="p-2 hover:bg-gray-200 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Edit Form Row */}
                  {editingUser === user.id && (
                    <tr className="bg-yellow-50 border-t border-yellow-200">
                      <td colSpan={5} className="px-4 py-4">
                        <div className="flex items-center gap-4 flex-wrap">
                          <input
                            type="email"
                            placeholder="Email"
                            value={editForm.email}
                            onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                            className="border border-gray-300 px-3 py-1 rounded"
                          />
                          <input
                            type="text"
                            placeholder="Name"
                            value={editForm.name}
                            onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                            className="border border-gray-300 px-3 py-1 rounded"
                          />
                          <input
                            type="password"
                            placeholder="New Password"
                            value={editForm.password}
                            onChange={(e) => setEditForm(f => ({ ...f, password: e.target.value }))}
                            className="border border-gray-300 px-3 py-1 rounded"
                          />
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm(f => ({ ...f, role: e.target.value }))}
                            className="border border-gray-300 px-3 py-1 rounded"
                          >
                            <option value="USER">USER</option>
                            <option value="VIP">VIP</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                          <Button onClick={saveEdit} className="bg-black text-white">
                            <Save className="w-4 h-4 mr-1" /> Save
                          </Button>
                          <Button onClick={() => setEditingUser(null)} variant="outline">
                            <X className="w-4 h-4 mr-1" /> Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* User's Assignments */}
                  {selectedUser === user.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-4 py-4">
                        <UserAssignmentsPanel userId={user.id} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="outline"
            className="border-2 border-black"
          >
            Previous
          </Button>
          <span className="px-4">Page {page} of {totalPages}</span>
          <Button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            variant="outline"
            className="border-2 border-black"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function UserAssignmentsPanel({ userId }: { userId: string }) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserDetails();
  }, [userId]);

  const loadUserDetails = async () => {
    try {
      const data = await adminApi.getUser(userId);
      setUserData(data.user);
    } catch (error) {
      console.error('Failed to load user details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!userData) return <div>Failed to load user data</div>;

  const assignments = userData.assignments || [];

  return (
    <div className="space-y-2">
      <h4 className="font-semibold">Assignments for {userData.name || userData.email}</h4>
      {assignments.length === 0 ? (
        <p className="text-gray-500">No assignments found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {assignments.map((a: any) => (
            <div key={a.id} className="border border-gray-200 p-3 rounded bg-white">
              <p className="font-medium truncate">{a.title || 'Untitled'}</p>
              <p className="text-sm text-gray-500">
                Level {a.level || 'N/A'} • {a.grade || a.targetGrade || 'N/A'} • {a.status || 'DRAFT'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(a.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// LOGS TAB
// =============================================================================

function LogsTab() {
  const [logType, setLogType] = useState<LogType>('backend');
  const [logContent, setLogContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState(100);

  useEffect(() => {
    if (logType !== 'audit') {
      loadLogs();
    }
  }, [logType, lines]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getLogs(logType, lines);
      setLogContent(data.content);
    } catch (error) {
      setLogContent(`Error loading logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Log Type Selector */}
      <div className="flex items-center gap-4 flex-wrap">
        {[
          { id: 'backend', label: 'Backend' },
          { id: 'error', label: 'Errors' },
          { id: 'discord', label: 'Discord Bot' },
          { id: 'redis', label: 'Redis' },
          { id: 'database', label: 'Database' },
          { id: 'audit', label: 'Audit Logs' },
        ].map(type => (
          <button
            key={type.id}
            onClick={() => setLogType(type.id as LogType)}
            className={`px-4 py-2 border-2 transition-colors ${
              logType === type.id
                ? 'border-black bg-black text-white'
                : 'border-gray-300 hover:border-black'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {logType === 'audit' ? (
        <AuditLogsPanel />
      ) : (
        <>
          {/* Controls */}
          <div className="flex items-center gap-4">
            <select
              value={lines}
              onChange={(e) => setLines(parseInt(e.target.value))}
              className="border-2 border-black px-4 py-2 bg-white"
            >
              <option value="50">50 lines</option>
              <option value="100">100 lines</option>
              <option value="200">200 lines</option>
              <option value="500">500 lines</option>
            </select>
            <Button onClick={loadLogs} variant="outline" className="border-2 border-black">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Log Content */}
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-[600px] border-2 border-black">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <pre className="whitespace-pre-wrap">{logContent}</pre>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function AuditLogsPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadAuditLogs();
  }, [page]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAuditLogs(page, 50);
      setLogs(data.logs);
      setTotalPages(data.pages);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="bg-white border-2 border-black overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="px-4 py-2 text-left">Time</th>
              <th className="px-4 py-2 text-left">Action</th>
              <th className="px-4 py-2 text-left">Entity</th>
              <th className="px-4 py-2 text-left">User</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-t border-gray-200">
                <td className="px-4 py-2 text-gray-500">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-2 font-mono">{log.action}</td>
                <td className="px-4 py-2">
                  {log.entity} <span className="text-gray-400 text-xs">{log.entityId.slice(0, 8)}</span>
                </td>
                <td className="px-4 py-2">{log.user?.email || 'System'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="outline"
            className="border-2 border-black"
          >
            Previous
          </Button>
          <span className="px-4">Page {page} of {totalPages}</span>
          <Button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            variant="outline"
            className="border-2 border-black"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ANALYTICS TAB
// =============================================================================

type RecapType = 'weekly' | 'monthly' | 'yearly';
type TokenPeriod = '24h' | '7d' | '30d' | '90d' | '1y';

interface TokenAnalytics {
  period: string;
  summary: {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    totalRequests: number;
  };
  byUser: {
    userId: string;
    email: string;
    name: string | null;
    tokens: number;
  }[];
  byDay: { date: string; tokens: number; requests: number }[];
}

interface RecapData {
  type: string;
  period: { start: string; end: string };
  current: {
    newUsers: number;
    totalAssignments: number;
    completedAssignments: number;
    totalTokensUsed: number;
    assignmentsByGrade: Record<string, number>;
    assignmentsByLevel: Record<string, number>;
    topUsers: {
      email: string;
      name: string | null;
      tokensUsed: number;
      assignmentCount: number;
    }[];
  };
  previous: {
    newUsers: number;
    totalAssignments: number;
    totalTokensUsed: number;
  };
  growth: {
    users: number;
    assignments: number;
    tokens: number;
  };
}

// =============================================================================
// ISSUES TAB
// =============================================================================

type IssueCategory = 'BUG' | 'FEATURE_REQUEST' | 'GENERATION_ISSUE' | 'DOWNLOAD_ISSUE' | 'ACCOUNT_ISSUE' | 'OTHER';
type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface Issue {
  id: string;
  userId: string;
  user: { id: string; email: string; name: string | null };
  title: string;
  description: string;
  category: IssueCategory;
  screenshot: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  adminResponse: string | null;
  adminId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const categoryIcons: Record<IssueCategory, React.ReactNode> = {
  BUG: <Bug className="w-4 h-4" />,
  FEATURE_REQUEST: <Lightbulb className="w-4 h-4" />,
  GENERATION_ISSUE: <FileWarning className="w-4 h-4" />,
  DOWNLOAD_ISSUE: <Download className="w-4 h-4" />,
  ACCOUNT_ISSUE: <UserIcon className="w-4 h-4" />,
  OTHER: <HelpCircle className="w-4 h-4" />,
};

const categoryLabels: Record<IssueCategory, string> = {
  BUG: 'Bug',
  FEATURE_REQUEST: 'Feature',
  GENERATION_ISSUE: 'Generation',
  DOWNLOAD_ISSUE: 'Download',
  ACCOUNT_ISSUE: 'Account',
  OTHER: 'Other',
};

const statusConfig: Record<IssueStatus, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'Open', color: 'text-blue-600', bg: 'bg-blue-100' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  RESOLVED: { label: 'Resolved', color: 'text-green-600', bg: 'bg-green-100' },
  CLOSED: { label: 'Closed', color: 'text-gray-600', bg: 'bg-gray-100' },
};

const priorityConfig: Record<IssuePriority, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Low', color: 'text-gray-600', bg: 'bg-gray-100' },
  MEDIUM: { label: 'Medium', color: 'text-blue-600', bg: 'bg-blue-100' },
  HIGH: { label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
  URGENT: { label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100' },
};

function IssuesTab() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<IssueStatus | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState<IssueCategory | 'ALL'>('ALL');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [response, setResponse] = useState('');
  const [newStatus, setNewStatus] = useState<IssueStatus>('OPEN');
  const [newPriority, setNewPriority] = useState<IssuePriority>('MEDIUM');
  const [saving, setSaving] = useState(false);
  
  const getToken = () => localStorage.getItem('btec_token');

  useEffect(() => {
    loadIssues();
  }, [filterStatus, filterCategory]);

  const loadIssues = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (filterStatus !== 'ALL') params.append('status', filterStatus);
      if (filterCategory !== 'ALL') params.append('category', filterCategory);

      const res = await fetch(`/api/admin/issues?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues || []);
      }
    } catch (error) {
      console.error('Failed to load issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setResponse(issue.adminResponse || '');
    setNewStatus(issue.status);
    setNewPriority(issue.priority);
  };

  const handleSave = async () => {
    if (!selectedIssue) return;
    
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/admin/issues/${selectedIssue.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          priority: newPriority,
          adminResponse: response || null,
        }),
      });

      if (res.ok) {
        await loadIssues();
        setSelectedIssue(null);
      }
    } catch (error) {
      console.error('Failed to update issue:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (issueId: string) => {
    if (!confirm('Are you sure you want to delete this issue?')) return;

    try {
      const token = getToken();
      const res = await fetch(`/api/admin/issues/${issueId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await loadIssues();
        if (selectedIssue?.id === issueId) setSelectedIssue(null);
      }
    } catch (error) {
      console.error('Failed to delete issue:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openCount = issues.filter(i => i.status === 'OPEN').length;
  const inProgressCount = issues.filter(i => i.status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Issues</h2>
          <p className="text-gray-600">Manage support tickets and feedback</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {openCount} Open
          </span>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            {inProgressCount} In Progress
          </span>
          <button
            onClick={loadIssues}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as IssueStatus | 'ALL')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as IssueCategory | 'ALL')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="ALL">All Categories</option>
            <option value="BUG">Bug</option>
            <option value="FEATURE_REQUEST">Feature Request</option>
            <option value="GENERATION_ISSUE">Generation Issue</option>
            <option value="DOWNLOAD_ISSUE">Download Issue</option>
            <option value="ACCOUNT_ISSUE">Account Issue</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold">Issues ({issues.length})</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : issues.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                No issues found
              </div>
            ) : (
              issues.map((issue) => {
                const status = statusConfig[issue.status];
                const priority = priorityConfig[issue.priority];
                const isSelected = selectedIssue?.id === issue.id;

                return (
                  <div
                    key={issue.id}
                    onClick={() => handleSelectIssue(issue)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="text-gray-500 mt-0.5">
                          {categoryIcons[issue.category]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{issue.title}</h4>
                          <p className="text-sm text-gray-500 truncate">{issue.user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${status.bg} ${status.color}`}>
                              {status.label}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${priority.bg} ${priority.color}`}>
                              {priority.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-gray-400">{formatDate(issue.createdAt)}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(issue.id); }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Issue Detail */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold">Issue Details</h3>
          </div>
          {selectedIssue ? (
            <div className="p-4 space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  {categoryIcons[selectedIssue.category]}
                  <span>{categoryLabels[selectedIssue.category]}</span>
                  <span className="text-gray-300">•</span>
                  <span>{formatDate(selectedIssue.createdAt)}</span>
                </div>
                <h3 className="text-lg font-semibold">{selectedIssue.title}</h3>
                <p className="text-sm text-gray-500">From: {selectedIssue.user.email}</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <div className="p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                  {selectedIssue.description}
                </div>
              </div>

              {/* Screenshot */}
              {selectedIssue.screenshot && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Screenshot</label>
                  <img
                    src={selectedIssue.screenshot}
                    alt="Issue screenshot"
                    className="max-w-full max-h-48 rounded-lg border border-gray-200 cursor-pointer hover:opacity-90"
                    onClick={() => window.open(selectedIssue.screenshot!, '_blank')}
                  />
                </div>
              )}

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as IssueStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as IssuePriority)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Response */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Response</label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Write a response to the user..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Eye className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              Select an issue to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ANALYTICS TAB
// =============================================================================

function AnalyticsTab() {
  const [tokenPeriod, setTokenPeriod] = useState<TokenPeriod>('7d');
  const [recapType, setRecapType] = useState<RecapType>('weekly');
  const [tokenData, setTokenData] = useState<TokenAnalytics | null>(null);
  const [recapData, setRecapData] = useState<RecapData | null>(null);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [loadingRecap, setLoadingRecap] = useState(true);

  useEffect(() => {
    loadTokenAnalytics();
  }, [tokenPeriod]);

  useEffect(() => {
    loadRecap();
  }, [recapType]);

  const loadTokenAnalytics = async () => {
    setLoadingTokens(true);
    try {
      const data = await adminApi.getTokenAnalytics(tokenPeriod);
      setTokenData(data);
    } catch (error) {
      console.error('Failed to load token analytics:', error);
    } finally {
      setLoadingTokens(false);
    }
  };

  const loadRecap = async () => {
    setLoadingRecap(true);
    try {
      const data = await adminApi.getRecap(recapType);
      setRecapData(data);
    } catch (error) {
      console.error('Failed to load recap:', error);
    } finally {
      setLoadingRecap(false);
    }
  };

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const GrowthIndicator = ({ value }: { value: number }) => (
    <span className={`flex items-center gap-1 text-sm font-semibold ${
      value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-500'
    }`}>
      {value > 0 ? <TrendingUp className="w-4 h-4" /> : value < 0 ? <TrendingDown className="w-4 h-4" /> : null}
      {value > 0 ? '+' : ''}{value}%
    </span>
  );

  return (
    <div className="space-y-8">
      {/* Token Usage Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Token Usage</h2>
          <div className="flex gap-2">
            <Button 
              onClick={loadTokenAnalytics} 
              variant="outline" 
              className="border-2 border-black"
              disabled={loadingTokens}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingTokens ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {(['24h', '7d', '30d', '90d', '1y'] as TokenPeriod[]).map(period => (
              <button
                key={period}
                onClick={() => setTokenPeriod(period)}
                className={`px-3 py-1 text-sm border-2 transition-colors ${
                  tokenPeriod === period
                    ? 'border-black bg-black text-white'
                    : 'border-gray-300 hover:border-black'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {loadingTokens ? (
          <LoadingSpinner />
        ) : tokenData ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border-2 border-black p-4">
              <p className="text-sm text-gray-500">Total Tokens</p>
              <p className="text-2xl font-bold">{formatNumber(tokenData.summary.totalTokens)}</p>
            </div>
            <div className="bg-white border-2 border-black p-4">
              <p className="text-sm text-gray-500">Input Tokens</p>
              <p className="text-2xl font-bold">{formatNumber(tokenData.summary.inputTokens)}</p>
            </div>
            <div className="bg-white border-2 border-black p-4">
              <p className="text-sm text-gray-500">Output Tokens</p>
              <p className="text-2xl font-bold">{formatNumber(tokenData.summary.outputTokens)}</p>
            </div>
            <div className="bg-white border-2 border-black p-4">
              <p className="text-sm text-gray-500">API Requests</p>
              <p className="text-2xl font-bold">{formatNumber(tokenData.summary.totalRequests)}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No token usage data available</div>
        )}

        {tokenData && tokenData.byUser.length > 0 && (
          <div className="bg-white border-2 border-black p-4">
            <h3 className="font-bold mb-4">Top Users by Token Usage</h3>
            <div className="space-y-2">
              {tokenData.byUser.slice(0, 10).map((user, index) => (
                <div key={user.userId} className="flex items-center gap-4">
                  <span className="w-6 h-6 flex items-center justify-center bg-black text-white text-xs font-bold">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{user.name || user.email}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <span className="font-mono font-bold">{formatNumber(user.tokens)} tokens</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recap Section */}
      {/* Recap - Minimized Compact Design */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {recapType === 'weekly' ? 'Weekly' : recapType === 'monthly' ? 'Monthly' : 'Yearly'} Summary
          </h2>
          <div className="flex gap-1">
            {(['weekly', 'monthly', 'yearly'] as RecapType[]).map(type => (
              <button
                key={type}
                onClick={() => setRecapType(type)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  recapType === type
                    ? 'bg-black text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loadingRecap ? (
          <LoadingSpinner />
        ) : recapData ? (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Header with date range */}
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {new Date(recapData.period.start).toLocaleDateString()} - {new Date(recapData.period.end).toLocaleDateString()}
              </span>
              <span className="text-xs text-gray-400">vs previous period</span>
            </div>

            {/* Main Stats Row */}
            <div className="grid grid-cols-4 divide-x divide-gray-200">
              <div className="p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{recapData.current.newUsers}</p>
                <p className="text-xs text-gray-500">New Users</p>
                <GrowthIndicator value={recapData.growth.users} />
              </div>
              <div className="p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{recapData.current.totalAssignments}</p>
                <p className="text-xs text-gray-500">Assignments</p>
                <GrowthIndicator value={recapData.growth.assignments} />
              </div>
              <div className="p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{recapData.current.completedAssignments}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{formatNumber(recapData.current.totalTokensUsed)}</p>
                <p className="text-xs text-gray-500">Tokens</p>
                <GrowthIndicator value={recapData.growth.tokens} />
              </div>
            </div>

            {/* Breakdown Row */}
            <div className="grid grid-cols-2 divide-x divide-gray-200 border-t border-gray-200">
              {/* By Grade */}
              <div className="p-3">
                <h4 className="text-xs font-medium text-gray-500 mb-2">By Grade</h4>
                <div className="flex gap-3">
                  {Object.entries(recapData.current.assignmentsByGrade).map(([grade, count]) => (
                    <div key={grade} className="flex items-center gap-1">
                      <span className={`w-5 h-5 flex items-center justify-center text-xs font-bold rounded ${
                        grade === 'D' ? 'bg-yellow-100 text-yellow-700' :
                        grade === 'M' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {grade}
                      </span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Level */}
              <div className="p-3">
                <h4 className="text-xs font-medium text-gray-500 mb-2">By Level</h4>
                <div className="flex gap-3">
                  {Object.entries(recapData.current.assignmentsByLevel).map(([level, count]) => (
                    <div key={level} className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">L{level}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Users - Compact */}
            {recapData.current.topUsers.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <h4 className="text-xs font-medium text-gray-500 mb-2">Top Users</h4>
                <div className="flex gap-4 overflow-x-auto">
                  {recapData.current.topUsers.slice(0, 5).map((user, index) => (
                    <div key={index} className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                      <div>
                        <p className="text-sm font-medium truncate max-w-24">{user.name || user.email.split('@')[0]}</p>
                        <p className="text-xs text-gray-500">{user.assignmentCount} assignments</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm">No recap data available</div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon: Icon,
  highlight = false 
}: { 
  label: string; 
  value: number; 
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <div className={`border-2 p-6 ${highlight ? 'border-yellow-500 bg-yellow-50' : 'border-black bg-white'}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-6 h-6 ${highlight ? 'text-yellow-600' : 'text-gray-400'}`} />
      </div>
      <p className="text-3xl font-bold">{(value || 0).toLocaleString()}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const styles = {
    ADMIN: 'bg-yellow-100 text-yellow-800 border-yellow-500',
    VIP: 'bg-purple-100 text-purple-800 border-purple-500',
    USER: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const icons = {
    ADMIN: Shield,
    VIP: Crown,
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

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: 'text-gray-600',
    GENERATING: 'text-blue-600',
    PROCESSING: 'text-blue-600',
    QUEUED: 'text-yellow-600',
    AWAITING_APPROVAL: 'text-orange-600',
    COMPLETED: 'text-green-600',
    FAILED: 'text-red-600',
    CANCELLED: 'text-gray-400',
  };
  return colors[status] || 'text-gray-600';
}

function getStatusBadge(status: string): string {
  const badges: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    GENERATING: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    QUEUED: 'bg-yellow-100 text-yellow-800',
    AWAITING_APPROVAL: 'bg-orange-100 text-orange-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-400',
  };
  return badges[status] || 'bg-gray-100 text-gray-800';
}
