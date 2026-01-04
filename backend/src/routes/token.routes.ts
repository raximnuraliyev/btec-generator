import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import {
  getTokenBalance,
  getTokenHistory,
  upgradePlan,
  TOKEN_PLANS,
} from '../services/token.service';

const router = Router();

// Get token balance
router.get('/balance', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const balance = await getTokenBalance(req.user!.userId);
    res.json(balance);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get token transaction history
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const history = await getTokenHistory(req.user!.userId, limit);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get available plans
router.get('/plans', (_req, res: Response) => {
  const plans = Object.entries(TOKEN_PLANS).map(([type, config]) => ({
    type,
    ...config,
    features: getFeatures(type as keyof typeof TOKEN_PLANS),
  }));
  res.json({ plans });
});

// Upgrade plan
router.post('/upgrade', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { planType } = req.body;

    if (!TOKEN_PLANS[planType as keyof typeof TOKEN_PLANS]) {
      res.status(400).json({ message: 'Invalid plan type' });
      return;
    }

    const plan = await upgradePlan(req.user!.userId, planType);
    res.json({ success: true, newBalance: plan });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

function getFeatures(planType: keyof typeof TOKEN_PLANS): string[] {
  const features: Record<keyof typeof TOKEN_PLANS, string[]> = {
    FREE: [
      '5,000 tokens per month',
      'Basic support',
      'Standard generation speed',
    ],
    BASIC: [
      '50,000 tokens per month',
      'Priority support',
      'Faster generation',
      'Save drafts',
    ],
    PRO: [
      '200,000 tokens per month',
      'Premium support',
      'Fastest generation',
      'Advanced features',
      'Save unlimited drafts',
    ],
    UNLIMITED: [
      'Unlimited tokens',
      'VIP support',
      'Maximum speed',
      'All features',
      'Priority queue',
    ],
  };
  return features[planType];
}

export default router;
