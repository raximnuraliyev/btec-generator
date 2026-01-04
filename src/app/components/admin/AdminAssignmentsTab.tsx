import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Search, RefreshCw, FileText, Download, Eye, 
  RotateCcw, XCircle, CheckCircle, Clock, AlertTriangle,
  ChevronLeft, ChevronRight, SlidersHorizontal, Play
} from 'lucide-react';

interface Assignment {
  id: string;
  status: string;
  grade: string;
  language: string;
  createdAt: string;
  completedAt: string | null;
  snapshot: {
    unitName: string;
    unitNumber: string;
    level: number;
  } | null;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  generationProgress?: number;
  errorMessage?: string;
}

interface Filters {
  search: string;
  status: string;
  grade: string;
  level: string;
  dateFrom: string;
  dateTo: string;
}

export function AdminAssignmentsTab() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    grade: '',
    level: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadAssignments();
    let interval: ReturnType<typeof setInterval>;
    if (autoRefresh) {
      interval = setInterval(loadAssignments, 10000); // 10 seconds for active monitoring
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentPage, filters.status, filters.grade, filters.level, autoRefresh]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        limit: 20
      };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.grade) params.grade = filters.grade;
      if (filters.level) params.level = filters.level;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const response = await adminApi.getAssignments(params);
      setAssignments(response.assignments || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalCount(response.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadAssignments();
  };

  const handleForceComplete = async (id: string) => {
    if (!confirm('Force complete this assignment? This may result in incomplete content.')) return;
    setActionLoading(id);
    try {
      await adminApi.forceCompleteAssignment(id);
      await loadAssignments();
    } catch (error) {
      alert('Failed to force complete: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegenerate = async (id: string) => {
    if (!confirm('Regenerate this assignment? This will start a fresh generation.')) return;
    setActionLoading(id);
    try {
      await adminApi.regenerateAssignment(id);
      await loadAssignments();
    } catch (error) {
      alert('Failed to regenerate: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this generation? The user will need to regenerate.')) return;
    setActionLoading(id);
    try {
      await adminApi.cancelAssignment(id);
      await loadAssignments();
    } catch (error) {
      alert('Failed to cancel: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await adminApi.exportAssignments(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assignments-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export assignments');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'GENERATING': return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'DRAFT': return <FileText className="w-4 h-4 text-gray-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Assignment Management
          <span className="text-sm font-normal text-gray-500">({totalCount} total)</span>
        </h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            Auto-refresh (10s)
          </label>
          <Button onClick={handleExport} variant="outline" className="border-2 border-black">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadAssignments} variant="outline" className="border-2 border-black">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        {['GENERATING', 'COMPLETED', 'FAILED', 'DRAFT'].map(status => {
          const count = assignments.filter(a => a.status === status).length;
          return (
            <button
              key={status}
              onClick={() => {
                setFilters(prev => ({ ...prev, status: prev.status === status ? '' : status }));
                setCurrentPage(1);
              }}
              className={`p-4 border-2 text-left transition-all ${
                filters.status === status 
                  ? 'border-black bg-gray-100' 
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(status)}
                <span className="text-2xl font-bold">{count}</span>
              </div>
              <p className="text-sm text-gray-600">{status}</p>
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="bg-white border-2 border-black p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64 flex gap-2">
            <Input
              placeholder="Search by unit name or user email..."
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
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-2 border-2 border-black rounded"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="GENERATING">Generating</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Grade</label>
              <select
                value={filters.grade}
                onChange={(e) => setFilters(prev => ({ ...prev, grade: e.target.value }))}
                className="w-full p-2 border-2 border-black rounded"
              >
                <option value="">All Grades</option>
                <option value="Pass">Pass</option>
                <option value="Merit">Merit</option>
                <option value="Distinction">Distinction</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Level</label>
              <select
                value={filters.level}
                onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                className="w-full p-2 border-2 border-black rounded"
              >
                <option value="">All Levels</option>
                <option value="3">Level 3</option>
                <option value="4">Level 4</option>
                <option value="5">Level 5</option>
                <option value="6">Level 6</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date Range</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="border-2 border-black"
                />
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="border-2 border-black"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assignments Table */}
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
                  <th className="text-left p-4 font-bold">Assignment</th>
                  <th className="text-left p-4 font-bold">User</th>
                  <th className="text-center p-4 font-bold">Level</th>
                  <th className="text-center p-4 font-bold">Grade</th>
                  <th className="text-center p-4 font-bold">Status</th>
                  <th className="text-left p-4 font-bold">Created</th>
                  <th className="text-right p-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="max-w-xs">
                        <p className="font-medium truncate">
                          {assignment.snapshot?.unitName || 'Untitled'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Unit {assignment.snapshot?.unitNumber || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{assignment.user?.email || 'Unknown'}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full font-bold">
                        {assignment.snapshot?.level || '?'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <GradeBadge grade={assignment.grade} />
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <StatusBadge status={assignment.status} />
                        {assignment.status === 'GENERATING' && assignment.generationProgress !== undefined && (
                          <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${assignment.generationProgress}%` }}
                            />
                          </div>
                        )}
                        {assignment.status === 'FAILED' && assignment.errorMessage && (
                          <p className="text-xs text-red-500 max-w-32 truncate" title={assignment.errorMessage}>
                            {assignment.errorMessage}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{new Date(assignment.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">{new Date(assignment.createdAt).toLocaleTimeString()}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        {assignment.status === 'GENERATING' && (
                          <>
                            <button
                              onClick={() => handleForceComplete(assignment.id)}
                              title="Force complete"
                              disabled={actionLoading === assignment.id}
                              className="p-2 hover:bg-green-100 rounded text-green-600"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCancel(assignment.id)}
                              title="Cancel generation"
                              disabled={actionLoading === assignment.id}
                              className="p-2 hover:bg-red-100 rounded text-red-600"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {assignment.status === 'FAILED' && (
                          <button
                            onClick={() => handleRegenerate(assignment.id)}
                            title="Regenerate"
                            disabled={actionLoading === assignment.id}
                            className="p-2 hover:bg-blue-100 rounded text-blue-600"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        {assignment.status === 'COMPLETED' && (
                          <button
                            onClick={() => handleRegenerate(assignment.id)}
                            title="Regenerate"
                            disabled={actionLoading === assignment.id}
                            className="p-2 hover:bg-blue-100 rounded text-blue-600"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedAssignment(assignment)}
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

      {/* Assignment Detail Modal */}
      {selectedAssignment && (
        <AssignmentDetailModal 
          assignment={selectedAssignment} 
          onClose={() => setSelectedAssignment(null)} 
        />
      )}
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const styles: Record<string, string> = {
    Pass: 'bg-green-100 text-green-800 border-green-300',
    Merit: 'bg-blue-100 text-blue-800 border-blue-300',
    Distinction: 'bg-purple-100 text-purple-800 border-purple-300',
  };

  return (
    <span className={`px-2 py-1 text-xs border rounded ${styles[grade] || 'bg-gray-100'}`}>
      {grade}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    GENERATING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 text-xs rounded ${styles[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
}

function AssignmentDetailModal({ assignment, onClose }: { assignment: Assignment; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white border-2 border-black p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-xl">{assignment.snapshot?.unitName || 'Untitled'}</h3>
            <p className="text-gray-500">Unit {assignment.snapshot?.unitNumber}</p>
          </div>
          <button onClick={onClose} className="text-2xl hover:text-gray-500">&times;</button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-500">Status</p>
            <StatusBadge status={assignment.status} />
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-500">Grade</p>
            <GradeBadge grade={assignment.grade} />
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-500">Level</p>
            <p className="font-bold">{assignment.snapshot?.level}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-500">Language</p>
            <p className="font-bold">{assignment.language || 'en'}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded mb-6">
          <p className="text-sm text-gray-500 mb-2">User</p>
          <p className="font-medium">{assignment.user?.email}</p>
          <p className="text-sm text-gray-500">{assignment.user?.name || 'No name'}</p>
        </div>

        <div className="space-y-2 text-sm">
          <p><span className="text-gray-500">Created:</span> {new Date(assignment.createdAt).toLocaleString()}</p>
          {assignment.completedAt && (
            <p><span className="text-gray-500">Completed:</span> {new Date(assignment.completedAt).toLocaleString()}</p>
          )}
          {assignment.errorMessage && (
            <div className="bg-red-50 p-3 rounded border border-red-200 mt-4">
              <p className="text-red-800 font-medium">Error Message:</p>
              <p className="text-red-600 text-sm mt-1">{assignment.errorMessage}</p>
            </div>
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

export default AdminAssignmentsTab;
