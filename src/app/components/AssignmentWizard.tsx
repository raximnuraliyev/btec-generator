import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { studentsApi, briefsApi, assignmentsApi } from '../services/api';
import { useAssignments } from '../context/AssignmentContext';

interface Brief {
  id: string;
  unitName: string;
  unitCode: string;
  level: number;
  vocationalScenario: string;
  subjectName?: string;
  semester?: string;
  status?: string;
}

interface StudentProfile {
  confirmed: boolean;
  profile?: {
    fullName: string;
    universityName: string;
  };
}

interface AssignmentWizardProps {
  onNavigate: (page: any, assignmentId?: string) => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'uz', name: 'Uzbek', nativeName: "O'zbekcha" },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
];

const GRADES = ['PASS', 'MERIT', 'DISTINCTION'];

export default function AssignmentWizard({ onNavigate }: AssignmentWizardProps) {
  const { fetchAssignments } = useAssignments();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Profile check
  const [profileChecked, setProfileChecked] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [profile, setProfile] = useState<StudentProfile['profile']>();

  // Form state
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [includeImages, setIncludeImages] = useState(false);
  const [includeTables, setIncludeTables] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  // Check profile on mount
  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      const response = await studentsApi.getProfile();
      setHasProfile(response.confirmed);
      setProfile(response.profile);
      setProfileChecked(true);
    } catch (err) {
      setProfileChecked(true);
      setHasProfile(false);
    }
  };

  // Load briefs when level is selected
  useEffect(() => {
    if (selectedLevel) {
      loadBriefs(selectedLevel);
    }
  }, [selectedLevel]);

  const loadBriefs = async (level: number) => {
    try {
      setLoading(true);
      const briefs = await briefsApi.getBriefs({ level });
      setBriefs(briefs);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load briefs');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!disclaimerAccepted) {
      setError('You must accept the educational disclaimer to proceed');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Check if the selected brief has required inputs
      const selectedBriefObj = briefs.find(b => b.id === selectedBrief);
      
      // First, create the assignment (this will be in DRAFT status)
      const createResponse = await assignmentsApi.createFromBrief({
        briefId: selectedBrief,
        targetGrade: selectedGrade as 'PASS' | 'MERIT' | 'DISTINCTION',
        language: selectedLanguage,
      });

      // Refresh assignments to include the newly created one
      await fetchAssignments();

      // Check if the brief has required inputs by checking the response
      // If briefSnapshot has requiredInputs, navigate to student inputs page
      const assignment = createResponse.assignment as any;
      const hasRequiredInputs = assignment?.briefSnapshot?.requiredInputs?.length > 0;

      if (hasRequiredInputs) {
        // Navigate to student inputs page
        onNavigate('student-inputs', createResponse.assignment.id);
      } else {
        // No inputs required - start generation directly via the legacy flow
        // But since we already created the assignment, use startGeneration
        try {
          await assignmentsApi.startGeneration(createResponse.assignment.id);
          onNavigate('monitor', createResponse.assignment.id);
        } catch (genErr: any) {
          // If startGeneration fails, fall back to monitor (assignment already exists)
          console.error('Start generation failed:', genErr);
          onNavigate('monitor', createResponse.assignment.id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  if (!profileChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must complete your academic profile before generating assignments.
            <Button
              className="ml-4"
              onClick={() => onNavigate('profile')}
            >
              Complete Profile
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const selectedBriefData = briefs.find((b) => b.id === selectedBrief);

  // Calculate total steps for progress
  const totalSteps = 6;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Progress Bar - Fixed at top */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm sm:hidden">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {step} of {totalSteps}</span>
            <button 
              onClick={() => onNavigate('dashboard')} 
              className="text-sm text-gray-600 hover:text-black min-h-[44px] px-2"
            >
              Cancel
            </button>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div 
              className="bg-black h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-4 sm:py-8">
        {/* Desktop Back Button */}
        <div className="hidden sm:block mb-4">
          <Button
            variant="outline"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        <Card>
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl sm:text-2xl">Generate Assignment Guide</CardTitle>
                <CardDescription className="text-sm sm:text-base mt-1">
                  Follow the steps to create your personalized teaching guide
                </CardDescription>
              </div>
              {/* Desktop progress indicator */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-gray-600">Step {step} of {totalSteps}</span>
                <div className="w-24 bg-gray-200 h-2 rounded-full">
                  <div 
                    className="bg-black h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(step / totalSteps) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 sm:space-y-8 pb-6 sm:pb-8">
            {/* Step 1: Select Level */}
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                {step > 1 && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />}
                <Label className="text-base sm:text-lg font-semibold">Step 1: Select Level</Label>
              </div>
              {step >= 1 && (
                <RadioGroup
                  value={selectedLevel?.toString() || ''}
                  onValueChange={(value) => {
                    setSelectedLevel(parseInt(value));
                    setSelectedBrief('');
                    if (step === 1) setStep(2);
                  }}
                >
                  {/* Mobile: 2 columns, Desktop: 4 columns */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {[3, 4, 5, 6].map((level) => (
                      <div key={level} className="flex items-center space-x-2 border rounded p-3 min-h-[44px]">
                        <RadioGroupItem value={level.toString()} id={`level-${level}`} />
                        <Label htmlFor={`level-${level}`} className="cursor-pointer flex-1">Level {level}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </div>

          {/* Step 2: Select Brief */}
          {step >= 2 && selectedLevel && (
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                {step > 2 && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />}
                <Label className="text-base sm:text-lg font-semibold">Step 2: Select Brief</Label>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : briefs.length === 0 ? (
                <Alert>
                  <AlertDescription>No briefs available for Level {selectedLevel}</AlertDescription>
                </Alert>
              ) : (
                <RadioGroup
                  value={selectedBrief}
                  onValueChange={(value) => {
                    setSelectedBrief(value);
                    if (step === 2) setStep(3);
                  }}
                >
                  <div className="space-y-3">
                    {briefs.map((brief) => (
                      <div key={brief.id} className="flex items-start space-x-3 border rounded p-3 sm:p-4 min-h-[44px]">
                        <RadioGroupItem value={brief.id} id={`brief-${brief.id}`} className="mt-1" />
                        <Label htmlFor={`brief-${brief.id}`} className="flex-1 cursor-pointer">
                          <div className="font-semibold text-sm sm:text-base">{brief.unitName}</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">{brief.unitCode}</div>
                          <div className="text-xs sm:text-sm mt-2 line-clamp-3">{brief.vocationalScenario?.substring(0, 150) || 'No scenario available'}...</div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </div>
          )}

          {/* Step 3: Select Grade */}
          {step >= 3 && selectedBrief && (
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                {step > 3 && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />}
                <Label className="text-base sm:text-lg font-semibold">Step 3: Select Grade Target</Label>
              </div>
              <RadioGroup
                value={selectedGrade}
                onValueChange={(value) => {
                  setSelectedGrade(value);
                  if (step === 3) setStep(4);
                }}
              >
                {/* Mobile: stacked, Desktop: 3 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {GRADES.map((grade) => (
                    <div key={grade} className="flex items-center space-x-2 border rounded p-3 min-h-[44px]">
                      <RadioGroupItem value={grade} id={`grade-${grade}`} />
                      <Label htmlFor={`grade-${grade}`} className="cursor-pointer flex-1">{grade}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Step 4: Select Language */}
          {step >= 4 && selectedGrade && (
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                {step > 4 && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />}
                <Label className="text-base sm:text-lg font-semibold">Step 4: Assignment Language (Required)</Label>
              </div>
              <Alert className="mb-4">
                <AlertDescription className="text-sm">
                  All content will be generated natively in the selected language. This is NOT a translation.
                </AlertDescription>
              </Alert>
              <RadioGroup
                value={selectedLanguage}
                onValueChange={(value) => {
                  setSelectedLanguage(value);
                  if (step === 4) setStep(5);
                }}
              >
                {/* Mobile: stacked, Desktop: 2 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {LANGUAGES.map((lang) => (
                    <div key={lang.code} className="flex items-center space-x-3 border rounded p-3 min-h-[44px]">
                      <RadioGroupItem value={lang.code} id={`lang-${lang.code}`} />
                      <Label htmlFor={`lang-${lang.code}`} className="cursor-pointer flex-1">
                        <div className="font-semibold text-sm sm:text-base">{lang.nativeName}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">{lang.name}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Step 5: Content Options */}
          {step >= 5 && selectedLanguage && (
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Label className="text-base sm:text-lg font-semibold">Step 5: Content Options</Label>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start sm:items-center space-x-3 border rounded p-3 min-h-[44px]">
                  <Checkbox
                    id="includeTables"
                    checked={includeTables}
                    onCheckedChange={(checked) => setIncludeTables(checked as boolean)}
                    className="mt-0.5 sm:mt-0"
                  />
                  <Label htmlFor="includeTables" className="cursor-pointer text-sm sm:text-base">
                    Include structured tables (for comparisons, checklists, summaries)
                  </Label>
                </div>
                <div className="flex items-start sm:items-center space-x-3 border rounded p-3 min-h-[44px]">
                  <Checkbox
                    id="includeImages"
                    checked={includeImages}
                    onCheckedChange={(checked) => setIncludeImages(checked as boolean)}
                    className="mt-0.5 sm:mt-0"
                  />
                  <Label htmlFor="includeImages" className="cursor-pointer text-sm sm:text-base">
                    Include image placeholders (with academic captions)
                  </Label>
                </div>
              </div>
              {step === 5 && (
                <Button className="mt-4 w-full sm:w-auto min-h-[44px]" onClick={() => setStep(6)}>
                  Continue to Disclaimer
                </Button>
              )}
            </div>
          )}

          {/* Step 6: Disclaimer */}
          {step >= 6 && (
            <div>
              <Label className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 block">Step 6: Educational Disclaimer</Label>
              <Alert className="mb-4">
                <AlertDescription>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Educational Guidance Only</p>
                    <p>This platform is provided for educational guidance only.</p>
                    <p>The generated materials are learning aids, not final submissions.</p>
                    <p className="font-semibold">
                      Responsibility for academic integrity lies solely with the student.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
              <div className="flex items-start sm:items-center space-x-3 border rounded p-3 min-h-[44px]">
                <Checkbox
                  id="disclaimer"
                  checked={disclaimerAccepted}
                  onCheckedChange={(checked) => setDisclaimerAccepted(checked as boolean)}
                  className="mt-0.5 sm:mt-0"
                />
                <Label htmlFor="disclaimer" className="cursor-pointer text-sm sm:text-base">
                  I understand and agree to these terms
                </Label>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Generate Button */}
          {step >= 6 && (
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => onNavigate('dashboard')}
                className="w-full sm:w-auto min-h-[44px] order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!disclaimerAccepted || loading}
                className="w-full sm:w-auto min-h-[44px] order-1 sm:order-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Teaching Guide'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
