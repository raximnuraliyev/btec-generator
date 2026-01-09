import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  ArrowLeft, AlertCircle, CheckCircle, Clock, Send,
  Plus, ChevronDown, ChevronUp, MessageSquare, ExternalLink,
  HelpCircle
} from 'lucide-react';

const DISCORD_INVITE_LINK = 'https://discord.gg/wjPGhY6X';

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  adminResponse: string | null;
  respondedAt: string | null;
}

interface SupportPageProps {
  onBack: () => void;
  onNavigate?: (page: string, assignmentId?: string) => void;
}

const CATEGORIES = [
  { value: 'GENERATION_ISSUE', label: 'Generation Issue' },
  { value: 'ACCOUNT_ISSUE', label: 'Account Problem' },
  { value: 'DOWNLOAD_ISSUE', label: 'Download Issue' },
  { value: 'BUG', label: 'Bug Report' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request' },
  { value: 'OTHER', label: 'Other' }
];

export function SupportPage({ onBack, onNavigate }: SupportPageProps) {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    category: 'OTHER',
    priority: 'MEDIUM'
  });

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      const response = await api.get('/issues') as { issues: Issue[] };
      setIssues(response.issues || []);
    } catch (error) {
      console.error('Failed to load issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssue.title.trim() || !newIssue.description.trim()) return;
    
    setSubmitting(true);
    try {
      await api.post('/issues', newIssue);
      setNewIssue({ title: '', description: '', category: 'OTHER', priority: 'MEDIUM' });
      setShowNewForm(false);
      await loadIssues();
    } catch (error) {
      alert('Failed to submit issue: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Open';
      case 'IN_PROGRESS': return 'In Progress';
      case 'RESOLVED': return 'Resolved';
      default: return status;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      HIGH: 'bg-red-100 text-red-800 border-red-300',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      LOW: 'bg-green-100 text-green-800 border-green-300'
    };
    return (
      <span className={`px-2 py-0.5 text-xs border rounded ${styles[priority] || 'bg-gray-100'}`}>
        {priority}
      </span>
    );
  };

  const openIssues = issues.filter(i => i.status !== 'RESOLVED');
  const resolvedIssues = issues.filter(i => i.status === 'RESOLVED');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-black">
        <div className="max-w-3xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4">
              <Button variant="ghost" onClick={onBack} className="min-h-[44px] min-w-[44px] p-2 md:px-4">
                <ArrowLeft className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline">Back</span>
              </Button>
              <h1 className="text-lg md:text-xl font-bold">Support & Issues</h1>
            </div>
            <div className="flex items-center gap-2">
              {onNavigate && (
                <Button 
                  variant="outline"
                  onClick={() => onNavigate('how-to-use')}
                  className="border-2 border-black min-h-[44px]"
                >
                  <HelpCircle className="w-4 h-4 md:mr-2" />
                  <span className="hidden sm:inline">FAQ</span>
                </Button>
              )}
              <Button 
                onClick={() => setShowNewForm(!showNewForm)}
                className="bg-black text-white hover:bg-gray-800 min-h-[44px]"
              >
                <Plus className="w-4 h-4 md:mr-2" />
                <span className="hidden sm:inline">New Issue</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4 md:py-8">
        {/* New Issue Form */}
        {showNewForm && (
          <div className="bg-white border-2 border-black p-4 md:p-6 mb-4 md:mb-6">
            <h2 className="font-bold text-base md:text-lg mb-4">Report an Issue</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newIssue.title}
                  onChange={(e) => setNewIssue(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the issue"
                  className="border-2 border-black mt-1 min-h-[44px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={newIssue.category}
                    onChange={(e) => setNewIssue(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 min-h-[44px] border-2 border-black rounded mt-1 text-base"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={newIssue.priority}
                    onChange={(e) => setNewIssue(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full p-2 min-h-[44px] border-2 border-black rounded mt-1 text-base"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newIssue.description}
                  onChange={(e) => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Please provide as much detail as possible..."
                  className="border-2 border-black mt-1 min-h-32 text-base"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewForm(false)}
                  className="border-2 border-black min-h-[44px] order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !newIssue.title.trim() || !newIssue.description.trim()}
                  className="bg-black text-white hover:bg-gray-800 min-h-[44px] order-1 sm:order-2"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? 'Submitting...' : 'Submit Issue'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Issues List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : issues.length === 0 ? (
          <div className="bg-white border-2 border-black p-6 md:p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="font-bold text-base md:text-lg mb-2">No Issues</h3>
            <p className="text-gray-500 mb-4 text-sm md:text-base">You haven't reported any issues yet.</p>
            <Button 
              onClick={() => setShowNewForm(true)}
              className="bg-black text-white hover:bg-gray-800 min-h-[44px]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Report an Issue
            </Button>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {/* Open Issues */}
            {openIssues.length > 0 && (
              <div>
                <h2 className="font-bold text-base md:text-lg mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  Open Issues ({openIssues.length})
                </h2>
                <div className="space-y-3">
                  {openIssues.map(issue => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      expanded={expandedIssue === issue.id}
                      onToggle={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                      getStatusIcon={getStatusIcon}
                      getStatusLabel={getStatusLabel}
                      getPriorityBadge={getPriorityBadge}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Resolved Issues */}
            {resolvedIssues.length > 0 && (
              <div>
                <h2 className="font-bold text-base md:text-lg mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Resolved ({resolvedIssues.length})
                </h2>
                <div className="space-y-3">
                  {resolvedIssues.map(issue => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      expanded={expandedIssue === issue.id}
                      onToggle={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                      getStatusIcon={getStatusIcon}
                      getStatusLabel={getStatusLabel}
                      getPriorityBadge={getPriorityBadge}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-6 md:mt-8 bg-gray-100 border-2 border-gray-300 p-4 md:p-6 rounded">
          <h3 className="font-bold mb-2 text-sm md:text-base">Need Help?</h3>
          <p className="text-gray-600 text-xs md:text-sm mb-4">
            Before submitting an issue, check if your question is answered in our FAQ or documentation.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button variant="outline" className="border-2 border-black text-sm min-h-[44px]">
              View FAQ
            </Button>
            <a href={DISCORD_INVITE_LINK} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-2 border-black text-sm flex items-center gap-2 min-h-[44px] w-full sm:w-auto">
                <ExternalLink className="w-4 h-4" />
                Discord Community
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function IssueCard({ 
  issue, 
  expanded, 
  onToggle,
  getStatusIcon,
  getStatusLabel,
  getPriorityBadge
}: { 
  issue: Issue;
  expanded: boolean;
  onToggle: () => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusLabel: (status: string) => string;
  getPriorityBadge: (priority: string) => React.ReactNode;
}) {
  return (
    <div className={`bg-white border-2 ${
      issue.status === 'RESOLVED' ? 'border-gray-300' : 'border-black'
    } overflow-hidden`}>
      {/* Header */}
      <div 
        className="p-3 md:p-4 cursor-pointer hover:bg-gray-50 min-h-[44px]"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 md:gap-3 min-w-0 flex-1">
            <div className="mt-1 flex-shrink-0">{getStatusIcon(issue.status)}</div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm md:text-base truncate">{issue.title}</h3>
              <div className="flex flex-wrap items-center gap-1 md:gap-3 mt-1 text-xs md:text-sm text-gray-500">
                <span>{CATEGORIES.find(c => c.value === issue.category)?.label || issue.category}</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">{new Date(issue.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <div className="hidden sm:block">{getPriorityBadge(issue.priority)}</div>
            <span className={`px-2 py-1 text-xs rounded ${
              issue.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
              issue.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              {getStatusLabel(issue.status)}
            </span>
            <div className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2">
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t-2 border-gray-200">
          <div className="p-3 md:p-4 bg-gray-50">
            <div className="sm:hidden mb-2">{getPriorityBadge(issue.priority)}</div>
            <h4 className="text-xs md:text-sm font-medium text-gray-500 mb-2">Your Message</h4>
            <p className="whitespace-pre-wrap text-gray-700 text-sm md:text-base">{issue.description}</p>
          </div>

          {issue.adminResponse && (
            <div className="p-3 md:p-4 bg-blue-50 border-t border-blue-200">
              <h4 className="text-xs md:text-sm font-medium text-blue-800 mb-2 flex flex-wrap items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Admin Response
                {issue.respondedAt && (
                  <span className="text-xs text-blue-600">
                    • {new Date(issue.respondedAt).toLocaleDateString()}
                  </span>
                )}
              </h4>
              <p className="text-blue-900 whitespace-pre-wrap text-sm md:text-base">{issue.adminResponse}</p>
            </div>
          )}

          {issue.status === 'OPEN' && !issue.adminResponse && (
            <div className="p-3 md:p-4 bg-yellow-50 border-t border-yellow-200">
              <p className="text-yellow-700 text-xs md:text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>Awaiting admin response. You will be notified when there's an update.</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SupportPage;
