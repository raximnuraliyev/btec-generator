import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Search, RefreshCw, Users, Shield, Crown, Ban, 
  Coins, Plus, Minus, RotateCcw, Eye, Download,
  ChevronLeft, ChevronRight, SlidersHorizontal
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  totalTokensUsedAllTime: number;
  totalAssignmentsGenerated: number;
  lastGenerationAt: string | null;
  createdAt: string;
  studentProfile?: {
    id: string;
    fullName: string | null;
    universityName: string | null;
  } | null;
  tokenPlan?: {
    id: string;
    planType: string;
    tokensRemaining: number;
  } | null;
}

interface Filters {
  search: string;
  role: string;
  plan: string;
  status: string;
}

export function AdminUsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    role: '',
    plan: '',
    status: 'ACTIVE'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Token modal state
  const [tokenModal, setTokenModal] = useState<{
    open: boolean;
    userId: string;
    action: 'add' | 'deduct' | 'reset';
    amount: number;
    reason: string;
  }>({
    open: false,
    userId: '',
    action: 'add',
    amount: 0,
    reason: ''
  });

  useEffect(() => {
    loadUsers();
  }, [currentPage, filters.role, filters.plan, filters.status]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        limit: 20
      };
      if (filters.search) params.search = filters.search;
      if (filters.role) params.role = filters.role;
      if (filters.plan) params.plan = filters.plan;
      if (filters.status) params.status = filters.status;

      const response = await adminApi.getUsers(params);
      setUsers(response.users || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalCount(response.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers();
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Change this user's role to ${newRole}?`)) return;
    setActionLoading(userId);
    try {
      await adminApi.updateUserRole(userId, newRole);
      await loadUsers();
    } catch (error) {
      alert('Failed to update role: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    const reason = prompt('Enter reason for suspension:');
    if (!reason) return;
    setActionLoading(userId);
    try {
      await adminApi.suspendUser(userId, reason);
      await loadUsers();
    } catch (error) {
      alert('Failed to suspend user: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnsuspendUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminApi.unsuspendUser(userId);
      await loadUsers();
    } catch (error) {
      alert('Failed to unsuspend user: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanUser = async (userId: string) => {
    const reason = prompt('Enter reason for ban (this is permanent):');
    if (!reason) return;
    if (!confirm('ARE YOU SURE? This will permanently ban this user.')) return;
    setActionLoading(userId);
    try {
      await adminApi.banUser(userId, reason);
      await loadUsers();
    } catch (error) {
      alert('Failed to ban user: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleTokenAction = async () => {
    if (!tokenModal.userId) return;
    setActionLoading(tokenModal.userId);
    try {
      if (tokenModal.action === 'add') {
        await adminApi.addUserTokens(tokenModal.userId, tokenModal.amount, tokenModal.reason);
      } else if (tokenModal.action === 'deduct') {
        await adminApi.deductUserTokens(tokenModal.userId, tokenModal.amount, tokenModal.reason);
      } else if (tokenModal.action === 'reset') {
        await adminApi.resetUserTokens(tokenModal.userId, tokenModal.reason);
      }
      setTokenModal({ open: false, userId: '', action: 'add', amount: 0, reason: '' });
      await loadUsers();
    } catch (error) {
      alert('Failed to update tokens: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const openTokenModal = (userId: string, action: 'add' | 'deduct' | 'reset') => {
    setTokenModal({
      open: true,
      userId,
      action,
      amount: action === 'reset' ? 0 : 5,
      reason: ''
    });
  };

  const handleExportUsers = async () => {
    try {
      const blob = await adminApi.exportUsers(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export users');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Management
          <span className="text-sm font-normal text-gray-500">({totalCount} total)</span>
        </h2>
        <div className="flex gap-2">
          <Button onClick={handleExportUsers} variant="outline" className="border-2 border-black flex-1 sm:flex-none min-h-[44px]">
            <Download className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button onClick={loadUsers} variant="outline" className="border-2 border-black flex-1 sm:flex-none min-h-[44px]">
            <RefreshCw className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border-2 border-black p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search by email or name..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="border-2 border-black min-h-[44px]"
            />
            <Button onClick={handleSearch} className="bg-black text-white hover:bg-gray-800 min-h-[44px]">
              <Search className="w-4 h-4" />
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className={`border-2 min-h-[44px] ${showFilters ? 'border-black bg-gray-100' : 'border-gray-300'}`}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                className="w-full p-2 border-2 border-black rounded min-h-[44px]"
              >
                <option value="">All Roles</option>
                <option value="USER">User</option>
                <option value="VIP">VIP</option>
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Plan</label>
              <select
                value={filters.plan}
                onChange={(e) => setFilters(prev => ({ ...prev, plan: e.target.value }))}
                className="w-full p-2 border-2 border-black rounded min-h-[44px]"
              >
                <option value="">All Plans</option>
                <option value="FREE">Free</option>
                <option value="STARTER">Starter</option>
                <option value="BASIC">Basic</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="PREMIUM">Premium</option>
              </select>
            </div>
            <div className="sm:col-span-2 md:col-span-1">
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-2 border-2 border-black rounded min-h-[44px]"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="BANNED">Banned</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Users - Card view on mobile, Table on desktop */}
      <div className="bg-white border-2 border-black overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200 flex-1">
              {users.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{user.name || 'No name'}</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    <StatusBadge status={user.status} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Role:</span>
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                        user.role === 'ADMIN' ? 'bg-yellow-100 text-yellow-800' :
                        user.role === 'VIP' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'TEACHER' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Plan:</span>
                      <span className="ml-2">{user.tokenPlan?.planType || 'FREE'}</span>
                    </div>
                    <div className="flex items-center">
                      <Coins className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="font-mono font-bold">{user.tokenPlan?.tokensRemaining || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Assignments:</span>
                      <span className="ml-2 font-mono">{user.totalAssignmentsGenerated || 0}</span>
                    </div>
                  </div>
                  
                  {/* Mobile Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    <Button
                      onClick={() => openTokenModal(user.id, 'add')}
                      variant="outline"
                      size="sm"
                      className="flex-1 min-h-[40px] text-green-600 border-green-200"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Tokens
                    </Button>
                    <Button
                      onClick={() => openTokenModal(user.id, 'deduct')}
                      variant="outline"
                      size="sm"
                      className="flex-1 min-h-[40px] text-red-600 border-red-200"
                    >
                      <Minus className="w-4 h-4 mr-1" />
                      Deduct
                    </Button>
                    {user.status === 'active' ? (
                      <Button
                        onClick={() => handleSuspendUser(user.id)}
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === user.id}
                        className="flex-1 min-h-[40px] text-orange-600 border-orange-200"
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Suspend
                      </Button>
                    ) : user.status === 'suspended' ? (
                      <Button
                        onClick={() => handleUnsuspendUser(user.id)}
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === user.id}
                        className="flex-1 min-h-[40px] text-green-600 border-green-200"
                      >
                        Unsuspend
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-black">
                  <tr>
                    <th className="text-left p-4 font-bold whitespace-nowrap">User</th>
                    <th className="text-left p-4 font-bold whitespace-nowrap">Role</th>
                    <th className="text-left p-4 font-bold whitespace-nowrap">Plan</th>
                    <th className="text-center p-4 font-bold whitespace-nowrap">Tokens</th>
                    <th className="text-center p-4 font-bold whitespace-nowrap">Assignments</th>
                    <th className="text-left p-4 font-bold whitespace-nowrap">Status</th>
                    <th className="text-right p-4 font-bold whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{user.name || 'No name'}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={actionLoading === user.id}
                          className={`text-sm px-2 py-1 rounded border min-h-[36px] ${
                            user.role === 'ADMIN' ? 'border-yellow-500 bg-yellow-50' :
                            user.role === 'VIP' ? 'border-purple-500 bg-purple-50' :
                            user.role === 'TEACHER' ? 'border-blue-500 bg-blue-50' :
                            'border-gray-300'
                          }`}
                        >
                          <option value="USER">User</option>
                          <option value="VIP">VIP</option>
                          <option value="TEACHER">Teacher</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{user.tokenPlan?.planType || 'FREE'}</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          <span className="font-mono font-bold">{user.tokenPlan?.tokensRemaining || 0}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-mono">{user.totalAssignmentsGenerated || 0}</span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-1">
                          {/* Token Actions */}
                          <button
                            onClick={() => openTokenModal(user.id, 'add')}
                            title="Add tokens"
                            className="p-2 hover:bg-green-100 rounded text-green-600 min-h-[36px] min-w-[36px]"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openTokenModal(user.id, 'deduct')}
                            title="Deduct tokens"
                            className="p-2 hover:bg-red-100 rounded text-red-600 min-h-[36px] min-w-[36px]"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openTokenModal(user.id, 'reset')}
                            title="Reset tokens to plan default"
                            className="p-2 hover:bg-gray-100 rounded text-gray-600 min-h-[36px] min-w-[36px]"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          
                          <div className="w-px bg-gray-200 mx-1" />
                          
                          {/* Status Actions */}
                          {user.status === 'active' ? (
                            <button
                              onClick={() => handleSuspendUser(user.id)}
                              title="Suspend user"
                              disabled={actionLoading === user.id}
                              className="p-2 hover:bg-orange-100 rounded text-orange-600 min-h-[36px] min-w-[36px]"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : user.status === 'suspended' ? (
                            <button
                              onClick={() => handleUnsuspendUser(user.id)}
                              title="Unsuspend user"
                              disabled={actionLoading === user.id}
                              className="p-2 hover:bg-green-100 rounded text-green-600 min-h-[36px] min-w-[36px]"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          ) : null}
                        
                        {user.status !== 'banned' && user.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleBanUser(user.id)}
                            title="Ban user permanently"
                            disabled={actionLoading === user.id}
                            className="p-2 hover:bg-red-100 rounded text-red-800"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedUser(user)}
                          title="View details"
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
              className="border-2 border-black"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              className="border-2 border-black"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Token Modal */}
      {tokenModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border-2 border-black p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">
              {tokenModal.action === 'add' && 'Add Tokens'}
              {tokenModal.action === 'deduct' && 'Deduct Tokens'}
              {tokenModal.action === 'reset' && 'Reset Tokens'}
            </h3>
            
            {tokenModal.action !== 'reset' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Amount</label>
                <Input
                  type="number"
                  value={tokenModal.amount}
                  onChange={(e) => setTokenModal(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                  min={1}
                  className="border-2 border-black"
                />
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Reason (required)</label>
              <Input
                value={tokenModal.reason}
                onChange={(e) => setTokenModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for audit trail..."
                className="border-2 border-black"
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => setTokenModal({ open: false, userId: '', action: 'add', amount: 0, reason: '' })}
                variant="outline"
                className="border-2 border-black"
              >
                Cancel
              </Button>
              <Button
                onClick={handleTokenAction}
                disabled={!tokenModal.reason || actionLoading !== null}
                className={`text-white ${
                  tokenModal.action === 'add' ? 'bg-green-600 hover:bg-green-700' :
                  tokenModal.action === 'deduct' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-orange-100 text-orange-800',
    banned: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 text-xs rounded ${styles[status] || 'bg-gray-100'}`}>
      {status.toUpperCase()}
    </span>
  );
}

function UserDetailModal({ user, onClose }: { user: User; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white border-2 border-black p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-xl">{user.name || user.studentProfile?.fullName || 'No name'}</h3>
            <p className="text-gray-500">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-2xl hover:text-gray-500">&times;</button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-500">Role</p>
            <p className="font-bold">{user.role}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-500">Plan</p>
            <p className="font-bold">{user.tokenPlan?.planType || 'FREE'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-500">Tokens Remaining</p>
            <p className="font-bold">{user.tokenPlan?.tokensRemaining ?? 0}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-500">Assignments Generated</p>
            <p className="font-bold">{user.totalAssignmentsGenerated}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p><span className="text-gray-500">Status:</span> <StatusBadge status={user.status} /></p>
          <p><span className="text-gray-500">Created:</span> {new Date(user.createdAt).toLocaleString()}</p>
          <p><span className="text-gray-500">Last Generation:</span> {user.lastGenerationAt ? new Date(user.lastGenerationAt).toLocaleString() : 'Never'}</p>
          <p><span className="text-gray-500">Total Tokens Used:</span> {user.totalTokensUsedAllTime}</p>
          {user.studentProfile && (
            <p><span className="text-gray-500">University:</span> {user.studentProfile.universityName || 'Not set'}</p>
          )}
        </div>

        <div className="mt-6 pt-4 border-t">
          <Button onClick={onClose} className="w-full bg-black text-white hover:bg-gray-800">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AdminUsersTab;
