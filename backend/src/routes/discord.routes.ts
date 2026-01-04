/**
 * Discord Routes - API endpoints for Discord integration
 */

import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { discordService } from '../services/discord.service';

const router = Router();

/**
 * POST /discord/generate-code
 * Generate a verification code for Discord linking
 */
router.post('/generate-code', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthRequest).user!;
    const result = await discordService.generateVerificationCode(userId);
    
    res.json({
      code: result.code,
      expiresAt: result.expiresAt.toISOString(),
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    console.error('[DISCORD_ROUTES] Generate code error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to generate code' 
    });
  }
});

/**
 * GET /discord/status
 * Get Discord link status for current user
 */
router.get('/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthRequest).user!;
    const status = await discordService.getDiscordStatus(userId);
    
    res.json({
      linked: status.linked,
      discordUserId: status.discordUserId,
      activeCode: status.activeCode ? {
        code: status.activeCode.code,
        expiresAt: status.activeCode.expiresAt.toISOString(),
      } : null,
    });
  } catch (error) {
    console.error('[DISCORD_ROUTES] Status error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get status' 
    });
  }
});

/**
 * DELETE /discord/unlink
 * Unlink Discord account from current user
 */
router.delete('/unlink', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthRequest).user!;
    const success = await discordService.unlinkDiscord(userId);
    
    res.json({ unlinked: success });
  } catch (error) {
    console.error('[DISCORD_ROUTES] Unlink error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to unlink' 
    });
  }
});

export default router;
