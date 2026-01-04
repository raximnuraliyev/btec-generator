import { Router } from 'express';
import { 
  generate, 
  create,
  updateInputs,
  startGen,
  getById, 
  list, 
  download, 
  deleteAssignment 
} from '../controllers/assignment.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireRole } from '../middlewares/role';
import { requireDisclaimer } from '../middlewares/disclaimer';
import { UserRole } from '@prisma/client';

const router = Router();

// Legacy endpoint - creates assignment AND starts generation (for briefs without required inputs)
router.post(
  '/generate',
  authMiddleware,
  requireRole(UserRole.USER, UserRole.VIP, UserRole.ADMIN),
  requireDisclaimer,
  generate
);

// New flow: Create assignment (DRAFT) - does NOT start generation
router.post(
  '/',
  authMiddleware,
  requireRole(UserRole.USER, UserRole.VIP, UserRole.ADMIN),
  requireDisclaimer,
  create
);

// Save student inputs for an assignment
router.put(
  '/:id/inputs',
  authMiddleware,
  requireRole(UserRole.USER, UserRole.VIP, UserRole.ADMIN),
  updateInputs
);

// Start generation (after inputs are complete)
router.post(
  '/:id/generate',
  authMiddleware,
  requireRole(UserRole.USER, UserRole.VIP, UserRole.ADMIN),
  requireDisclaimer,
  startGen
);

router.get('/', authMiddleware, list);
router.get('/:id', authMiddleware, getById);
router.get('/:id/download', authMiddleware, download);
router.delete('/:id', authMiddleware, deleteAssignment);

export default router;
