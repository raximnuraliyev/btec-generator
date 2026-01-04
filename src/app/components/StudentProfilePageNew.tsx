import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  ArrowLeft, User, Mail, Building, MapPin, Users as UsersIcon,
  Coins, FileText, Calendar, Shield, Crown, Clock, Save,
  CheckCircle, AlertCircle, Activity
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tokens: number;
  plan: string | null;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  studentProfile: {
    fullName: string | null;
    universityName: string | null;
    faculty: string | null;
    groupName: string | null;
    city: string | null;
  } | null;
  _count?: {
    assignments: number;
  };
}

interface ActivitySummary {
  totalAssignments: number;
  completedAssignments: number;
  failedAssignments: number;
  tokensUsed: number;
  lastActivity: string | null;
  recentAssignments: {
    id: string;
    unitName: string;
    status: string;
    createdAt: string;
  }[];
}

interface ProfilePageProps {
  onBack: () => void;
}

export function StudentProfilePage({ onBack }: ProfilePageProps) {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activity, setActivity] = useState<ActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'account'>('profile');
  
  const [formData, setFormData] = useState({
    fullName: '',
    universityName: '',
    faculty: '',
    groupName: '',
    city: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadProfile();
    loadActivity();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.get('/api/student/profile') as UserProfile;
      setProfile(data);
      if (data.studentProfile) {
        setFormData({
          fullName: data.studentProfile.fullName || '',
          universityName: data.studentProfile.universityName || '',
          faculty: data.studentProfile.faculty || '',
          groupName: data.studentProfile.groupName || '',
          city: data.studentProfile.city || ''
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivity = async () => {
    try {
      const data = await api.get('/api/student/activity') as ActivitySummary;
      setActivity(data);
    } catch (error) {
      console.error('Failed to load activity:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/api/student/profile', formData);
      await refreshUser();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield className="w-5 h-5 text-yellow-500" />;
      case 'VIP': return <Crown className="w-5 h-5 text-purple-500" />;
      case 'TEACHER': return <UsersIcon className="w-5 h-5 text-blue-500" />;
      default: return <User className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /> Active</span>;
      case 'suspended':
        return <span className="flex items-center gap-1 text-orange-600"><AlertCircle className="w-4 h-4" /> Suspended</span>;
      case 'banned':
        return <span className="flex items-center gap-1 text-red-600"><AlertCircle className="w-4 h-4" /> Banned</span>;
      default:
        return <span className="text-gray-600">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold">My Profile</h1>
          </div>
        </div>
      </header>

      {/* Profile Card */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* User Summary Card */}
        <div className="bg-white border-2 border-black p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 border-2 border-black rounded-full flex items-center justify-center">
                {getRoleIcon(profile?.role || 'USER')}
              </div>
              <div>
                <h2 className="text-xl font-bold">{formData.fullName || profile?.name || 'No name set'}</h2>
                <p className="text-gray-500 flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {profile?.email}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-2 py-1 text-xs border rounded ${
                    profile?.role === 'ADMIN' ? 'border-yellow-500 bg-yellow-50 text-yellow-800' :
                    profile?.role === 'VIP' ? 'border-purple-500 bg-purple-50 text-purple-800' :
                    profile?.role === 'TEACHER' ? 'border-blue-500 bg-blue-50 text-blue-800' :
                    'border-gray-300 bg-gray-50'
                  }`}>
                    {profile?.role}
                  </span>
                  {getStatusBadge(profile?.status || 'active')}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-2xl font-bold">
                <Coins className="w-6 h-6 text-yellow-500" />
                {profile?.tokens || 0}
              </div>
              <p className="text-sm text-gray-500">tokens available</p>
              <p className="text-xs text-gray-400 mt-1">Plan: {profile?.plan || 'FREE'}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-black mb-6">
          {[
            { id: 'profile', label: 'Profile Info', icon: User },
            { id: 'activity', label: 'Activity', icon: Activity },
            { id: 'account', label: 'Account', icon: Shield }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-black text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="bg-white border-2 border-black p-6">
            <h3 className="font-bold text-lg mb-6">Academic Information</h3>
            
            {message && (
              <div className={`mb-4 p-3 rounded border-2 ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-500 text-green-800' 
                  : 'bg-red-50 border-red-500 text-red-800'
              }`}>
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="fullName" className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Your full name"
                  className="border-2 border-black"
                />
              </div>

              <div>
                <Label htmlFor="universityName" className="flex items-center gap-2 mb-2">
                  <Building className="w-4 h-4" />
                  University / College
                </Label>
                <Input
                  id="universityName"
                  value={formData.universityName}
                  onChange={(e) => setFormData(prev => ({ ...prev, universityName: e.target.value }))}
                  placeholder="Your institution"
                  className="border-2 border-black"
                />
              </div>

              <div>
                <Label htmlFor="faculty" className="flex items-center gap-2 mb-2">
                  <Building className="w-4 h-4" />
                  Faculty / Department
                </Label>
                <Input
                  id="faculty"
                  value={formData.faculty}
                  onChange={(e) => setFormData(prev => ({ ...prev, faculty: e.target.value }))}
                  placeholder="Your faculty or department"
                  className="border-2 border-black"
                />
              </div>

              <div>
                <Label htmlFor="groupName" className="flex items-center gap-2 mb-2">
                  <UsersIcon className="w-4 h-4" />
                  Group / Class
                </Label>
                <Input
                  id="groupName"
                  value={formData.groupName}
                  onChange={(e) => setFormData(prev => ({ ...prev, groupName: e.target.value }))}
                  placeholder="Your group or class name"
                  className="border-2 border-black"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="city" className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />
                  City
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Your city"
                  className="border-2 border-black"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-black text-white hover:bg-gray-800"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border-2 border-black p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">Total Assignments</span>
                </div>
                <p className="text-2xl font-bold">{activity?.totalAssignments || 0}</p>
              </div>
              <div className="bg-white border-2 border-black p-4">
                <div className="flex items-center gap-2 text-green-500 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Completed</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{activity?.completedAssignments || 0}</p>
              </div>
              <div className="bg-white border-2 border-black p-4">
                <div className="flex items-center gap-2 text-red-500 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Failed</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{activity?.failedAssignments || 0}</p>
              </div>
              <div className="bg-white border-2 border-black p-4">
                <div className="flex items-center gap-2 text-yellow-500 mb-1">
                  <Coins className="w-4 h-4" />
                  <span className="text-sm">Tokens Used</span>
                </div>
                <p className="text-2xl font-bold">{activity?.tokensUsed || 0}</p>
              </div>
            </div>

            {/* Recent Assignments */}
            <div className="bg-white border-2 border-black p-6">
              <h3 className="font-bold text-lg mb-4">Recent Assignments</h3>
              {activity?.recentAssignments && activity.recentAssignments.length > 0 ? (
                <div className="space-y-3">
                  {activity.recentAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{assignment.unitName}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(assignment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        assignment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        assignment.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        assignment.status === 'GENERATING' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100'
                      }`}>
                        {assignment.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No assignments yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="bg-white border-2 border-black p-6">
            <h3 className="font-bold text-lg mb-6">Account Information</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Email</span>
                </div>
                <span className="font-medium">{profile?.email}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Role</span>
                </div>
                <span className="font-medium">{profile?.role}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Current Plan</span>
                </div>
                <span className="font-medium">{profile?.plan || 'FREE'}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Account Created</span>
                </div>
                <span className="font-medium">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Last Login</span>
                </div>
                <span className="font-medium">
                  {profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Account Status</span>
                </div>
                {getStatusBadge(profile?.status || 'active')}
              </div>
            </div>

            {profile?.status === 'suspended' && (
              <div className="mt-6 p-4 bg-orange-50 border-2 border-orange-300 rounded">
                <p className="text-orange-800">
                  <strong>Account Suspended:</strong> Your account has been temporarily suspended. 
                  Please contact support if you believe this is a mistake.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentProfilePage;
