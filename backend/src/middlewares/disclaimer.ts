import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { APIError } from '../types';

export const requireDisclaimer = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const disclaimerAccepted = req.headers['x-disclaimer-accepted'];

  if (disclaimerAccepted !== 'true') {
    res.status(428).json({
      error: 'Precondition Required',
      message: 'Legal disclaimer must be accepted before generation',
      disclaimer: {
        title: 'Educational Guidance Only',
        content: `This platform is provided for educational guidance only.
        
The generated materials are learning aids, not final submissions.

Responsibility for academic integrity lies solely with the student.

By proceeding, you confirm that you understand these terms and will use the generated content as a study guide only.`,
        action: 'Include header: X-Disclaimer-Accepted: true',
      },
    } as APIError);
    return;
  }

  next();
};
