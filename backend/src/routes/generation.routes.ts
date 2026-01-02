import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  startGeneration,
  getGenerationStatus,
  getAssignmentContent,
} from '../services/generation.service';

const router = Router();

// Start generation for an assignment
router.post('/start/:assignmentId', authMiddleware, async (req, res) => {
  try {
    const result = await startGeneration(req.params.assignmentId, req.user!.userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get generation status
router.get('/status/:assignmentId', authMiddleware, async (req, res) => {
  try {
    const status = await getGenerationStatus(req.params.assignmentId, req.user!.userId);
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get assignment content (with all blocks)
router.get('/content/:assignmentId', authMiddleware, async (req, res) => {
  try {
    const content = await getAssignmentContent(req.params.assignmentId, req.user!.userId);
    res.json(content);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
