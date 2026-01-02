import { Router } from 'express';
import { createProfile, getProfile } from '../controllers/student.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.post('/profile', authMiddleware, createProfile);
router.get('/profile', authMiddleware, getProfile);

export default router;
