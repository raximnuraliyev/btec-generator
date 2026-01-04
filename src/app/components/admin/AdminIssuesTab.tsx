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

export function AdminIssuesTab() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [responding, setResponding] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const handleRespond = async (issueId: string) => {
    if (!responseText.trim()) return;
    setActionLoading(issueId);
    try {
      await adminApi.respondToIssue(issueId, responseText);
      setResponseText('');
      setResponding(null);
      await loadIssues();
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
      await loadIssues();
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
      await loadIssues();
    } catch (error) {
      alert('Failed to reopen: ' + (error instanceof Error ? error.message : 'Unknown error'));
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

  const openCount = issues.filter(i => i.status === 'OPEN').length;
  const inProgressCount = issues.filter(i => i.status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Issue Management
          {openCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {openCount} open
            </span>
          )}
        </h2>
        <Button onClick={loadIssues} variant="outline" className="border-2 border-black">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex border-b-2 border-black">
        {[
          { value: 'OPEN', label: 'Open', count: openCount },
          { value: 'IN_PROGRESS', label: 'In Progress', count: inProgressCount },
          { value: 'RESOLVED', label: 'Resolved', count: issues.filter(i => i.status === 'RESOLVED').length },
          { value: '', label: 'All', count: issues.length }
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-6 py-3 font-medium transition-colors ${
              statusFilter === tab.value 
                ? 'bg-black text-white' 
                : 'hover:bg-gray-100'
            }`}
          >
            {tab.label}
            <span className="ml-2 text-sm opacity-60">({tab.count})</span>
          </button>
        ))}
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
        <div className="space-y-4">
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
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(issue.status)}
                    <div>
                      <h3 className="font-bold">{issue.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {issue.user?.email}
                        </span>
                        <span>•</span>
                        <span>{issue.category}</span>
                        <span>•</span>
                        <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs border rounded ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                    {expandedIssue === issue.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedIssue === issue.id && (
                <div className="border-t-2 border-gray-200">
                  {/* Description */}
                  <div className="p-4 bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                    <p className="whitespace-pre-wrap">{issue.description}</p>
                  </div>

                  {/* Admin Response */}
                  {issue.adminResponse && (
                    <div className="p-4 bg-blue-50 border-t border-blue-200">
                      <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Admin Response
                        {issue.respondedBy && (
                          <span className="text-xs text-blue-600">by {issue.respondedBy.email}</span>
                        )}
                      </h4>
                      <p className="text-blue-900 whitespace-pre-wrap">{issue.adminResponse}</p>
                    </div>
                  )}

                  {/* Response Form */}
                  {responding === issue.id && (
                    <div className="p-4 border-t border-gray-200">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Type your response..."
                        className="w-full p-3 border-2 border-black rounded resize-none h-32"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setResponding(null);
                            setResponseText('');
                          }}
                          className="border-2 border-black"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleRespond(issue.id)}
                          disabled={!responseText.trim() || actionLoading === issue.id}
                          className="bg-black text-white hover:bg-gray-800"
                        >
                          {actionLoading === issue.id ? 'Sending...' : 'Send Response'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
                    {issue.status !== 'RESOLVED' && responding !== issue.id && (
                      <Button
                        variant="outline"
                        onClick={() => setResponding(issue.id)}
                        className="border-2 border-black"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Respond
                      </Button>
                    )}
                    
                    {issue.status === 'OPEN' && (
                      <Button
                        onClick={() => handleResolve(issue.id)}
                        disabled={actionLoading === issue.id}
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {actionLoading === issue.id ? 'Processing...' : 'Mark Resolved'}
                      </Button>
                    )}
                    
                    {issue.status === 'RESOLVED' && (
                      <Button
                        variant="outline"
                        onClick={() => handleReopen(issue.id)}
                        disabled={actionLoading === issue.id}
                        className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
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
