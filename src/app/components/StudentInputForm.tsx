import React, { useState, useMemo } from 'react';
import type { InputFieldDefinition, StudentInputData, Brief } from '../types';

// Simple translation helper (can be replaced with i18n later)
const t = (key: string, fallback: string, params?: Record<string, string | number>) => {
  let text = fallback;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
};

interface StudentInputFormProps {
  brief: Brief;
  initialData?: StudentInputData;
  onSubmit: (data: StudentInputData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

/**
 * StudentInputForm - Dynamic form for collecting student project details
 * 
 * This form is rendered based on the brief's requiredInputs schema.
 * It allows students to provide details about their actual work before generation.
 * The AI will use this data to write personalised, first-person content.
 */
export const StudentInputForm: React.FC<StudentInputFormProps> = ({
  brief,
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<StudentInputData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const fields = useMemo(() => brief.requiredInputs || [], [brief.requiredInputs]);

  // Group fields by category
  const groupedFields = useMemo(() => {
    const groups: Record<string, InputFieldDefinition[]> = {};
    fields.forEach(field => {
      const category = field.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(field);
    });
    return groups;
  }, [fields]);

  // Validate a single field
  const validateField = (field: InputFieldDefinition, value: any): string | null => {
    if (field.required) {
      if (value === undefined || value === null || value === '') {
        return t('validation.required', `${field.label} is required`, { field: field.label });
      }
      if (Array.isArray(value) && value.length === 0) {
        return t('validation.required', `${field.label} is required`, { field: field.label });
      }
    }

    if (field.type === 'text' || field.type === 'textarea') {
      const strValue = value as string || '';
      if (field.minLength && strValue.length < field.minLength) {
        return t('validation.minLength', `${field.label} must be at least ${field.minLength} characters`, { field: field.label, min: field.minLength });
      }
      if (field.maxLength && strValue.length > field.maxLength) {
        return t('validation.maxLength', `${field.label} must be at most ${field.maxLength} characters`, { field: field.label, max: field.maxLength });
      }
    }

    return null;
  };

  // Validate all fields
  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      const error = validateField(field, formData[field.id]);
      if (error) {
        newErrors[field.id] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle field change
  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear error on change if field was touched
    if (touched[fieldId]) {
      const field = fields.find(f => f.id === fieldId);
      if (field) {
        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [fieldId]: error || '' }));
      }
    }
  };

  // Handle blur (mark field as touched)
  const handleBlur = (fieldId: string) => {
    setTouched(prev => ({ ...prev, [fieldId]: true }));
    
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      const error = validateField(field, formData[fieldId]);
      setErrors(prev => ({ ...prev, [fieldId]: error || '' }));
    }
  };

  // Handle array field (add/remove items)
  const handleArrayAdd = (fieldId: string, value: string) => {
    if (!value.trim()) return;
    const current = (formData[fieldId] as string[]) || [];
    if (!current.includes(value.trim())) {
      handleChange(fieldId, [...current, value.trim()]);
    }
  };

  const handleArrayRemove = (fieldId: string, index: number) => {
    const current = (formData[fieldId] as string[]) || [];
    handleChange(fieldId, current.filter((_, i) => i !== index));
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = fields.reduce((acc, f) => ({ ...acc, [f.id]: true }), {});
    setTouched(allTouched);

    if (validateAll()) {
      onSubmit(formData);
    }
  };

  // Render field based on type
  const renderField = (field: InputFieldDefinition) => {
    const value = formData[field.id];
    const error = errors[field.id];
    const isTouched = touched[field.id];

    const baseInputClasses = `
      w-full px-4 py-3 rounded-lg border transition-colors duration-200
      bg-white/5 backdrop-blur-sm
      ${error && isTouched
        ? 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
        : 'border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20'
      }
      text-white placeholder-gray-400
      focus:outline-none
    `;

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            id={field.id}
            value={(value as string) || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            onBlur={() => handleBlur(field.id)}
            placeholder={field.placeholder}
            className={baseInputClasses}
            disabled={isSubmitting}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={field.id}
            value={(value as string) || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            onBlur={() => handleBlur(field.id)}
            placeholder={field.placeholder}
            rows={4}
            className={`${baseInputClasses} resize-y min-h-[100px]`}
            disabled={isSubmitting}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            id={field.id}
            value={(value as number) || ''}
            onChange={(e) => handleChange(field.id, e.target.valueAsNumber || '')}
            onBlur={() => handleBlur(field.id)}
            placeholder={field.placeholder}
            className={baseInputClasses}
            disabled={isSubmitting}
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              id={field.id}
              checked={!!value}
              onChange={(e) => handleChange(field.id, e.target.checked)}
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/20"
              disabled={isSubmitting}
            />
            <span className="text-white/80">{field.placeholder || 'Yes'}</span>
          </label>
        );

      case 'select':
        return (
          <select
            id={field.id}
            value={(value as string) || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            onBlur={() => handleBlur(field.id)}
            className={baseInputClasses}
            disabled={isSubmitting}
          >
            <option value="">{field.placeholder || 'Select an option...'}</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt} className="bg-slate-800">
                {opt}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        const selectedValues = (value as string[]) || [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-lg border border-white/20 bg-white/5">
              {selectedValues.map((val, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/20 text-blue-300 text-sm"
                >
                  {val}
                  <button
                    type="button"
                    onClick={() => handleChange(field.id, selectedValues.filter((_, i) => i !== idx))}
                    className="ml-1 hover:text-red-400"
                    disabled={isSubmitting}
                  >
                    ×
                  </button>
                </span>
              ))}
              {selectedValues.length === 0 && (
                <span className="text-gray-400 text-sm">{field.placeholder || 'Select options...'}</span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {field.options?.map(opt => (
                <label
                  key={opt}
                  className={`
                    flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors
                    ${selectedValues.includes(opt)
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 hover:border-white/30'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(opt)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleChange(field.id, [...selectedValues, opt]);
                      } else {
                        handleChange(field.id, selectedValues.filter(v => v !== opt));
                      }
                    }}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-white/80">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'array':
        const arrayValues = (value as string[]) || [];
        const [inputValue, setInputValue] = useState('');
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleArrayAdd(field.id, inputValue);
                    setInputValue('');
                  }
                }}
                placeholder={field.placeholder}
                className={`${baseInputClasses} flex-1`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => {
                  handleArrayAdd(field.id, inputValue);
                  setInputValue('');
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                disabled={isSubmitting || !inputValue.trim()}
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {arrayValues.map((val, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-700 text-white text-sm"
                >
                  {val}
                  <button
                    type="button"
                    onClick={() => handleArrayRemove(field.id, idx)}
                    className="ml-1 text-gray-400 hover:text-red-400"
                    disabled={isSubmitting}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Calculate progress
  const requiredFields = fields.filter(f => f.required);
  const completedRequired = requiredFields.filter(f => {
    const val = formData[f.id];
    if (val === undefined || val === null || val === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  });
  const progress = requiredFields.length > 0 
    ? Math.round((completedRequired.length / requiredFields.length) * 100)
    : 100;

  if (fields.length === 0) {
    return (
      <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
        <p className="text-yellow-300">
          {t('studentInput.noRequirements', 'This brief does not require any student inputs. You can proceed directly to generation.')}
        </p>
        <button
          onClick={() => onSubmit({})}
          className="mt-4 px-6 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium transition-colors"
        >
          {t('studentInput.proceed', 'Proceed to Generation')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header with progress */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-2">
          {t('studentInput.title', 'Tell Us About Your Project')}
        </h2>
        <p className="text-gray-300 mb-4">
          {t('studentInput.description', 'Please provide details about your actual work. This information will be used to generate a personalised, first-person academic report that reflects YOUR achievements.')}
        </p>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">
              {t('studentInput.progress', 'Completion Progress')}
            </span>
            <span className={progress === 100 ? 'text-green-400' : 'text-blue-400'}>
              {progress}%
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progress === 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Form fields grouped by category */}
      {Object.entries(groupedFields).map(([category, categoryFields]) => (
        <div key={category} className="space-y-6">
          <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
            {category}
          </h3>
          
          <div className="space-y-6">
            {categoryFields.map(field => (
              <div key={field.id} className="space-y-2">
                <label
                  htmlFor={field.id}
                  className="block text-sm font-medium text-white/90"
                >
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                
                {field.description && (
                  <p className="text-sm text-gray-400">{field.description}</p>
                )}

                {renderField(field)}

                {/* Character count for text fields */}
                {(field.type === 'text' || field.type === 'textarea') && (field.minLength || field.maxLength) && (
                  <p className="text-xs text-gray-500">
                    {((formData[field.id] as string) || '').length} characters
                    {field.minLength && ` (min: ${field.minLength})`}
                    {field.maxLength && ` (max: ${field.maxLength})`}
                  </p>
                )}

                {/* Error message */}
                {errors[field.id] && touched[field.id] && (
                  <p className="text-sm text-red-400">{errors[field.id]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Submit buttons */}
      <div className="flex gap-4 pt-6 border-t border-white/10">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors"
            disabled={isSubmitting}
          >
            {t('common.cancel', 'Cancel')}
          </button>
        )}
        <button
          type="submit"
          className={`
            flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200
            ${progress === 100
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t('common.saving', 'Saving...')}
            </span>
          ) : progress === 100 ? (
            t('studentInput.saveAndGenerate', 'Save & Start Generation')
          ) : (
            t('studentInput.save', 'Save Progress')
          )}
        </button>
      </div>
    </form>
  );
};

export default StudentInputForm;
