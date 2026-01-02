import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Plus, Trash2, Save, ArrowLeft, CheckCircle2, AlertCircle, 
  FileText, GraduationCap, Target, ClipboardCheck 
} from 'lucide-react';
import { briefsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface TaskBlock {
  title: string;
  description: string;
}

interface CriterionItem {
  code: string; // e.g., "A.P1", "B.P3", "A.M1"
  description: string;
}

interface AssessmentCriteria {
  pass: CriterionItem[];
  merit: CriterionItem[];
  distinction: CriterionItem[];
}

interface BriefFormData {
  subjectName: string;
  unitName: string;
  unitCode: string;
  level: 3 | 4 | 5 | 6;
  semester: '1' | '2';
  learningAims: string[];
  vocationalScenario: string;
  tasks: TaskBlock[];
  assessmentCriteria: AssessmentCriteria;
  checklistOfEvidence: string[];
  sourcesOfInformation: string[];
}

interface BriefCreationPageProps {
  onNavigate: (page: 'briefs' | 'teacher') => void;
  editBriefId?: string;
}

export function BriefCreationPage({ onNavigate, editBriefId }: BriefCreationPageProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Check if user has permission to create briefs
  if (user && user.role !== 'TEACHER' && user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Only teachers and administrators can create briefs. Please contact your administrator for access.
            </p>
            <Button onClick={() => onNavigate('briefs')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Briefs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [formData, setFormData] = useState<BriefFormData>({
    subjectName: '',
    unitName: '',
    unitCode: '',
    level: 3,
    semester: '1',
    learningAims: [''],
    vocationalScenario: '',
    tasks: [{ title: '', description: '' }],
    assessmentCriteria: {
      pass: [{ code: 'A.P1', description: '' }],
      merit: [{ code: 'A.M1', description: '' }],
      distinction: [{ code: 'A.D1', description: '' }],
    },
    checklistOfEvidence: [''],
    sourcesOfInformation: [''],
  });

  // Validation function
  const validateBrief = (): string[] => {
    const errors: string[] = [];

    if (!formData.subjectName.trim()) errors.push('Subject Name is required');
    if (!formData.unitName.trim()) errors.push('Unit Name is required');
    if (!formData.unitCode.trim()) errors.push('Unit Code is required');
    if (!formData.vocationalScenario.trim()) errors.push('Vocational Scenario is required');
    
    const validAims = formData.learningAims.filter(a => a.trim());
    if (validAims.length === 0) errors.push('At least one Learning Aim is required');
    
    const validPassCriteria = formData.assessmentCriteria.pass.filter(c => c.description.trim());
    if (validPassCriteria.length === 0) errors.push('At least one Pass criterion is required');
    
    const validTasks = formData.tasks.filter(t => t.title.trim() && t.description.trim());
    if (validTasks.length === 0) errors.push('At least one Task is required');

    return errors;
  };

  const handleSaveDraft = async () => {
    const errors = validateBrief();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setLoading(true);
      setValidationErrors([]);
      
      // Clean data - convert to backend format
      const cleanedData = {
        subjectName: formData.subjectName,
        unitName: formData.unitName,
        unitCode: formData.unitCode,
        level: formData.level,
        semester: formData.semester,
        learningAims: formData.learningAims.filter(a => a.trim()),
        vocationalScenario: formData.vocationalScenario,
        tasks: formData.tasks.filter(t => t.title.trim() && t.description.trim()).map(t => ({
          title: t.title,
          description: t.description
        })),
        assessmentCriteria: {
          pass: formData.assessmentCriteria.pass.filter(c => c.description.trim()).map(c => `${c.code}: ${c.description}`),
          merit: formData.assessmentCriteria.merit.filter(c => c.description.trim()).map(c => `${c.code}: ${c.description}`),
          distinction: formData.assessmentCriteria.distinction.filter(c => c.description.trim()).map(c => `${c.code}: ${c.description}`),
        },
        checklistOfEvidence: formData.checklistOfEvidence.filter(e => e.trim()),
        sourcesOfInformation: formData.sourcesOfInformation.filter(s => s.trim()),
        status: 'DRAFT',
      };

      if (editBriefId) {
        await briefsApi.updateBrief(editBriefId, cleanedData);
        toast.success('Brief saved as draft');
      } else {
        await briefsApi.createBrief(cleanedData);
        toast.success('Brief created as draft');
      }
      
      onNavigate('briefs');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save brief');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    const errors = validateBrief();
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error('Please fix all validation errors before publishing');
      return;
    }

    if (!confirm('Are you sure you want to publish this brief? Once published, it cannot be edited.')) {
      return;
    }

    try {
      setLoading(true);
      setValidationErrors([]);
      
      const cleanedData = {
        subjectName: formData.subjectName,
        unitName: formData.unitName,
        unitCode: formData.unitCode,
        level: formData.level,
        semester: formData.semester,
        learningAims: formData.learningAims.filter(a => a.trim()),
        vocationalScenario: formData.vocationalScenario,
        tasks: formData.tasks.filter(t => t.title.trim() && t.description.trim()).map(t => ({
          title: t.title,
          description: t.description
        })),
        assessmentCriteria: {
          pass: formData.assessmentCriteria.pass.filter(c => c.description.trim()).map(c => `${c.code}: ${c.description}`),
          merit: formData.assessmentCriteria.merit.filter(c => c.description.trim()).map(c => `${c.code}: ${c.description}`),
          distinction: formData.assessmentCriteria.distinction.filter(c => c.description.trim()).map(c => `${c.code}: ${c.description}`),
        },
        checklistOfEvidence: formData.checklistOfEvidence.filter(e => e.trim()),
        sourcesOfInformation: formData.sourcesOfInformation.filter(s => s.trim()),
        status: 'PUBLISHED',
      };

      if (editBriefId) {
        await briefsApi.updateBrief(editBriefId, cleanedData);
      } else {
        await briefsApi.createBrief(cleanedData);
      }
      
      toast.success('Brief published successfully!');
      onNavigate('briefs');
    } catch (error: any) {
      toast.error(error.message || 'Failed to publish brief');
    } finally {
      setLoading(false);
    }
  };

  // Array manipulation helpers
  const addLearningAim = () => setFormData({ ...formData, learningAims: [...formData.learningAims, ''] });
  const removeLearningAim = (index: number) => {
    const newAims = formData.learningAims.filter((_, i) => i !== index);
    setFormData({ ...formData, learningAims: newAims.length > 0 ? newAims : [''] });
  };
  const updateLearningAim = (index: number, value: string) => {
    const newAims = [...formData.learningAims];
    newAims[index] = value;
    setFormData({ ...formData, learningAims: newAims });
  };

  const addTask = () => setFormData({ 
    ...formData, 
    tasks: [...formData.tasks, { title: '', description: '' }] 
  });
  const removeTask = (index: number) => {
    const newTasks = formData.tasks.filter((_, i) => i !== index);
    setFormData({ ...formData, tasks: newTasks.length > 0 ? newTasks : [{ title: '', description: '' }] });
  };
  const updateTask = (index: number, field: keyof TaskBlock, value: any) => {
    const newTasks = [...formData.tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setFormData({ ...formData, tasks: newTasks });
  };

  // Helper to generate next criterion code
  const getNextCriterionCode = (type: 'pass' | 'merit' | 'distinction', currentList: CriterionItem[]): string => {
    const gradePrefix = type === 'pass' ? 'P' : type === 'merit' ? 'M' : 'D';
    const aimCount = formData.learningAims.filter(a => a.trim()).length;
    
    if (aimCount === 0) return `A.${gradePrefix}1`;
    
    // Count existing criteria
    const existingCount = currentList.length;
    const aimIndex = Math.floor(existingCount / Math.ceil((existingCount + 1) / aimCount));
    const criterionNum = (existingCount % aimCount) + 1;
    const aimLetter = String.fromCharCode(65 + Math.min(aimIndex, aimCount - 1));
    
    // Calculate the next number for this aim
    const sameAimCriteria = currentList.filter(c => c.code.startsWith(`${aimLetter}.${gradePrefix}`));
    const nextNum = sameAimCriteria.length + 1;
    
    return `${aimLetter}.${gradePrefix}${nextNum}`;
  };

  const addCriteria = (type: keyof AssessmentCriteria) => {
    const newCode = getNextCriterionCode(type, formData.assessmentCriteria[type]);
    setFormData({
      ...formData,
      assessmentCriteria: {
        ...formData.assessmentCriteria,
        [type]: [...formData.assessmentCriteria[type], { code: newCode, description: '' }],
      },
    });
  };
  const removeCriteria = (type: keyof AssessmentCriteria, index: number) => {
    const newCriteria = formData.assessmentCriteria[type].filter((_, i) => i !== index);
    const defaultCriterion = type === 'pass' ? { code: 'A.P1', description: '' } : 
                            type === 'merit' ? { code: 'A.M1', description: '' } : 
                            { code: 'A.D1', description: '' };
    setFormData({
      ...formData,
      assessmentCriteria: {
        ...formData.assessmentCriteria,
        [type]: newCriteria.length > 0 ? newCriteria : [defaultCriterion],
      },
    });
  };
  const updateCriteria = (type: keyof AssessmentCriteria, index: number, field: 'code' | 'description', value: string) => {
    const newCriteria = [...formData.assessmentCriteria[type]];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    setFormData({
      ...formData,
      assessmentCriteria: {
        ...formData.assessmentCriteria,
        [type]: newCriteria,
      },
    });
  };

  const addItem = (field: 'checklistOfEvidence' | 'sourcesOfInformation') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };
  const removeItem = (field: 'checklistOfEvidence' | 'sourcesOfInformation', index: number) => {
    const newItems = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newItems.length > 0 ? newItems : [''] });
  };
  const updateItem = (field: 'checklistOfEvidence' | 'sourcesOfInformation', index: number, value: string) => {
    const newItems = [...formData[field]];
    newItems[index] = value;
    setFormData({ ...formData, [field]: newItems });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => onNavigate('briefs')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Briefs
          </Button>
          <h1 className="text-3xl font-bold">Create BTEC Assignment Brief</h1>
          <p className="text-gray-600 mt-2">
            Fill in all required fields to create a compliant BTEC assignment brief
          </p>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Please fix the following errors:</strong>
              <ul className="list-disc list-inside mt-2">
                {validationErrors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Form Sections */}
        <div className="space-y-6">
          {/* 1. Core Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Core Information
              </CardTitle>
              <CardDescription>
                Basic unit identification - must be accurate and unique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subjectName">Subject Name *</Label>
                  <Input
                    id="subjectName"
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    placeholder="e.g., IT, Business, Health & Social Care"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unitCode">Unit Code *</Label>
                  <Input
                    id="unitCode"
                    value={formData.unitCode}
                    onChange={(e) => setFormData({ ...formData, unitCode: e.target.value })}
                    placeholder="e.g., Unit 21"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="unitName">Unit Name *</Label>
                <Input
                  id="unitName"
                  value={formData.unitName}
                  onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                  placeholder="e.g., Introduction to Artificial Intelligence"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="level">Level *</Label>
                  <select
                    id="level"
                    className="w-full h-10 px-3 border border-gray-300 rounded-md"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) as 3 | 4 | 5 | 6 })}
                  >
                    <option value={3}>Level 3</option>
                    <option value={4}>Level 4</option>
                    <option value={5}>Level 5</option>
                    <option value={6}>Level 6</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="semester">Semester *</Label>
                  <select
                    id="semester"
                    className="w-full h-10 px-3 border border-gray-300 rounded-md"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value as '1' | '2' })}
                  >
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Learning Aims */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Learning Aims
              </CardTitle>
              <CardDescription>
                Define the key learning objectives (A, B, C format) - Minimum 1 required
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.learningAims.map((aim, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={aim}
                    onChange={(e) => updateLearningAim(index, e.target.value)}
                    placeholder={`Learning Aim ${String.fromCharCode(65 + index)}: e.g., Understand fundamentals of AI`}
                  />
                  {formData.learningAims.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeLearningAim(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={addLearningAim} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Learning Aim
              </Button>
            </CardContent>
          </Card>

          {/* 3. Vocational Scenario */}
          <Card>
            <CardHeader>
              <CardTitle>Vocational Scenario / Context *</CardTitle>
              <CardDescription>
                Provide realistic context (1-3 paragraphs) - Minimum 50 characters required
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  value={formData.vocationalScenario}
                  onChange={(e) => setFormData({ ...formData, vocationalScenario: e.target.value })}
                  placeholder="Example: You are working as a junior AI analyst in a technology consultancy firm..."
                  rows={6}
                  required
                  className={formData.vocationalScenario.length > 0 && formData.vocationalScenario.length < 50 ? 'border-red-500' : ''}
                />
                <div className="flex justify-between text-sm">
                  <span className={formData.vocationalScenario.length < 50 ? 'text-red-500' : 'text-gray-500'}>
                    {formData.vocationalScenario.length} / 50 characters minimum
                  </span>
                  {formData.vocationalScenario.length < 50 && formData.vocationalScenario.length > 0 && (
                    <span className="text-red-500 font-medium">
                      Need {50 - formData.vocationalScenario.length} more characters
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks (What Students Must Do)</CardTitle>
              <CardDescription>
                Define progressive tasks that link to learning aims
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.tasks.map((task, index) => (
                <div key={index} className="border p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold">Task {index + 1}</h4>
                    {formData.tasks.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTask(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    value={task.title}
                    onChange={(e) => updateTask(index, 'title', e.target.value)}
                    placeholder="Task title (e.g., Task 1 – AI Fundamentals)"
                  />
                  <Textarea
                    value={task.description}
                    onChange={(e) => updateTask(index, 'description', e.target.value)}
                    placeholder="Task description (e.g., Explain the key concepts of artificial intelligence...)"
                    rows={3}
                  />
                </div>
              ))}
              <Button variant="outline" onClick={addTask} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </CardContent>
          </Card>

          {/* 5. Assessment Criteria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Assessment Criteria (MOST IMPORTANT)
              </CardTitle>
              <CardDescription>
                Define measurable criteria with action verbs - Pass is mandatory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pass Criteria */}
              <div>
                <h4 className="font-semibold text-green-700 mb-3">Pass Criteria * (Format: A.P1, A.P2, B.P3...)</h4>
                {formData.assessmentCriteria.pass.map((criterion, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={criterion.code}
                      onChange={(e) => updateCriteria('pass', index, 'code', e.target.value)}
                      placeholder="A.P1"
                      className="w-24"
                    />
                    <Input
                      value={criterion.description}
                      onChange={(e) => updateCriteria('pass', index, 'description', e.target.value)}
                      placeholder="e.g., Explain what artificial intelligence is"
                      className="flex-1"
                    />
                    {formData.assessmentCriteria.pass.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeCriteria('pass', index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" onClick={() => addCriteria('pass')} className="w-full mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Pass Criterion
                </Button>
              </div>

              {/* Merit Criteria */}
              <div>
                <h4 className="font-semibold text-blue-700 mb-3">Merit Criteria (Format: A.M1, B.M2...)</h4>
                {formData.assessmentCriteria.merit.map((criterion, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={criterion.code}
                      onChange={(e) => updateCriteria('merit', index, 'code', e.target.value)}
                      placeholder="A.M1"
                      className="w-24"
                    />
                    <Input
                      value={criterion.description}
                      onChange={(e) => updateCriteria('merit', index, 'description', e.target.value)}
                      placeholder="e.g., Analyse how AI techniques solve real problems"
                      className="flex-1"
                    />
                    {formData.assessmentCriteria.merit.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeCriteria('merit', index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" onClick={() => addCriteria('merit')} className="w-full mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Merit Criterion
                </Button>
              </div>

              {/* Distinction Criteria */}
              <div>
                <h4 className="font-semibold text-purple-700 mb-3">Distinction Criteria (Format: A.D1, B.D2...)</h4>
                {formData.assessmentCriteria.distinction.map((criterion, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={criterion.code}
                      onChange={(e) => updateCriteria('distinction', index, 'code', e.target.value)}
                      placeholder="A.D1"
                      className="w-24"
                    />
                    <Input
                      value={criterion.description}
                      onChange={(e) => updateCriteria('distinction', index, 'description', e.target.value)}
                      placeholder="e.g., Evaluate AI systems in complex scenarios"
                      className="flex-1"
                    />
                    {formData.assessmentCriteria.distinction.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeCriteria('distinction', index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" onClick={() => addCriteria('distinction')} className="w-full mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Distinction Criterion
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 6. Checklist of Evidence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Checklist of Evidence Required
              </CardTitle>
              <CardDescription>
                List what students must include in their submission
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.checklistOfEvidence.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateItem('checklistOfEvidence', index, e.target.value)}
                    placeholder="e.g., Written report, Diagrams or tables, Case study analysis"
                  />
                  {formData.checklistOfEvidence.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem('checklistOfEvidence', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={() => addItem('checklistOfEvidence')} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Evidence Item
              </Button>
            </CardContent>
          </Card>

          {/* 7. Sources of Information */}
          <Card>
            <CardHeader>
              <CardTitle>Sources of Information</CardTitle>
              <CardDescription>
                Provide guidance sources (not references) for students
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.sourcesOfInformation.map((source, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={source}
                    onChange={(e) => updateItem('sourcesOfInformation', index, e.target.value)}
                    placeholder="e.g., Pearson BTEC specification, Academic journals, Government frameworks"
                  />
                  {formData.sourcesOfInformation.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem('sourcesOfInformation', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={() => addItem('sourcesOfInformation')} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Source
              </Button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pb-8">
            <Button
              variant="outline"
              onClick={() => onNavigate('briefs')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <Button
              onClick={handlePublish}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Publish Brief
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
