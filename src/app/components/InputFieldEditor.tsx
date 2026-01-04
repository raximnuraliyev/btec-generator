import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { 
  Plus, Trash2, Edit, GripVertical, ChevronDown, ChevronUp,
  Type, FileText, List, Hash, ToggleLeft, ListPlus
} from 'lucide-react';
import type { InputFieldDefinition, InputFieldType } from '../types';

interface InputFieldEditorProps {
  fields: InputFieldDefinition[];
  onChange: (fields: InputFieldDefinition[]) => void;
}

const FIELD_TYPE_OPTIONS: { value: InputFieldType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'text', label: 'Short Text', icon: <Type className="w-4 h-4" />, description: 'Single line text input' },
  { value: 'textarea', label: 'Long Text', icon: <FileText className="w-4 h-4" />, description: 'Multi-line text area' },
  { value: 'select', label: 'Single Select', icon: <List className="w-4 h-4" />, description: 'Dropdown with one choice' },
  { value: 'multiselect', label: 'Multi Select', icon: <ListPlus className="w-4 h-4" />, description: 'Select multiple options' },
  { value: 'number', label: 'Number', icon: <Hash className="w-4 h-4" />, description: 'Numeric input' },
  { value: 'boolean', label: 'Yes/No', icon: <ToggleLeft className="w-4 h-4" />, description: 'True/false checkbox' },
  { value: 'array', label: 'List Items', icon: <Plus className="w-4 h-4" />, description: 'Add multiple items' },
];

const CATEGORY_OPTIONS = [
  'Project Details',
  'Technical Information',
  'Methods & Approach',
  'Outcomes & Results',
  'Reflection',
  'Other',
];

interface FieldFormData {
  id: string;
  label: string;
  type: InputFieldType;
  required: boolean;
  placeholder: string;
  description: string;
  category: string;
  options: string[];
  minLength?: number;
  maxLength?: number;
}

const defaultFormData: FieldFormData = {
  id: '',
  label: '',
  type: 'text',
  required: false,
  placeholder: '',
  description: '',
  category: 'Project Details',
  options: [],
  minLength: undefined,
  maxLength: undefined,
};

export function InputFieldEditor({ fields, onChange }: InputFieldEditorProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<FieldFormData>(defaultFormData);
  const [optionInput, setOptionInput] = useState('');

  // Generate a unique ID from the label
  const generateId = (label: string): string => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || 'field';
  };

  const handleAddField = () => {
    setFormData(defaultFormData);
    setEditingIndex(null);
    setShowAddDialog(true);
  };

  const handleEditField = (index: number) => {
    const field = fields[index];
    setFormData({
      id: field.id,
      label: field.label,
      type: field.type,
      required: field.required,
      placeholder: field.placeholder || '',
      description: field.description || '',
      category: field.category || 'Project Details',
      options: field.options || [],
      minLength: field.minLength,
      maxLength: field.maxLength,
    });
    setEditingIndex(index);
    setShowAddDialog(true);
  };

  const handleDeleteField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    onChange(newFields);
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    onChange(newFields);
  };

  const handleSaveField = () => {
    // Validate
    if (!formData.label.trim()) {
      alert('Label is required');
      return;
    }

    const fieldId = formData.id || generateId(formData.label);
    
    // Check for duplicate IDs
    const existingIdIndex = fields.findIndex((f, i) => f.id === fieldId && i !== editingIndex);
    if (existingIdIndex >= 0) {
      alert('A field with this ID already exists');
      return;
    }

    const newField: InputFieldDefinition = {
      id: fieldId,
      label: formData.label.trim(),
      type: formData.type,
      required: formData.required,
      ...(formData.placeholder && { placeholder: formData.placeholder }),
      ...(formData.description && { description: formData.description }),
      ...(formData.category && { category: formData.category }),
      ...(formData.options.length > 0 && { options: formData.options }),
      ...(formData.minLength !== undefined && { minLength: formData.minLength }),
      ...(formData.maxLength !== undefined && { maxLength: formData.maxLength }),
    };

    if (editingIndex !== null) {
      const newFields = [...fields];
      newFields[editingIndex] = newField;
      onChange(newFields);
    } else {
      onChange([...fields, newField]);
    }

    setShowAddDialog(false);
    setFormData(defaultFormData);
    setEditingIndex(null);
  };

  const handleAddOption = () => {
    if (optionInput.trim()) {
      setFormData({
        ...formData,
        options: [...formData.options, optionInput.trim()],
      });
      setOptionInput('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  const getTypeInfo = (type: InputFieldType) => {
    return FIELD_TYPE_OPTIONS.find(t => t.value === type) || FIELD_TYPE_OPTIONS[0];
  };

  const showOptionsEditor = formData.type === 'select' || formData.type === 'multiselect';
  const showLengthEditor = formData.type === 'text' || formData.type === 'textarea';

  return (
    <div className="space-y-4">
      {/* Fields List */}
      {fields.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">No input fields defined yet</p>
          <p className="text-sm text-gray-400 mb-4">
            Add fields that students will fill in before generation
          </p>
          <Button onClick={handleAddField} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add First Field
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => {
            const typeInfo = getTypeInfo(field.type);
            return (
              <div
                key={field.id}
                className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
              >
                {/* Drag Handle (visual only for now) */}
                <div className="text-gray-300">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Field Type Icon */}
                <div className="p-2 bg-blue-50 rounded text-blue-600">
                  {typeInfo.icon}
                </div>

                {/* Field Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{field.label}</span>
                    {field.required && (
                      <span className="text-xs text-red-500 font-medium">Required</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{typeInfo.label}</span>
                    {field.category && (
                      <>
                        <span>•</span>
                        <span>{field.category}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMoveField(index, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMoveField(index, 'down')}
                    disabled={index === fields.length - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-600 hover:text-blue-700"
                    onClick={() => handleEditField(index)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                    onClick={() => handleDeleteField(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Button */}
      {fields.length > 0 && (
        <Button onClick={handleAddField} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Input Field
        </Button>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? 'Edit Input Field' : 'Add Input Field'}
            </DialogTitle>
            <DialogDescription>
              Define a field that students will complete before AI generation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Label */}
            <div>
              <Label htmlFor="field-label">Field Label *</Label>
              <Input
                id="field-label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Project Title, Tools Used"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                ID: {formData.id || generateId(formData.label) || 'auto-generated'}
              </p>
            </div>

            {/* Field Type */}
            <div>
              <Label>Field Type *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {FIELD_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: option.value })}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                      formData.type === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={formData.type === option.value ? 'text-blue-600' : 'text-gray-400'}>
                      {option.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="field-category">Category</Label>
              <select
                id="field-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full mt-1 p-2 border rounded-md bg-white"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Fields are grouped by category in the student form
              </p>
            </div>

            {/* Required */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="field-required"
                checked={formData.required}
                onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="field-required" className="cursor-pointer">
                Required field
              </Label>
            </div>

            {/* Placeholder */}
            <div>
              <Label htmlFor="field-placeholder">Placeholder Text</Label>
              <Input
                id="field-placeholder"
                value={formData.placeholder}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                placeholder="e.g., Enter your project title..."
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="field-description">Help Text</Label>
              <Textarea
                id="field-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Explain what students should enter in this field..."
                rows={2}
                className="mt-1"
              />
            </div>

            {/* Options (for select/multiselect) */}
            {showOptionsEditor && (
              <div>
                <Label>Options *</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Add the options students can choose from
                </p>
                <div className="space-y-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input value={option} disabled className="flex-1" />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveOption(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      placeholder="Add an option..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOption();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={handleAddOption}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Length constraints (for text/textarea) */}
            {showLengthEditor && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="field-minLength">Min Length</Label>
                  <Input
                    id="field-minLength"
                    type="number"
                    min={0}
                    value={formData.minLength || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      minLength: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    placeholder="Optional"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="field-maxLength">Max Length</Label>
                  <Input
                    id="field-maxLength"
                    type="number"
                    min={0}
                    value={formData.maxLength || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      maxLength: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    placeholder="Optional"
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dialog Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveField}>
              {editingIndex !== null ? 'Save Changes' : 'Add Field'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
