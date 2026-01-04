import { Router } from 'express';
import { create, list, getById, update, remove, getMyBriefsWithStats } from '../controllers/brief.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireRole } from '../middlewares/role';
import { UserRole } from '@prisma/client';

const router = Router();

// Get teacher's briefs with usage stats (must be before /:id route)
router.get('/my-stats', authMiddleware, requireRole(UserRole.ADMIN, UserRole.TEACHER), getMyBriefsWithStats);

router.post('/', authMiddleware, requireRole(UserRole.ADMIN, UserRole.TEACHER), create);
router.get('/', authMiddleware, list);
router.get('/:id', authMiddleware, getById);
router.put('/:id', authMiddleware, requireRole(UserRole.ADMIN, UserRole.TEACHER), update);
router.delete('/:id', authMiddleware, requireRole(UserRole.ADMIN, UserRole.TEACHER), remove);

export default router;
