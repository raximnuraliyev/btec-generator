import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { 
  createIssue, 
  getUserIssues, 
  getIssueById, 
  deleteIssue 
} from '../controllers/issue.controller';

const router = Router();

router.use(authMiddleware);

router.post('/', createIssue);
router.get('/', getUserIssues);
router.get('/:id', getIssueById);
router.delete('/:id', deleteIssue);

export default router;
