import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { AlertCircle, CheckCircle, Download, User, IdCard } from 'lucide-react';
import { studentsApi, StudentVerificationResponse } from '../services/api';

interface StudentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (student: StudentVerificationResponse['student'], studentId: string) => void;
  assignmentTitle: string;
}

export function StudentVerificationModal({
  isOpen,
  onClose,
  onVerified,
  assignmentTitle,
}: StudentVerificationModalProps) {
  const [fullName, setFullName] = useState('');
  const [studentIdCode, setStudentIdCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [verifiedStudent, setVerifiedStudent] = useState<StudentVerificationResponse['student'] | null>(null);
  const [downloadsInfo, setDownloadsInfo] = useState<{ used: number; remaining: number | string } | null>(null);

  const handleNameChange = (value: string) => {
    setFullName(value.toUpperCase());
    setError(null);
  };

  const handleIdChange = (value: string) => {
    setStudentIdCode(value.trim());
    setError(null);
  };

  const handleVerify = async () => {
    // Validation
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!studentIdCode.trim()) {
      setError('Please enter your student ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await studentsApi.verify({ 
        fullName: fullName.trim(),
        studentIdCode: studentIdCode.trim(),
      });

      if (response.success && response.student) {
        setVerified(true);
        setVerifiedStudent(response.student);
        setDownloadsInfo({
          used: response.downloadsUsed || 0,
          remaining: response.downloadsRemaining || 0,
        });
      } else {
        setError(response.message || 'Verification failed');
      }
    } catch (err: any) {
      // Parse error message from API
      if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to verify. Please check your information and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedDownload = () => {
    if (verifiedStudent) {
      onVerified(verifiedStudent, verifiedStudent.id);
    }
  };

  const handleClose = () => {
    setFullName('');
    setStudentIdCode('');
    setError(null);
    setVerified(false);
    setVerifiedStudent(null);
    setDownloadsInfo(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border-2 border-black">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <User className="w-5 h-5" />
            Student Verification
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Please verify your identity to download: <strong>{assignmentTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        {!verified ? (
          <div className="space-y-4 py-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2 font-medium">
                <User className="w-4 h-4" />
                Full Name (UPPERCASE) *
              </Label>
              <Input
                id="fullName"
                placeholder="SURNAME FIRSTNAME MIDDLENAME"
                value={fullName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="border-2 border-gray-300 focus:border-black uppercase"
                style={{ textTransform: 'uppercase' }}
              />
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Enter your name exactly as registered in the system</p>
                <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
                  <strong>Format example:</strong> KARIMOV OTABEK BAKHODIROVICH O'G'LI
                </p>
              </div>
            </div>

            {/* Student ID */}
            <div className="space-y-2">
              <Label htmlFor="studentId" className="flex items-center gap-2 font-medium">
                <IdCard className="w-4 h-4" />
                HEMIS ID (12 digits) *
              </Label>
              <Input
                id="studentId"
                placeholder="123456789012"
                value={studentIdCode}
                onChange={(e) => handleIdChange(e.target.value)}
                className="border-2 border-gray-300 focus:border-black"
                maxLength={20}
              />
              <p className="text-xs text-gray-500">Your 12-digit HEMIS student ID code</p>
            </div>

            {/* Download Limit Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> You can download <strong>1 assignment per day</strong>. 
                Make sure this is the assignment you need before downloading.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 border-2 border-black hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerify}
                disabled={isLoading}
                className="flex-1 bg-black text-white hover:bg-gray-800"
              >
                {isLoading ? 'Verifying...' : 'Verify Identity'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Success Message */}
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Identity Verified!</p>
                <p className="text-sm text-green-700">You can now download your assignment.</p>
              </div>
            </div>

            {/* Verified Info */}
            <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{verifiedStudent?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Student ID:</span>
                <span className="font-medium">{verifiedStudent?.studentIdCode}</span>
              </div>
              {downloadsInfo && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Downloads Today:</span>
                  <span className="font-medium">
                    {downloadsInfo.used} / {typeof downloadsInfo.remaining === 'string' ? '∞' : (downloadsInfo.used + Number(downloadsInfo.remaining))}
                  </span>
                </div>
              )}
            </div>

            {/* Download Button */}
            <Button
              onClick={handleProceedDownload}
              className="w-full bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Proceed to Download
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default StudentVerificationModal;
