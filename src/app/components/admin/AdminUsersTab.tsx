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
  tokens: number;
  plan: string | null;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  _count?: {
    assignments: number;
  };
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Management
          <span className="text-sm font-normal text-gray-500">({totalCount} total)</span>
        </h2>
        <div className="flex gap-2">
          <Button onClick={handleExportUsers} variant="outline" className="border-2 border-black">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadUsers} variant="outline" className="border-2 border-black">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border-2 border-black p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64 flex gap-2">
            <Input
              placeholder="Search by email or name..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="border-2 border-black"
            />
            <Button onClick={handleSearch} className="bg-black text-white hover:bg-gray-800">
              <Search className="w-4 h-4" />
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className={`border-2 ${showFilters ? 'border-black bg-gray-100' : 'border-gray-300'}`}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                className="w-full p-2 border-2 border-black rounded"
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
                className="w-full p-2 border-2 border-black rounded"
              >
                <option value="">All Plans</option>
                <option value="FREE">Free</option>
                <option value="STARTER">Starter</option>
                <option value="BASIC">Basic</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="PREMIUM">Premium</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-2 border-2 border-black rounded"
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

      {/* Users Table */}
      <div className="bg-white border-2 border-black overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-black">
                <tr>
                  <th className="text-left p-4 font-bold">User</th>
                  <th className="text-left p-4 font-bold">Role</th>
                  <th className="text-left p-4 font-bold">Plan</th>
                  <th className="text-center p-4 font-bold">Tokens</th>
                  <th className="text-center p-4 font-bold">Assignments</th>
                  <th className="text-left p-4 font-bold">Status</th>
                  <th className="text-right p-4 font-bold">Actions</th>
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
                        className={`text-sm px-2 py-1 rounded border ${
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
                      <span className="text-sm">{user.plan || 'FREE'}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="font-mono font-bold">{user.tokens}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-mono">{user._count?.assignments || 0}</span>
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
                          className="p-2 hover:bg-green-100 rounded text-green-600"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openTokenModal(user.id, 'deduct')}
                          title="Deduct tokens"
                          className="p-2 hover:bg-red-100 rounded text-red-600"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openTokenModal(user.id, 'reset')}
                          title="Reset tokens to plan default"
                          className="p-2 hover:bg-gray-100 rounded text-gray-600"
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
                            className="p-2 hover:bg-orange-100 rounded text-orange-600"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : user.status === 'suspended' ? (
                          <button
                            onClick={() => handleUnsuspendUser(user.id)}
                            title="Unsuspend user"
                            disabled={actionLoading === user.id}
                            className="p-2 hover:bg-green-100 rounded text-green-600"
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
            <h3 className="font-bold text-xl">{user.name || 'No name'}</h3>
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
            <p className="font-bold">{user.plan || 'FREE'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-500">Tokens</p>
            <p className="font-bold">{user.tokens}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-500">Assignments</p>
            <p className="font-bold">{user._count?.assignments || 0}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p><span className="text-gray-500">Status:</span> <StatusBadge status={user.status} /></p>
          <p><span className="text-gray-500">Created:</span> {new Date(user.createdAt).toLocaleString()}</p>
          <p><span className="text-gray-500">Last Login:</span> {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</p>
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
