import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const studentProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  universityName: z.string().min(1, 'University name is required'),
  faculty: z.string().min(1, 'Faculty/Department is required'),
  groupName: z.string().min(1, 'Group/Class is required'),
  city: z.string().min(1, 'City is required'),
  academicYear: z.string().optional(),
});

export const createBriefSchema = z.object({
  // Core information
  subjectName: z.string().min(1, 'Subject name is required'),
  unitName: z.string().min(1, 'Unit name is required'),
  unitCode: z.string().min(1, 'Unit code is required'),
  level: z.number().int().min(3).max(6, 'Level must be between 3 and 6'),
  semester: z.enum(['1', '2'], {
    errorMap: () => ({ message: 'Semester must be 1 or 2' }),
  }),
  
  // Learning content
  learningAims: z.array(z.string()).min(1, 'At least one learning aim is required'),
  vocationalScenario: z.string().min(50, 'Vocational scenario must be at least 50 characters'),
  
  // Tasks
  tasks: z.array(z.object({
    title: z.string().min(1, 'Task title is required'),
    description: z.string().min(1, 'Task description is required'),
  })).min(1, 'At least one task is required'),
  
  // Assessment criteria
  assessmentCriteria: z.object({
    pass: z.array(z.string()).min(1, 'At least one pass criterion is required'),
    merit: z.array(z.string()),
    distinction: z.array(z.string()),
  }),
  
  // Additional requirements
  checklistOfEvidence: z.array(z.string()).optional().default([]),
  sourcesOfInformation: z.array(z.string()).optional().default([]),
  
  // Publishing control
  status: z.enum(['DRAFT', 'PUBLISHED']).optional().default('DRAFT'),
});

export const generateAssignmentSchema = z.object({
  briefId: z.string().uuid('Invalid brief ID'),
  grade: z.enum(['PASS', 'MERIT', 'DISTINCTION'], {
    errorMap: () => ({ message: 'Grade must be PASS, MERIT, or DISTINCTION' }),
  }),
  language: z.enum(['en', 'ru', 'uz', 'es'], {
    errorMap: () => ({ message: 'Language must be en, ru, uz, or es' }),
  }),
  includeImages: z.boolean().optional().default(false),
  includeTables: z.boolean().optional().default(false),
});
