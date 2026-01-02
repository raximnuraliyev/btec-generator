import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, AlertCircle, CheckCircle2, User, GraduationCap, School } from 'lucide-react';
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
    try {
      const response = await studentsApi.getProfile();
      if (response.confirmed && response.profile) {
        setProfile(response.profile);
        setHasExisting(true);
      }
    } catch (err) {
      // Profile doesn't exist yet
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!profile.fullName || !profile.universityName || !profile.faculty || !profile.groupName || !profile.city) {
      setError('Please fill in all required fields (Full Name, University, Faculty, Group/Class, City)');
      return;
    }

    try {
      setLoading(true);
      await studentsApi.saveProfile(profile);
      setSuccess(true);
      setTimeout(() => onNavigate('dashboard'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            {hasExisting ? 'Update Academic Profile' : 'Complete Your Academic Profile'}
          </CardTitle>
          <CardDescription>
            This information is required to generate personalized assignments. All fields are private and secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <User className="h-4 w-4" />
                Personal Information
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  placeholder="Enter your full legal name"
                  required
                />
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <School className="h-4 w-4" />
                Academic Information
              </div>

              <div className="space-y-2">
                <Label htmlFor="universityName">University/College Name *</Label>
                <Input
                  id="universityName"
                  value={profile.universityName}
                  onChange={(e) => setProfile({ ...profile, universityName: e.target.value })}
                  placeholder="Enter your institution name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="faculty">Faculty/Department *</Label>
                <Input
                  id="faculty"
                  value={profile.faculty}
                  onChange={(e) => setProfile({ ...profile, faculty: e.target.value })}
                  placeholder="e.g., Faculty of Computing, Business School"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupName">Group/Class Name *</Label>
                <Input
                  id="groupName"
                  value={profile.groupName}
                  onChange={(e) => setProfile({ ...profile, groupName: e.target.value })}
                  placeholder="e.g., Group A, Class 2024"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  placeholder="Your city"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year (Optional)</Label>
                <Input
                  id="academicYear"
                  value={profile.academicYear || ''}
                  onChange={(e) => setProfile({ ...profile, academicYear: e.target.value })}
                  placeholder="e.g., 2024/2025"
                />
              </div>
            </div>

            {/* Privacy Notice */}
            <Alert>
              <AlertDescription>
                <strong>Privacy:</strong> Your profile information is encrypted and stored securely. 
                It is used only for personalizing your assignments and is never shared with third parties.
              </AlertDescription>
            </Alert>

            {/* Error/Success Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Profile saved successfully! Redirecting...
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate('dashboard')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
