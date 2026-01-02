import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { studentProfileSchema } from '../utils/validation';
import { createStudentProfile, getStudentProfile } from '../services/student.service';
import { APIError } from '../types';

export const createProfile = async (
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

    const { fullName, universityName, faculty, groupName, city, academicYear } =
      studentProfileSchema.parse(req.body);
    const result = await createStudentProfile(
      req.user.userId,
      fullName,
      universityName,
      faculty,
      groupName,
      city,
      academicYear
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
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

    const result = await getStudentProfile(req.user.userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
