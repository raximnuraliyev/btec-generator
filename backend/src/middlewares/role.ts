import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { UserRole } from '@prisma/client';
import { APIError } from '../types';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      } as APIError);
      return;
    }

    const userRole = req.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      } as APIError);
      return;
    }

    next();
  };
};
