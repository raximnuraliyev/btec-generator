import { Router } from 'express';
import { register, login, getProfile, logout } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getProfile);
router.post('/logout', authMiddleware, logout);

export default router;
