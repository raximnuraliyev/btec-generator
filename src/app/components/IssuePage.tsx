import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  Bug,
  Lightbulb,
  FileWarning,
  Download,
  User,
  HelpCircle,
  Upload,
  X,
  Send,
  Clock,
  CheckCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Image,
} from 'lucide-react';

type Page = 'login' | 'dashboard' | 'how-to-use' | 'create' | 'monitor' | 'review' | 'admin' | 'issues';

interface IssuePageProps {
  onNavigate: (page: Page) => void;
}

type IssueCategory =
  | 'BUG'
  | 'FEATURE_REQUEST'
  | 'GENERATION_ISSUE'
  | 'DOWNLOAD_ISSUE'
  | 'ACCOUNT_ISSUE'
  | 'OTHER';

type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  screenshot: string | null;
  status: IssueStatus;
  priority: string;
  adminResponse: string | null;
  createdAt: string;
  updatedAt: string;
}

const categoryOptions: { value: IssueCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'BUG', label: 'Bug Report', icon: <Bug className="w-5 h-5" />, color: 'text-red-500' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request', icon: <Lightbulb className="w-5 h-5" />, color: 'text-yellow-500' },
  { value: 'GENERATION_ISSUE', label: 'Generation Problem', icon: <FileWarning className="w-5 h-5" />, color: 'text-orange-500' },
  { value: 'DOWNLOAD_ISSUE', label: 'Download Issue', icon: <Download className="w-5 h-5" />, color: 'text-blue-500' },
  { value: 'ACCOUNT_ISSUE', label: 'Account Problem', icon: <User className="w-5 h-5" />, color: 'text-purple-500' },
  { value: 'OTHER', label: 'Other', icon: <HelpCircle className="w-5 h-5" />, color: 'text-gray-500' },
];

const statusConfig: Record<IssueStatus, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'Open', color: 'text-blue-600', bg: 'bg-blue-100' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  RESOLVED: { label: 'Resolved', color: 'text-green-600', bg: 'bg-green-100' },
  CLOSED: { label: 'Closed', color: 'text-gray-600', bg: 'bg-gray-100' },
};

export function IssuePage({ onNavigate }: IssuePageProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('BUG');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const getToken = () => localStorage.getItem('btec_token');

  // Fetch user's issues
  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    const token = getToken();
    if (!token) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/issues', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIssues(data.issues || []);
      }
    } catch (err) {
      console.error('Failed to fetch issues:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle screenshot upload
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshot(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Submit issue
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    if (!description.trim()) {
      setError('Please describe your issue');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = getToken();
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          screenshot,
        }),
      });

      if (response.ok) {
        setSuccess('Issue submitted successfully! Link your Discord account to receive updates when your issue is resolved.');
        setTitle('');
        setDescription('');
        setCategory('BUG');
        setScreenshot(null);
        setShowForm(false);
        fetchIssues();
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit issue');
      }
    } catch (err) {
      setError('Failed to submit issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryInfo = (cat: IssueCategory) => {
    return categoryOptions.find(c => c.value === cat) || categoryOptions[5];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Support & Issues</h1>
              <p className="text-sm text-gray-500">Report problems or request features</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowForm(!showForm)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showForm
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {showForm ? 'Cancel' : 'New Issue'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* New Issue Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-gray-700" />
              Submit New Issue
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Issue Category
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categoryOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCategory(opt.value)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        category === opt.value
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`${opt.color} mb-2`}>{opt.icon}</div>
                      <span className="font-medium text-sm">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of the issue"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all"
                  maxLength={100}
                />
                <p className="mt-1 text-xs text-gray-500">{title.length}/100 characters</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide details about the issue. Include steps to reproduce if it's a bug."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all resize-none"
                  maxLength={2000}
                />
                <p className="mt-1 text-xs text-gray-500">{description.length}/2000 characters</p>
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Screenshot (optional)
                </label>
                
                {screenshot ? (
                  <div className="relative inline-block">
                    <img
                      src={screenshot}
                      alt="Screenshot preview"
                      className="max-w-md max-h-64 rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setScreenshot(null)}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Click to upload screenshot</p>
                    <p className="text-gray-400 text-sm mt-1">PNG, JPG up to 5MB</p>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Issue
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Issues List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Issues ({issues.length})
          </h2>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading issues...</p>
            </div>
          ) : issues.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">No issues yet</h3>
              <p className="text-gray-500 mb-6">
                Having problems? Click "New Issue" to report them.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Submit First Issue
              </button>
            </div>
          ) : (
            issues.map((issue) => {
              const catInfo = getCategoryInfo(issue.category);
              const statusInfo = statusConfig[issue.status];
              const isExpanded = expandedIssue === issue.id;

              return (
                <div
                  key={issue.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-md"
                >
                  {/* Issue Header */}
                  <div
                    onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                    className="p-4 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`${catInfo.color} flex-shrink-0`}>
                        {catInfo.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{issue.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500">{catInfo.label}</span>
                          <span className="text-xs text-gray-300">•</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(issue.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                      <div className="prose prose-sm max-w-none">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                        <p className="text-gray-600 whitespace-pre-wrap">{issue.description}</p>
                      </div>

                      {/* Screenshot */}
                      {issue.screenshot && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Image className="w-4 h-4" />
                            Attached Screenshot
                          </h4>
                          <img
                            src={issue.screenshot}
                            alt="Issue screenshot"
                            className="max-w-md max-h-64 rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(issue.screenshot!, '_blank')}
                          />
                        </div>
                      )}

                      {/* Admin Response */}
                      {issue.adminResponse && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Admin Response
                          </h4>
                          <p className="text-blue-800 whitespace-pre-wrap">{issue.adminResponse}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
