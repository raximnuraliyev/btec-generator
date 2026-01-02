import { useEffect, useState } from 'react';
import { briefsApi } from '../services/api';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Plus, Edit, Trash2, FileText, Search, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

interface Brief {
  id: string;
  unitName: string;
  unitCode: string;
  level: number;
  learningAims: any[];
  assessmentCriteria: {
    pass: string[];
    merit: string[];
    distinction: string[];
  };
  vocationalScenario: string;
  sources: string[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

interface BriefManagementPageProps {
  onNavigate: (page: 'dashboard' | 'teacher' | 'create-brief') => void;
}

export function BriefManagementPage({ onNavigate }: BriefManagementPageProps) {
  const { user } = useAuth();
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingBrief, setEditingBrief] = useState<Brief | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadBriefs();
  }, [selectedLevel]);

  const loadBriefs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedLevel) params.level = selectedLevel;
      if (user?.role === 'TEACHER') {
        params.createdById = user.id;
      }
      const data = await briefsApi.getBriefs(params);
      setBriefs(data);
    } catch (err) {
      console.error('[BRIEF_PAGE] Failed to load briefs:', err);
      toast.error('Failed to load briefs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brief?')) return;

    try {
      setDeleting(id);
      await briefsApi.deleteBrief(id);
      toast.success('Brief deleted successfully');
      await loadBriefs();
    } catch (err: any) {
      console.error('[BRIEF_PAGE] Delete failed:', err);
      toast.error(err.message || 'Failed to delete brief');
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (brief: Brief) => {
    setEditingBrief(brief);
    setShowEditor(true);
  };

  const handleCreate = () => {
    onNavigate('create-brief');
  };

  const filteredBriefs = briefs.filter(
    (brief) =>
      brief.unitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brief.unitCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (brief.vocationalScenario || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = user?.role === 'ADMIN' || user?.role === 'TEACHER';

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => onNavigate(user?.role === 'TEACHER' ? 'teacher' : 'dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {user?.role === 'TEACHER' ? 'Teacher Dashboard' : 'Dashboard'}
        </Button>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8 text-blue-600" />
          Brief Management
        </h1>
        {canEdit && (
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Brief
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search briefs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedLevel === null ? 'default' : 'outline'}
              onClick={() => setSelectedLevel(null)}
            >
              All Levels
            </Button>
            {[3, 4, 5, 6].map((level) => (
              <Button
                key={level}
                variant={selectedLevel === level ? 'default' : 'outline'}
                onClick={() => setSelectedLevel(level)}
              >
                Level {level}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Briefs List */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      ) : filteredBriefs.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600 mb-2">No briefs found</p>
          <p className="text-sm text-gray-500 mb-4">
            {searchTerm
              ? 'Try adjusting your search filters'
              : 'Create your first brief to get started'}
          </p>
          {canEdit && (
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Brief
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBriefs.map((brief) => (
            <Card key={brief.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{brief.unitName}</h3>
                  <p className="text-sm text-gray-600">{brief.unitCode}</p>
                </div>
                <Badge>Level {brief.level}</Badge>
              </div>

              <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                {brief.vocationalScenario || 'No scenario provided'}
              </p>

              <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
                <span>{brief.learningAims.length} aims</span>
                <span>•</span>
                <span>
                  {brief.assessmentCriteria.pass.length +
                    brief.assessmentCriteria.merit.length +
                    brief.assessmentCriteria.distinction.length}{' '}
                  criteria
                </span>
              </div>

              {canEdit && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(brief)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(brief.id)}
                    disabled={deleting === brief.id}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Brief Editor Dialog */}
      {showEditor && (
        <BriefEditorDialog
          brief={editingBrief}
          onClose={() => {
            setShowEditor(false);
            setEditingBrief(null);
          }}
          onSaved={() => {
            setShowEditor(false);
            setEditingBrief(null);
            loadBriefs();
          }}
        />
      )}
    </div>
  );
}

// Brief Editor Component
interface BriefEditorDialogProps {
  brief: Brief | null;
  onClose: () => void;
  onSaved: () => void;
}

function BriefEditorDialog({ brief, onClose, onSaved }: BriefEditorDialogProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    unitName: brief?.unitName || '',
    unitCode: brief?.unitCode || '',
    level: brief?.level || 3,
    learningAims: brief?.learningAims || [{ code: '', text: '', type: 'core' }],
    assessmentCriteria: brief?.assessmentCriteria || {
      pass: [''],
      merit: [''],
      distinction: [''],
    },
    vocationalScenario: brief?.vocationalScenario || '',
    sources: brief?.sources || [''],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.unitName.length < 5) {
      toast.error('Unit name must be at least 5 characters');
      return;
    }
    if (formData.scenario.length < 50) {
      toast.error('Scenario must be at least 50 characters');
      return;
    }

    try {
      setSaving(true);
      if (brief) {
        await briefsApi.updateBrief(brief.id, formData);
        toast.success('Brief updated successfully');
      } else {
        await briefsApi.createBrief(formData);
        toast.success('Brief created successfully');
      }
      onSaved();
    } catch (err: any) {
      console.error('[BRIEF_EDITOR] Save failed:', err);
      toast.error(err.message || 'Failed to save brief');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{brief ? 'Edit Brief' : 'Create Brief'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Unit Name *</label>
              <Input
                value={formData.unitName}
                onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                placeholder="e.g., Digital Imaging and Photographic Practice"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Unit Code *</label>
              <Input
                value={formData.unitCode}
                onChange={(e) => setFormData({ ...formData, unitCode: e.target.value })}
                placeholder="e.g., Unit 23"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Level *</label>
            <select
              value={formData.level}
              onChange={(e) =>
                setFormData({ ...formData, level: parseInt(e.target.value) })
              }
              className="w-full border rounded-md p-2"
            >
              <option value={3}>Level 3</option>
              <option value={4}>Level 4</option>
              <option value={5}>Level 5</option>
              <option value={6}>Level 6</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Vocational Scenario * (min 50 chars)</label>
            <Textarea
              value={formData.vocationalScenario}
              onChange={(e) => setFormData({ ...formData, vocationalScenario: e.target.value })}
              placeholder="Describe the assignment scenario in detail..."
              rows={6}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.vocationalScenario.length} / 50 minimum characters
            </p>
          </div>

          {/* Criteria */}
          <div className="space-y-4">
            <h3 className="font-semibold">Assessment Criteria</h3>
            {(['pass', 'merit', 'distinction'] as const).map((grade) => (
              <div key={grade}>
                <label className="block text-sm font-medium mb-2 capitalize">
                  {grade} Criteria
                </label>
                {formData.assessmentCriteria[grade].map((criterion, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Input
                      value={criterion}
                      onChange={(e) => {
                        const newCriteria = [...formData.assessmentCriteria[grade]];
                        newCriteria[idx] = e.target.value;
                        setFormData({
                          ...formData,
                          assessmentCriteria: {
                            ...formData.assessmentCriteria,
                            [grade]: newCriteria,
                          },
                        });
                      }}
                      placeholder={`${grade} criterion ${idx + 1}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newCriteria = formData.assessmentCriteria[grade].filter(
                          (_, i) => i !== idx
                        );
                        setFormData({
                          ...formData,
                          assessmentCriteria: {
                            ...formData.assessmentCriteria,
                            [grade]: newCriteria,
                          },
                        });
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      assessmentCriteria: {
                        ...formData.assessmentCriteria,
                        [grade]: [...formData.assessmentCriteria[grade], ''],
                      },
                    });
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add {grade} criterion
                </Button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : brief ? 'Update Brief' : 'Create Brief'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
