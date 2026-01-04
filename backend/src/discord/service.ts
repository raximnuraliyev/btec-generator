/**
 * Discord Bot Service
 * Handles data retrieval and actions for bot commands
 */

import { prisma } from '../lib/prisma';
import { SUPER_ADMIN_DISCORD_ID, WebsiteRole } from './types';

export class DiscordBotService {
  // ============================================
  // USER LINKING & VERIFICATION
  // ============================================
  
  async getUserByDiscordId(discordId: string) {
    return prisma.user.findFirst({
      where: { discordId },
      include: {
        studentProfile: true,
        tokenPlan: true,
      },
    });
  }

  async linkDiscordAccount(discordId: string, email: string): Promise<{ success: boolean; message: string; user?: any }> {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return { success: false, message: 'No account found with this email' };
    }

    if (user.discordId && user.discordId !== discordId) {
      return { success: false, message: 'This account is already linked to another Discord account' };
    }

    const existingLink = await prisma.user.findFirst({ where: { discordId } });
    if (existingLink && existingLink.id !== user.id) {
      return { success: false, message: 'This Discord account is already linked to another user' };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { discordId },
    });

    return { success: true, message: 'Account linked successfully', user };
  }

  async unlinkDiscordAccount(discordId: string): Promise<boolean> {
    const user = await prisma.user.findFirst({ where: { discordId } });
    if (!user) return false;

    await prisma.user.update({
      where: { id: user.id },
      data: { discordId: null },
    });
    return true;
  }

  isAdmin(discordId: string, userRole?: string): boolean {
    return discordId === SUPER_ADMIN_DISCORD_ID || userRole === 'ADMIN';
  }

  // ============================================
  // OVERVIEW & STATS
  // ============================================

  async getOverview() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const [
      totalUsers,
      activeUsersToday,
      totalAssignments,
      assignmentsToday,
      pendingPayments,
      totalTokensUsed,
      completedAssignments,
      failedAssignments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastGenerationAt: { gte: startOfDay } } }),
      prisma.assignment.count(),
      prisma.assignment.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.paymentTransaction.count({ where: { status: 'WAITING_PAYMENT' } }),
      prisma.user.aggregate({ _sum: { totalTokensUsedAllTime: true } }),
      prisma.assignment.count({ where: { status: 'COMPLETED' } }),
      prisma.assignment.count({ where: { status: 'FAILED' } }),
    ]);

    return {
      totalUsers,
      activeUsersToday,
      totalAssignments,
      assignmentsToday,
      pendingPayments,
      totalTokensUsed: totalTokensUsed._sum.totalTokensUsedAllTime || 0,
      completedAssignments,
      failedAssignments,
    };
  }

  // ============================================
  // PAYMENT OPERATIONS
  // ============================================

  async getPendingPayments(limit = 10) {
    return prisma.paymentTransaction.findMany({
      where: { status: 'WAITING_PAYMENT' },
      include: { user: { include: { studentProfile: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getPaymentById(paymentId: string) {
    return prisma.paymentTransaction.findUnique({
      where: { id: paymentId },
      include: { user: { include: { studentProfile: true } } },
    });
  }

  async approvePayment(paymentId: string, adminDiscordId: string) {
    const payment = await prisma.paymentTransaction.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });

    if (!payment) {
      return { success: false, message: 'Payment not found' };
    }

    if (payment.status !== 'WAITING_PAYMENT') {
      return { success: false, message: `Payment already ${payment.status.toLowerCase()}` };
    }

    // Get admin user
    const admin = await prisma.user.findFirst({ where: { discordId: adminDiscordId } });
    const adminId = admin?.id || 'DISCORD_ADMIN';

    // Calculate grants based on plan type
    const planGrants = this.calculatePlanGrants(payment.planType, payment.customTokens, payment.customGrade);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Update payment
    await prisma.paymentTransaction.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        approvedAt: new Date(),
        approvedByAdminId: adminId,
        assignmentsGranted: planGrants.assignments,
        tokensGranted: planGrants.tokens,
        gradesGranted: planGrants.grades,
        planExpiresAt: expiresAt,
      },
    });

    // Update user token plan
    await prisma.tokenPlan.upsert({
      where: { userId: payment.userId },
      create: {
        userId: payment.userId,
        planType: 'PAID',
        tokensPerMonth: planGrants.tokens,
        tokensRemaining: planGrants.tokens,
        resetAt: expiresAt,
        activatedAt: new Date(),
        expiresAt: expiresAt,
      },
      update: {
        planType: 'PAID',
        tokensRemaining: { increment: planGrants.tokens },
        expiresAt: expiresAt,
        activatedAt: new Date(),
      },
    });

    // Log transaction
    await prisma.tokenTransaction.create({
      data: {
        userId: payment.userId,
        tokensUsed: planGrants.tokens,
        tokensRemaining: planGrants.tokens,
        purpose: `Payment approved: ${payment.planType} plan (${paymentId})`,
      },
    });

    return {
      success: true,
      message: 'Payment approved',
      payment,
      grants: planGrants,
      expiresAt,
    };
  }

  async rejectPayment(paymentId: string, adminDiscordId: string, reason: string) {
    const payment = await prisma.paymentTransaction.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });

    if (!payment) {
      return { success: false, message: 'Payment not found' };
    }

    if (payment.status !== 'WAITING_PAYMENT') {
      return { success: false, message: `Payment already ${payment.status.toLowerCase()}` };
    }

    const admin = await prisma.user.findFirst({ where: { discordId: adminDiscordId } });
    const adminId = admin?.id || 'DISCORD_ADMIN';

    await prisma.paymentTransaction.update({
      where: { id: paymentId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        approvedByAdminId: adminId,
        rejectionReason: reason,
      },
    });

    return { success: true, message: 'Payment rejected', payment, reason };
  }

  private calculatePlanGrants(planType: string, customTokens?: number | null, customGrade?: string | null) {
    const plans: Record<string, { tokens: number; assignments: number; grades: string[] }> = {
      P: { tokens: 150000, assignments: 7, grades: ['PASS'] },
      PM: { tokens: 250000, assignments: 7, grades: ['PASS', 'MERIT'] },
      PMD: { tokens: 350000, assignments: 7, grades: ['PASS', 'MERIT', 'DISTINCTION'] },
      CUSTOM: { 
        tokens: customTokens || 10000, 
        assignments: Math.floor((customTokens || 10000) / 20000), 
        grades: customGrade ? [customGrade] : ['PASS'] 
      },
    };

    return plans[planType] || plans.P;
  }

  // ============================================
  // USER OPERATIONS
  // ============================================

  async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        tokenPlan: true,
        assignments: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
  }

  async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
        tokenPlan: true,
      },
    });
  }

  async setUserRole(userId: string, role: WebsiteRole) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, message: 'User not found' };

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return { success: true, message: `Role updated to ${role}`, user };
  }

  async addTokensToUser(userId: string, amount: number, adminDiscordId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, message: 'User not found' };

    const tokenPlan = await prisma.tokenPlan.upsert({
      where: { userId },
      create: {
        userId,
        planType: 'PAID',
        tokensPerMonth: amount,
        tokensRemaining: amount,
        resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        activatedAt: new Date(),
      },
      update: {
        tokensRemaining: { increment: amount },
      },
    });

    await prisma.tokenTransaction.create({
      data: {
        userId,
        tokensUsed: amount,
        tokensRemaining: tokenPlan.tokensRemaining,
        purpose: `Admin grant via Discord (by ${adminDiscordId})`,
      },
    });

    return { success: true, message: `Added ${amount} tokens`, newBalance: tokenPlan.tokensRemaining };
  }

  async suspendUser(userId: string, reason: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, message: 'User not found' };

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
    });

    return { success: true, message: 'User suspended', user, reason };
  }

  async unsuspendUser(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });
    return { success: true, message: 'User activated' };
  }

  // ============================================
  // ASSIGNMENT OPERATIONS
  // ============================================

  async getUserAssignments(userId: string, limit = 10) {
    return prisma.assignment.findMany({
      where: { userId },
      include: { snapshot: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getAssignmentStatus(assignmentId: string) {
    return prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { snapshot: true, user: true },
    });
  }

  // ============================================
  // BRIEF OPERATIONS (TEACHER)
  // ============================================

  async getTeacherBriefs(userId: string) {
    return prisma.brief.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBriefById(briefId: string) {
    return prisma.brief.findUnique({
      where: { id: briefId },
    });
  }

  async publishBrief(briefId: string) {
    const brief = await prisma.brief.findUnique({ where: { id: briefId } });
    if (!brief) return { success: false, message: 'Brief not found' };

    await prisma.brief.update({
      where: { id: briefId },
      data: { status: 'PUBLISHED' },
    });

    return { success: true, message: 'Brief published' };
  }

  async unpublishBrief(briefId: string) {
    await prisma.brief.update({
      where: { id: briefId },
      data: { status: 'DRAFT' },
    });
    return { success: true, message: 'Brief unpublished' };
  }

  // ============================================
  // LOGS
  // ============================================

  async getRecentLogs(limit = 10) {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getAllUsers(limit = 20) {
    return prisma.user.findMany({
      include: { studentProfile: true, tokenPlan: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ============================================
  // PAYMENT CARD MANAGEMENT (Super Admin Only)
  // ============================================

  // Verification codes for payment card changes
  private cardChangeVerificationCodes = new Map<string, { code: string; newCard: string; expiresAt: Date }>();

  // Generate verification code for card change
  generateCardChangeCode(newCard: string): string {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.cardChangeVerificationCodes.set(SUPER_ADMIN_DISCORD_ID, {
      code,
      newCard,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });
    return code;
  }

  // Verify code and change payment card
  async verifyAndChangeCard(inputCode: string, discordId: string): Promise<{ success: boolean; message: string }> {
    if (discordId !== SUPER_ADMIN_DISCORD_ID) {
      return { success: false, message: 'Only super admin can change the payment card' };
    }

    const stored = this.cardChangeVerificationCodes.get(SUPER_ADMIN_DISCORD_ID);
    if (!stored) {
      return { success: false, message: 'No pending card change. Use `!admin set-card <new_card_number>` first.' };
    }

    if (new Date() > stored.expiresAt) {
      this.cardChangeVerificationCodes.delete(SUPER_ADMIN_DISCORD_ID);
      return { success: false, message: 'Verification code expired. Please request a new one.' };
    }

    if (stored.code !== inputCode.toUpperCase()) {
      return { success: false, message: 'Invalid verification code' };
    }

    // Update payment card in database
    await prisma.systemSetting.upsert({
      where: { key: 'PAYMENT_CARD' },
      create: { key: 'PAYMENT_CARD', value: stored.newCard, updatedBy: discordId },
      update: { value: stored.newCard, updatedBy: discordId },
    });

    this.cardChangeVerificationCodes.delete(SUPER_ADMIN_DISCORD_ID);
    return { success: true, message: `Payment card changed to: ${stored.newCard}` };
  }

  // Get current payment card
  async getCurrentPaymentCard(): Promise<string> {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'PAYMENT_CARD' }
    });
    return setting?.value || '9680 3501 4687 8359';
  }
}

export const discordBotService = new DiscordBotService();
