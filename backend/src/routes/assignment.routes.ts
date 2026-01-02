import { Router } from 'express';
import { generate, getById, list, download, deleteAssignment } from '../controllers/assignment.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireRole } from '../middlewares/role';
import { requireDisclaimer } from '../middlewares/disclaimer';
import { UserRole } from '@prisma/client';

const router = Router();

router.post(
  '/generate',
  authMiddleware,
  requireRole(UserRole.USER, UserRole.VIP, UserRole.ADMIN),
  requireDisclaimer,
  generate
);
router.get('/', authMiddleware, list);
router.get('/:id', authMiddleware, getById);
router.get('/:id/download', authMiddleware, download);
router.delete('/:id', authMiddleware, deleteAssignment);

export default router;
