/**
 * Discord Service - Backend service for Discord integration
 * Handles verification codes for account linking
 */

import { prisma } from '../lib/prisma';
import crypto from 'crypto';

// In-memory store for verification codes (can be moved to Redis for production)
interface VerificationCode {
  code: string;
  userId: string;
  email: string;
  expiresAt: Date;
}

const verificationCodes = new Map<string, VerificationCode>();

// Clean up expired codes every minute
setInterval(() => {
  const now = new Date();
  for (const [code, data] of verificationCodes) {
    if (data.expiresAt < now) {
      verificationCodes.delete(code);
    }
  }
}, 60000);

/**
 * Generate a 6-character verification code
 */
function generateCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

/**
 * Generate a verification code for a user to link their Discord account
 */
export async function generateVerificationCode(userId: string): Promise<{
  code: string;
  expiresAt: Date;
  expiresIn: number;
}> {
  // Get user email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Remove any existing codes for this user
  for (const [code, data] of verificationCodes) {
    if (data.userId === userId) {
      verificationCodes.delete(code);
    }
  }

  // Generate new code
  let code = generateCode();
  
  // Make sure code is unique
  while (verificationCodes.has(code)) {
    code = generateCode();
  }

  const expiresIn = 5 * 60; // 5 minutes
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  verificationCodes.set(code, {
    code,
    userId,
    email: user.email,
    expiresAt,
  });

  return { code, expiresAt, expiresIn };
}

/**
 * Verify a code and link the Discord account
 */
export async function verifyAndLinkDiscord(
  code: string,
  discordUserId: string
): Promise<{ success: boolean; message: string; email?: string }> {
  const verification = verificationCodes.get(code.toUpperCase());

  if (!verification) {
    return { success: false, message: 'Invalid or expired verification code' };
  }

  if (verification.expiresAt < new Date()) {
    verificationCodes.delete(code);
    return { success: false, message: 'Verification code has expired' };
  }

  // Check if Discord ID is already linked to another account
  const existingLink = await prisma.user.findUnique({
    where: { discordId: discordUserId },
  });

  if (existingLink && existingLink.id !== verification.userId) {
    return { 
      success: false, 
      message: 'This Discord account is already linked to another user. Use `!unlink` first.' 
    };
  }

  // Link the Discord account
  await prisma.user.update({
    where: { id: verification.userId },
    data: { discordId: discordUserId },
  });

  // Remove the used code
  verificationCodes.delete(code.toUpperCase());

  return { 
    success: true, 
    message: `Successfully linked to ${verification.email}!`,
    email: verification.email 
  };
}

/**
 * Get Discord link status for a user
 */
export async function getDiscordStatus(userId: string): Promise<{
  linked: boolean;
  discordUserId: string | null;
  activeCode: { code: string; expiresAt: Date } | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { discordId: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check for active verification code
  let activeCode: { code: string; expiresAt: Date } | null = null;
  for (const [, data] of verificationCodes) {
    if (data.userId === userId && data.expiresAt > new Date()) {
      activeCode = { code: data.code, expiresAt: data.expiresAt };
      break;
    }
  }

  return {
    linked: !!user.discordId,
    discordUserId: user.discordId,
    activeCode,
  };
}

/**
 * Unlink Discord account from user
 */
export async function unlinkDiscord(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { discordId: true },
  });

  if (!user || !user.discordId) {
    return false;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { discordId: null },
  });

  return true;
}

/**
 * Unlink Discord by Discord user ID
 */
export async function unlinkDiscordByDiscordId(discordUserId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { discordId: discordUserId },
  });

  if (!user) {
    return false;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { discordId: null },
  });

  return true;
}

export const discordService = {
  generateVerificationCode,
  verifyAndLinkDiscord,
  getDiscordStatus,
  unlinkDiscord,
  unlinkDiscordByDiscordId,
};
