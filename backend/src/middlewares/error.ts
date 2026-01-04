import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { APIError } from '../types';

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof ZodError) {
    // Format error messages nicely
    const messages = error.errors.map(err => {
      const field = err.path.join('.');
      return `${field}: ${err.message}`;
    }).join('; ');
    
    res.status(400).json({
      error: 'Validation Error',
      message: messages || 'Invalid request data',
      details: error.errors,
    } as APIError);
    return;
  }

  if (error.message === 'Invalid or expired token') {
    res.status(401).json({
      error: 'Unauthorized',
      message: error.message,
    } as APIError);
    return;
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
  } as APIError);
};
