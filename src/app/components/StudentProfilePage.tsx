import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  ArrowLeft, User, School, MapPin, Save,
  CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { studentsApi } from '../services/api';

interface Profile {
  fullName: string;
  universityName: string;
  faculty: string;
  groupName: string;
  city: string;
  academicYear?: string;
}

interface StudentProfilePageProps {
  onNavigate: (page: any) => void;
}

export default function StudentProfilePage({ onNavigate }: StudentProfilePageProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  const [profile, setProfile] = useState<Profile>({
    fullName: '',
    universityName: '',
    faculty: '',
    groupName: '',
    city: '',
    academicYear: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await studentsApi.getProfile();
      if (response.confirmed && response.profile) {
        setProfile(response.profile);
        setHasExisting(true);
      }
    } catch (err) {
      // Profile doesn't exist yet - that's fine
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!profile.fullName || !profile.universityName || !profile.faculty || !profile.groupName || !profile.city) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      await studentsApi.saveProfile(profile);
      setSuccess(true);
      setHasExisting(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-black">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => onNavigate('dashboard')}
              className="hover:bg-gray-100 min-h-[44px]"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <h1 className="text-lg md:text-xl font-bold">
              {hasExisting ? 'Update Academic Profile' : 'Complete Your Academic Profile'}
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        {/* Info Banner */}
        <div className="bg-white border-2 border-black p-4 mb-6">
          <p className="text-sm md:text-base text-gray-600">
            <strong>Why we need this:</strong> Your academic information is used to personalize your assignments. 
            This includes adding your name, university, and department to generated documents.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-2 border-green-500 p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700 font-medium text-sm md:text-base">Profile saved successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-500 p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 font-medium text-sm md:text-base">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Personal Information Section */}
          <div className="bg-white border-2 border-black mb-6">
            <div className="bg-black text-white px-4 py-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              <h2 className="font-bold">Personal Information</h2>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div>
                <Label htmlFor="fullName" className="text-sm font-bold mb-2 block">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  placeholder="Enter your full legal name"
                  className="border-2 border-black focus:ring-2 focus:ring-black min-h-[44px]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">This will appear on your assignments</p>
              </div>
            </div>
          </div>

          {/* Academic Information Section */}
          <div className="bg-white border-2 border-black mb-6">
            <div className="bg-black text-white px-4 py-3 flex items-center gap-2">
              <School className="w-5 h-5" />
              <h2 className="font-bold">Academic Information</h2>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div>
                <Label htmlFor="universityName" className="text-sm font-bold mb-2 block">
                  University/College Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="universityName"
                  value={profile.universityName}
                  onChange={(e) => setProfile({ ...profile, universityName: e.target.value })}
                  placeholder="e.g., Westminster International University"
                  className="border-2 border-black focus:ring-2 focus:ring-black min-h-[44px]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="faculty" className="text-sm font-bold mb-2 block">
                  Faculty/Department <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="faculty"
                  value={profile.faculty}
                  onChange={(e) => setProfile({ ...profile, faculty: e.target.value })}
                  placeholder="e.g., Faculty of Computing, Business School"
                  className="border-2 border-black focus:ring-2 focus:ring-black min-h-[44px]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="groupName" className="text-sm font-bold mb-2 block">
                  Group/Class Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="groupName"
                  value={profile.groupName}
                  onChange={(e) => setProfile({ ...profile, groupName: e.target.value })}
                  placeholder="e.g., Group A, CS-2024"
                  className="border-2 border-black focus:ring-2 focus:ring-black min-h-[44px]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="bg-white border-2 border-black mb-6">
            <div className="bg-black text-white px-4 py-3 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <h2 className="font-bold">Location</h2>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div>
                <Label htmlFor="city" className="text-sm font-bold mb-2 block">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  placeholder="e.g., Tashkent"
                  className="border-2 border-black focus:ring-2 focus:ring-black min-h-[44px]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="academicYear" className="text-sm font-bold mb-2 block">
                  Academic Year <span className="text-gray-400">(Optional)</span>
                </Label>
                <Input
                  id="academicYear"
                  value={profile.academicYear || ''}
                  onChange={(e) => setProfile({ ...profile, academicYear: e.target.value })}
                  placeholder="e.g., 2024/2025"
                  className="border-2 border-black focus:ring-2 focus:ring-black min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-gray-100 border-2 border-gray-300 p-4 mb-6">
            <p className="text-xs md:text-sm text-gray-600">
              <strong>🔒 Privacy Notice:</strong> Your profile information is encrypted and stored securely. 
              It is used only for personalizing your assignments and is never shared with third parties.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onNavigate('dashboard')}
              disabled={saving}
              className="border-2 border-black hover:bg-gray-100 min-h-[44px] w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={saving}
              className="bg-black text-white hover:bg-gray-800 px-8 min-h-[44px] w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
