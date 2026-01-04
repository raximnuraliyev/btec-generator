import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Search, RefreshCw, Scroll, Filter, ChevronLeft, ChevronRight,
  User, Shield, FileText, Coins, AlertCircle, Settings
} from 'lucide-react';

interface LogEntry {
  id: string;
  action: string;
  category: string;
  details: string;
  userId: string | null;
  user: {
    email: string;
    name: string | null;
  } | null;
  targetId: string | null;
  targetType: string | null;
  ipAddress: string | null;
  timestamp: string;
  metadata: Record<string, any> | null;
}

interface AuditLog {
  id: string;
  action: string;
  adminId: string;
  admin: {
    email: string;
    name: string | null;
  };
  targetUserId: string | null;
  targetUser: {
    email: string;
  } | null;
  details: string;
  reason: string | null;
  timestamp: string;
}

type LogType = 'system' | 'audit';

export function AdminLogsTab() {
  const [logType, setLogType] = useState<LogType>('system');
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    action: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [logType, currentPage]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        limit: 50
      };
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.action) params.action = filters.action;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      if (logType === 'system') {
        const response = await adminApi.getLogs(params);
        setSystemLogs(response.logs || []);
        setTotalPages(response.pagination?.totalPages || 1);
      } else {
        const response = await adminApi.getAuditLogs(params);
        setAuditLogs(response.logs || []);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadLogs();
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'auth': return <Shield className="w-4 h-4 text-blue-500" />;
      case 'user': return <User className="w-4 h-4 text-green-500" />;
      case 'assignment': return <FileText className="w-4 h-4 text-purple-500" />;
      case 'token': return <Coins className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'system': return <Settings className="w-4 h-4 text-gray-500" />;
      default: return <Scroll className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActionColor = (action: string) => {
    if (action?.includes('CREATE') || action?.includes('ADD')) return 'text-green-600';
    if (action?.includes('DELETE') || action?.includes('BAN') || action?.includes('REMOVE')) return 'text-red-600';
    if (action?.includes('UPDATE') || action?.includes('CHANGE')) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Scroll className="w-5 h-5" />
          System Logs
        </h2>
        <Button onClick={loadLogs} variant="outline" className="border-2 border-black">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Log Type Tabs */}
      <div className="flex border-b-2 border-black">
        <button
          onClick={() => { setLogType('system'); setCurrentPage(1); }}
          className={`px-6 py-3 font-medium transition-colors ${
            logType === 'system' ? 'bg-black text-white' : 'hover:bg-gray-100'
          }`}
        >
          System Logs
        </button>
        <button
          onClick={() => { setLogType('audit'); setCurrentPage(1); }}
          className={`px-6 py-3 font-medium transition-colors ${
            logType === 'audit' ? 'bg-black text-white' : 'hover:bg-gray-100'
          }`}
        >
          Audit Trail
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border-2 border-black p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64 flex gap-2">
            <Input
              placeholder="Search logs..."
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
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border-2 border-black rounded"
              >
                <option value="">All Categories</option>
                <option value="auth">Authentication</option>
                <option value="user">User</option>
                <option value="assignment">Assignment</option>
                <option value="token">Token</option>
                <option value="system">System</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Action</label>
              <Input
                placeholder="Filter by action..."
                value={filters.action}
                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                className="border-2 border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">From Date</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="border-2 border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="border-2 border-black"
              />
            </div>
          </div>
        )}
      </div>

      {/* Logs Display */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logType === 'system' ? (
        /* System Logs */
        <div className="bg-white border-2 border-black overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b-2 border-black">
                <tr>
                  <th className="text-left p-3 font-bold">Time</th>
                  <th className="text-left p-3 font-bold">Category</th>
                  <th className="text-left p-3 font-bold">Action</th>
                  <th className="text-left p-3 font-bold">User</th>
                  <th className="text-left p-3 font-bold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-xs">
                {systemLogs.length > 0 ? systemLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="p-3 whitespace-nowrap text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="flex items-center gap-2">
                        {getCategoryIcon(log.category)}
                        {log.category}
                      </span>
                    </td>
                    <td className={`p-3 font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </td>
                    <td className="p-3 text-gray-600">
                      {log.user?.email || log.userId || '-'}
                    </td>
                    <td className="p-3 max-w-md truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Audit Logs */
        <div className="bg-white border-2 border-black overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b-2 border-black">
                <tr>
                  <th className="text-left p-3 font-bold">Time</th>
                  <th className="text-left p-3 font-bold">Admin</th>
                  <th className="text-left p-3 font-bold">Action</th>
                  <th className="text-left p-3 font-bold">Target User</th>
                  <th className="text-left p-3 font-bold">Details</th>
                  <th className="text-left p-3 font-bold">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-xs">
                {auditLogs.length > 0 ? auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="p-3 whitespace-nowrap text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-yellow-700">
                        <Shield className="w-3 h-3" />
                        {log.admin?.email || 'System'}
                      </span>
                    </td>
                    <td className={`p-3 font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </td>
                    <td className="p-3 text-gray-600">
                      {log.targetUser?.email || '-'}
                    </td>
                    <td className="p-3 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="p-3 max-w-xs truncate text-gray-500" title={log.reason || ''}>
                      {log.reason || '-'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No audit logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
    </div>
  );
}

export default AdminLogsTab;
