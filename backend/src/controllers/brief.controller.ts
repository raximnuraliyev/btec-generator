import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createBriefSchema } from '../utils/validation';
import { createBrief, getBriefs, getBriefById, updateBrief, deleteBrief, getBriefsWithStats } from '../services/brief.service';
import { APIError } from '../types';

export const create = async (
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

    console.log('[Brief Create] Received data:', JSON.stringify(req.body, null, 2));
    console.log('[Brief Create] User:', req.user);
    
    const data = createBriefSchema.parse(req.body);
    console.log('[Brief Create] Validation passed');
    
    const brief = await createBrief(req.user.userId, data);
    console.log('[Brief Create] Brief created:', brief.id);
    
    res.status(201).json(brief);
  } catch (error) {
    console.error('[Brief Create] Error:', error instanceof Error ? error.message : 'Unknown error');
    next(error);
  }
};

export const list = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const level = req.query.level ? parseInt(req.query.level as string) : undefined;

    if (level !== undefined && (isNaN(level) || level < 3 || level > 6)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Level must be between 3 and 6',
      } as APIError);
      return;
    }

    const briefs = await getBriefs(level);
    res.status(200).json(briefs);
  } catch (error) {
    next(error);
  }
};

export const getById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const brief = await getBriefById(id);
    res.status(200).json(brief);
  } catch (error) {
    if (error instanceof Error && error.message === 'Brief not found') {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      } as APIError);
      return;
    }
    next(error);
  }
};

export const update = async (
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
    const data = createBriefSchema.partial().parse(req.body);
    const brief = await updateBrief(req.user.userId, id, data);
    res.status(200).json(brief);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Brief not found') {
        res.status(404).json({
          error: 'Not Found',
          message: error.message,
        } as APIError);
        return;
      }
      if (error.message.includes('Cannot edit published briefs')) {
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

export const remove = async (
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
    const result = await deleteBrief(req.user.userId, id);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Brief not found') {
        res.status(404).json({
          error: 'Not Found',
          message: error.message,
        } as APIError);
        return;
      }
      if (error.message.includes('Cannot delete published briefs')) {
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

export const getMyBriefsWithStats = async (
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

    const result = await getBriefsWithStats(req.user.userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
