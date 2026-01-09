import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '../utils/validation';
import { registerUser, loginUser } from '../services/auth.service';
import { APIError } from '../types';
import { AuthRequest } from '../middlewares/auth';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = registerSchema.parse(req.body);
    const result = await registerUser(email, password);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        res.status(409).json({
          error: 'Conflict',
          message: error.message,
        } as APIError);
        return;
      }
    }
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await loginUser(email, password);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid email or password') {
        res.status(401).json({
          error: 'Unauthorized',
          message: error.message,
        } as APIError);
        return;
      }
    }
    next(error);
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      } as APIError);
      return;
    }
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  _req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  // JWT is stateless, so we just return success
  // Client should remove the token from localStorage
  res.status(200).json({ message: 'Logged out successfully' });
};
