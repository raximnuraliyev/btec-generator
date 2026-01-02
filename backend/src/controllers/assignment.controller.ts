import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { generateAssignmentSchema } from '../utils/validation';
import {
  generateAssignment,
  getAssignment,
  getUserAssignments,
} from '../services/assignment.service';
import { startGeneration } from '../services/generation.service';
import { generateDocx } from '../services/docx.service';
import { PrismaClient } from '@prisma/client';
import { APIError, GeneratedContent } from '../types';

const prisma = new PrismaClient();

export const generate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      } as APIError);
      return;
    }

    const { briefId, grade, language, includeImages, includeTables } =
      generateAssignmentSchema.parse(req.body);

    // Create assignment (DRAFT status)
    const assignment = await generateAssignment(
      req.user.userId,
      briefId,
      grade,
      language,
      includeImages || false,
      includeTables || false
    );

    // Start generation in background (orchestrator handles planner + writer)
    // Frontend will poll /api/generation/status/:id for progress
    startGeneration(assignment.id, req.user.userId).catch((error) => {
      console.error('[GENERATE] Background generation failed:', error);
    });

    // Return assignment ID immediately
    res.status(201).json({
      id: assignment.id,
      status: assignment.status,
      message: 'Generation started. Poll /api/generation/status/:id for progress.',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('profile required')) {
        res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        } as APIError);
        return;
      }
      if (error.message.includes('not allowed')) {
        res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        } as APIError);
        return;
      }
      if (error.message.includes('Insufficient tokens')) {
        res.status(402).json({
          error: 'Payment Required',
          message: error.message,
        } as APIError);
        return;
      }
      if (error.message === 'Brief not found') {
        res.status(404).json({
          error: 'Not Found',
          message: error.message,
        } as APIError);
        return;
      }
    }
    next(error);
  }
};

export const getById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      } as APIError);
      return;
    }

    const { id } = req.params;
    const assignment = await getAssignment(id, req.user.userId);
    res.status(200).json(assignment);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Assignment not found') {
        res.status(404).json({
          error: 'Not Found',
          message: error.message,
        } as APIError);
        return;
      }
      if (error.message === 'Unauthorized access to assignment') {
        res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        } as APIError);
        return;
      }
    }
    next(error);
  }
};

export const list = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      } as APIError);
      return;
    }

    const assignments = await getUserAssignments(req.user.userId);
    res.status(200).json({ assignments });
  } catch (error) {
    next(error);
  }
};

export const download = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      } as APIError);
      return;
    }

    const { id } = req.params;
    const assignment = await getAssignment(id, req.user.userId);

    if (assignment.status !== 'COMPLETED') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Assignment is not yet completed',
      } as APIError);
      return;
    }

    if (!assignment.content) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Assignment content is missing',
      } as APIError);
      return;
    }

    // Generate DOCX if not already generated
    if (!assignment.docxUrl) {
      const content = assignment.content as GeneratedContent;
      const docxUrl = await generateDocx(
        assignment.id,
        content,
        assignment.snapshot.unitName,
        assignment.snapshot.unitCode
      );

      await prisma.assignment.update({
        where: { id: assignment.id },
        data: { docxUrl },
      });

      res.status(200).json({ downloadUrl: docxUrl });
      return;
    }

    res.status(200).json({ downloadUrl: assignment.docxUrl });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === 'Assignment not found' ||
        error.message === 'Unauthorized access to assignment'
      ) {
        res.status(404).json({
          error: 'Not Found',
          message: error.message,
        } as APIError);
        return;
      }
    }
    next(error);
  }
};

export const deleteAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      } as APIError);
      return;
    }

    const { id } = req.params;

    // Check if assignment exists and belongs to user
    const assignment = await prisma.assignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Assignment not found',
      } as APIError);
      return;
    }

    if (assignment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to delete this assignment',
      } as APIError);
      return;
    }

    // Delete the assignment
    await prisma.assignment.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
