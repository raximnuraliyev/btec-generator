import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Button } from '../ui/button';
import { 
  RefreshCw, AlertCircle, CheckCircle, Clock, 
  ChevronDown, ChevronUp, MessageSquare, User
} from 'lucide-react';

interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  assignmentId: string | null;
  adminResponse: string | null;
  respondedBy: {
    email: string;
  } | null;
}

interface IssueCounts {
  open: number;
  inProgress: number;
  resolved: number;
  total: number;
}

export function AdminIssuesTab() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [counts, setCounts] = useState<IssueCounts>({ open: 0, inProgress: 0, resolved: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [responding, setResponding] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load counts for all statuses (only once on mount and after actions)
  const loadCounts = async () => {
    try {
      const [allResponse] = await Promise.all([
        adminApi.getIssues({})
      ]);
      const allIssues = allResponse.issues || [];
      setCounts({
        open: allIssues.filter((i: Issue) => i.status === 'OPEN').length,
        inProgress: allIssues.filter((i: Issue) => i.status === 'IN_PROGRESS').length,
        resolved: allIssues.filter((i: Issue) => i.status === 'RESOLVED').length,
        total: allIssues.length
      });
    } catch (error) {
      console.error('Failed to load counts:', error);
    }
  };

  useEffect(() => {
    loadCounts();
  }, []);

  useEffect(() => {
    loadIssues();
  }, [statusFilter]);

  const loadIssues = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (statusFilter) params.status = statusFilter;
      
      const response = await adminApi.getIssues(params);
      setIssues(response.issues || []);
    } catch (error) {
      console.error('Failed to load issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([loadCounts(), loadIssues()]);
  };

  const handleRespond = async (issueId: string) => {
    if (!responseText.trim()) return;
    setActionLoading(issueId);
    try {
      await adminApi.respondToIssue(issueId, responseText);
      setResponseText('');
      setResponding(null);
      await refreshAll();
    } catch (error) {
      alert('Failed to respond: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (issueId: string) => {
    setActionLoading(issueId);
    try {
      await adminApi.resolveIssue(issueId);
      await refreshAll();
    } catch (error) {
      alert('Failed to resolve: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReopen = async (issueId: string) => {
    setActionLoading(issueId);
    try {
      await adminApi.reopenIssue(issueId);
      await refreshAll();
    } catch (error) {
      alert('Failed to reopen: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetInProgress = async (issueId: string) => {
    setActionLoading(issueId);
    try {
      await adminApi.setIssueInProgress(issueId);
      await refreshAll();
    } catch (error) {
      alert('Failed to set in progress: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'IN_PROGRESS': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'RESOLVED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Issue Management
          {counts.open > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {counts.open} open
            </span>
          )}
        </h2>
        <Button onClick={refreshAll} variant="outline" className="border-2 border-black min-h-[44px]">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Tabs - Scrollable on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex border-b-2 border-black min-w-max md:min-w-0">
          {[
            { value: 'OPEN', label: 'Open', count: counts.open },
            { value: 'IN_PROGRESS', label: 'In Progress', count: counts.inProgress },
            { value: 'RESOLVED', label: 'Resolved', count: counts.resolved },
            { value: '', label: 'All', count: counts.total }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 md:px-6 py-3 font-medium transition-colors min-h-[44px] whitespace-nowrap ${
                statusFilter === tab.value 
                  ? 'bg-black text-white' 
                  : 'hover:bg-gray-100'
              }`}
            >
              {tab.label}
              <span className="ml-1 md:ml-2 text-sm opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Issues List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No issues found</p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {issues.map(issue => (
            <div 
              key={issue.id} 
              className={`bg-white border-2 ${
                issue.status === 'OPEN' && issue.priority === 'HIGH' 
                  ? 'border-red-500' 
                  : 'border-black'
              } overflow-hidden`}
            >
              {/* Issue Header */}
              <div 
                className="p-3 md:p-4 cursor-pointer hover:bg-gray-50 min-h-[44px]"
                onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 md:gap-3 min-w-0 flex-1">
                    <div className="mt-1 flex-shrink-0">{getStatusIcon(issue.status)}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm md:text-base truncate">{issue.title}</h3>
                      <div className="flex flex-wrap items-center gap-1 md:gap-3 mt-1 text-xs md:text-sm text-gray-500">
                        <span className="flex items-center gap-1 truncate max-w-[150px] md:max-w-none">
                          <User className="w-3 h-3 flex-shrink-0" />
                          {issue.user?.email}
                        </span>
                        <span className="hidden md:inline">•</span>
                        <span>{issue.category}</span>
                        <span className="hidden md:inline">•</span>
                        <span className="hidden sm:inline">{new Date(issue.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-1 text-xs border rounded ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                    <div className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2">
                      {expandedIssue === issue.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedIssue === issue.id && (
                <div className="border-t-2 border-gray-200">
                  {/* Description */}
                  <div className="p-3 md:p-4 bg-gray-50">
                    <h4 className="text-xs md:text-sm font-medium text-gray-500 mb-2">Description</h4>
                    <p className="whitespace-pre-wrap text-sm md:text-base">{issue.description}</p>
                  </div>

                  {/* Admin Response */}
                  {issue.adminResponse && (
                    <div className="p-3 md:p-4 bg-blue-50 border-t border-blue-200">
                      <h4 className="text-xs md:text-sm font-medium text-blue-800 mb-2 flex flex-wrap items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Admin Response
                        {issue.respondedBy && (
                          <span className="text-xs text-blue-600">by {issue.respondedBy.email}</span>
                        )}
                      </h4>
                      <p className="text-blue-900 whitespace-pre-wrap text-sm md:text-base">{issue.adminResponse}</p>
                    </div>
                  )}

                  {/* Response Form */}
                  {responding === issue.id && (
                    <div className="p-3 md:p-4 border-t border-gray-200">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Type your response..."
                        className="w-full p-3 border-2 border-black rounded resize-none h-32 text-base"
                      />
                      <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setResponding(null);
                            setResponseText('');
                          }}
                          className="border-2 border-black min-h-[44px]"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleRespond(issue.id)}
                          disabled={!responseText.trim() || actionLoading === issue.id}
                          className="bg-black text-white hover:bg-gray-800 min-h-[44px]"
                        >
                          {actionLoading === issue.id ? 'Sending...' : 'Send Response'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="p-3 md:p-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-2">
                    {issue.status !== 'RESOLVED' && responding !== issue.id && (
                      <Button
                        variant="outline"
                        onClick={() => setResponding(issue.id)}
                        className="border-2 border-black min-h-[44px]"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Respond
                      </Button>
                    )}
                    
                    {issue.status === 'OPEN' && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleSetInProgress(issue.id)}
                          disabled={actionLoading === issue.id}
                          className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 min-h-[44px]"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          {actionLoading === issue.id ? 'Processing...' : 'Set In Progress'}
                        </Button>
                        <Button
                          onClick={() => handleResolve(issue.id)}
                          disabled={actionLoading === issue.id}
                          className="bg-green-600 text-white hover:bg-green-700 min-h-[44px]"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {actionLoading === issue.id ? 'Processing...' : 'Mark Resolved'}
                        </Button>
                      </>
                    )}
                    
                    {issue.status === 'IN_PROGRESS' && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleReopen(issue.id)}
                          disabled={actionLoading === issue.id}
                          className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 min-h-[44px]"
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          {actionLoading === issue.id ? 'Processing...' : 'Back to Open'}
                        </Button>
                        <Button
                          onClick={() => handleResolve(issue.id)}
                          disabled={actionLoading === issue.id}
                          className="bg-green-600 text-white hover:bg-green-700 min-h-[44px]"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {actionLoading === issue.id ? 'Processing...' : 'Mark Resolved'}
                        </Button>
                      </>
                    )}
                    
                    {issue.status === 'RESOLVED' && (
                      <Button
                        variant="outline"
                        onClick={() => handleReopen(issue.id)}
                        disabled={actionLoading === issue.id}
                        className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 min-h-[44px]"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {actionLoading === issue.id ? 'Processing...' : 'Reopen'}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminIssuesTab;
