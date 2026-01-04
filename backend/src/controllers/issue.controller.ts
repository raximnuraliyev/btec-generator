// =============================================================================
// BTEC GENERATOR - ISSUE CONTROLLER
// =============================================================================

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../lib/prisma';
import { APIError } from '../types';

export const createIssue = async (
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

    const { title, description, category, screenshot } = req.body;

    // Map frontend category values to Prisma IssueCategory enum
    const categoryMap: Record<string, string> = {
      'GENERATION': 'GENERATION_ISSUE',
      'ACCOUNT': 'ACCOUNT_ISSUE',
      'TOKENS': 'OTHER',
      'BUG': 'BUG',
      'FEATURE': 'FEATURE_REQUEST',
      'OTHER': 'OTHER',
      'DOWNLOAD': 'DOWNLOAD_ISSUE',
    };
    const mappedCategory = categoryMap[category] || 'OTHER';

    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        category: mappedCategory as any,
        screenshot,
        userId: req.user.userId,
        status: 'OPEN',
      },
    });

    res.status(201).json(issue);
  } catch (error) {
    next(error);
  }
};

export const getUserIssues = async (
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

    const issues = await prisma.issue.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ issues });
  } catch (error) {
    next(error);
  }
};

export const getIssueById = async (
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

    const issue = await prisma.issue.findUnique({
      where: { id },
    });

    if (!issue) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Issue not found',
      } as APIError);
      return;
    }

    if (issue.userId !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view this issue',
      } as APIError);
      return;
    }

    res.status(200).json(issue);
  } catch (error) {
    next(error);
  }
};

export const deleteIssue = async (
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

    const issue = await prisma.issue.findUnique({
      where: { id },
    });

    if (!issue) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Issue not found',
      } as APIError);
      return;
    }

    if (issue.userId !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to delete this issue',
      } as APIError);
      return;
    }

    await prisma.issue.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Issue deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAllIssues = async (
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

    // Admin-only endpoint
    if (req.user.role !== 'ADMIN') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
      } as APIError);
      return;
    }

    const status = req.query.status as string;
    const category = req.query.category as string;

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const issues = await prisma.issue.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            studentProfile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ issues });
  } catch (error) {
    next(error);
  }
};
