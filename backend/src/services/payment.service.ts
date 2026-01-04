// =============================================================================
// BTEC GENERATOR - PAYMENT SERVICE
// =============================================================================
// Handles manual payment processing with unique suffix matching.
// Default Card: 9680 3501 4687 8359 (HUMO/UZCARD)
// Card can be changed via Discord command by super admin
// =============================================================================

import { prisma } from '../lib/prisma';
import type { PaymentStatus as PaymentStatusType, PaymentPlanType as PaymentPlanTypeType, PaymentMethod as PaymentMethodType } from '@prisma/client';
import { Grade } from '@prisma/client';
import { discordEvents } from '../discord/events';

// Type definitions for payment enums
export type PaymentStatus = PaymentStatusType;
export type PaymentMethod = PaymentMethodType;
export type PaymentPlanType = PaymentPlanTypeType;

// =============================================================================
// PRICING CONFIGURATION
// =============================================================================

export const PAYMENT_PLANS = {
  P: {
    name: 'Pass Only',
    basePrice: 30000,        // 30,000 UZS
    tokensPerMonth: 20000,
    assignments: 5,
    grades: ['PASS'] as Grade[],
    durationDays: 30,
  },
  PM: {
    name: 'Pass + Merit',
    basePrice: 50000,        // 50,000 UZS
    tokensPerMonth: 50000,
    assignments: 10,
    grades: ['PASS', 'MERIT'] as Grade[],
    durationDays: 30,
  },
  PMD: {
    name: 'Pass + Merit + Distinction',
    basePrice: 70000,        // 70,000 UZS
    tokensPerMonth: 100000,
    assignments: 20,
    grades: ['PASS', 'MERIT', 'DISTINCTION'] as Grade[],
    durationDays: 30,
  },
  CUSTOM: {
    name: 'Custom Plan',
    basePrice: 0,            // Calculated based on tokens
    tokensPerMonth: 0,
    assignments: 1,
    grades: [] as Grade[],
    durationDays: 30,
  },
};

// Custom plan pricing: 1 UZS per 10 tokens (minimum 5000 tokens = 500 UZS)
export const CUSTOM_PLAN_RATE = 0.1; // UZS per token
export const MIN_CUSTOM_TOKENS = 5000;

// Default payment card - can be overridden by database setting
export const DEFAULT_PAYMENT_CARD = '9680 3501 4687 8359';
export const PAYMENT_EXPIRATION_HOURS = 24;

// Get payment card from database or use default
export async function getPaymentCard(): Promise<string> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'PAYMENT_CARD' }
    });
    return setting?.value || DEFAULT_PAYMENT_CARD;
  } catch {
    return DEFAULT_PAYMENT_CARD;
  }
}

// Export for backward compatibility (sync version uses default)
export const PAYMENT_CARD = DEFAULT_PAYMENT_CARD;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a unique 2-digit suffix (01-99) that isn't currently in use
 */
async function generateUniqueSuffix(): Promise<number> {
  // Get all active payment suffixes
  const activePayments = await prisma.paymentTransaction.findMany({
    where: {
      status: 'WAITING_PAYMENT',
      expiresAt: { gt: new Date() },
    },
    select: { uniqueSuffix: true },
  });

  const usedSuffixes = new Set(activePayments.map(p => p.uniqueSuffix));

  // Find an available suffix (01-99)
  const availableSuffixes: number[] = [];
  for (let i = 1; i <= 99; i++) {
    if (!usedSuffixes.has(i)) {
      availableSuffixes.push(i);
    }
  }

  if (availableSuffixes.length === 0) {
    throw new Error('No available payment slots. Please try again later.');
  }

  // Pick a random available suffix
  const randomIndex = Math.floor(Math.random() * availableSuffixes.length);
  return availableSuffixes[randomIndex];
}

/**
 * Calculate final amount with suffix
 */
function calculateFinalAmount(baseAmount: number, suffix: number): number {
  // Final amount = base + suffix/100
  // e.g., 50000 + 37/100 = 50000.37
  return baseAmount + suffix / 100;
}

/**
 * Calculate custom plan price
 */
export function calculateCustomPlanPrice(tokens: number): number {
  if (tokens < MIN_CUSTOM_TOKENS) {
    throw new Error(`Minimum tokens for custom plan is ${MIN_CUSTOM_TOKENS}`);
  }
  return Math.ceil(tokens * CUSTOM_PLAN_RATE);
}

// =============================================================================
// PAYMENT CREATION
// =============================================================================

interface CreatePaymentParams {
  userId: string;
  planType: PaymentPlanType;
  paymentMethod?: PaymentMethod;
  // For custom plans
  customTokens?: number;
  customGrade?: Grade;
}

export async function createPayment(params: CreatePaymentParams) {
  const { userId, planType, paymentMethod = 'HUMO', customTokens, customGrade } = params;

  // Check if user has an active pending payment
  const existingPayment = await prisma.paymentTransaction.findFirst({
    where: {
      userId,
      status: 'WAITING_PAYMENT',
      expiresAt: { gt: new Date() },
    },
  });

  if (existingPayment) {
    throw new Error('You have an active pending payment. Please wait for it to be processed or expire.');
  }

  // Calculate base amount
  let baseAmount: number;
  if (planType === 'CUSTOM') {
    if (!customTokens || !customGrade) {
      throw new Error('Custom plan requires tokens and grade selection');
    }
    baseAmount = calculateCustomPlanPrice(customTokens);
  } else {
    baseAmount = PAYMENT_PLANS[planType].basePrice;
  }

  // Generate unique suffix
  const uniqueSuffix = await generateUniqueSuffix();
  const finalAmount = calculateFinalAmount(baseAmount, uniqueSuffix);

  // Calculate expiration (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + PAYMENT_EXPIRATION_HOURS);

  // Create payment transaction
  const payment = await prisma.paymentTransaction.create({
    data: {
      userId,
      planType,
      customTokens: planType === 'CUSTOM' ? customTokens : null,
      customGrade: planType === 'CUSTOM' ? customGrade : null,
      baseAmount,
      uniqueSuffix,
      finalAmount,
      paymentMethod,
      status: 'WAITING_PAYMENT',
      expiresAt,
    },
    include: {
      user: {
        select: { email: true, name: true, discordId: true },
      },
    },
  });

  // Emit Discord events
  discordEvents.paymentCreated(userId, payment.user.discordId, {
    paymentId: payment.id,
    amount: finalAmount,
    planType,
    expiresAt,
  });

  // Notify admin about new pending payment
  discordEvents.paymentPending(userId, {
    paymentId: payment.id,
    amount: finalAmount,
    planType,
    userName: payment.user.name || 'Unknown',
    userEmail: payment.user.email,
  });

  const cardNumber = await getPaymentCard();
  
  return {
    payment,
    cardNumber,
    instructions: {
      cardNumber,
      exactAmount: finalAmount,
      expiresAt,
      warnings: [
        'Pay the EXACT amount shown (including decimal)',
        'No refunds after payment',
        'One payment = one plan activation',
        'Manual approval may take up to 12 hours',
        'This is for educational assistance only',
      ],
    },
  };
}

// =============================================================================
// PAYMENT QUERIES
// =============================================================================

export async function getUserPayments(userId: string) {
  return prisma.paymentTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

export async function getActivePayment(userId: string) {
  return prisma.paymentTransaction.findFirst({
    where: {
      userId,
      status: 'WAITING_PAYMENT',
      expiresAt: { gt: new Date() },
    },
  });
}

export async function getPaymentById(paymentId: string) {
  return prisma.paymentTransaction.findUnique({
    where: { id: paymentId },
    include: {
      user: {
        select: { id: true, email: true, name: true },
      },
    },
  });
}

// =============================================================================
// ADMIN: GET PENDING PAYMENTS
// =============================================================================

interface GetPendingPaymentsOptions {
  status?: PaymentStatus;
  page?: number;
  limit?: number;
}

export async function getPendingPayments(options: GetPendingPaymentsOptions = {}) {
  const { status = 'WAITING_PAYMENT', page = 1, limit = 50 } = options;

  const where = status ? { status } : {};

  const [payments, total] = await Promise.all([
    prisma.paymentTransaction.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.paymentTransaction.count({ where }),
  ]);

  return {
    payments,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getAllPayments(page: number = 1, limit: number = 50, filters?: {
  status?: PaymentStatus;
  userId?: string;
}) {
  const where: any = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.userId) where.userId = filters.userId;

  const [payments, total] = await Promise.all([
    prisma.paymentTransaction.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.paymentTransaction.count({ where }),
  ]);

  return {
    payments,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// =============================================================================
// ADMIN: FIND PAYMENT BY AMOUNT
// =============================================================================

export async function findPaymentByAmount(amount: number) {
  // Find pending payment with matching final amount
  return prisma.paymentTransaction.findFirst({
    where: {
      finalAmount: amount,
      status: 'WAITING_PAYMENT',
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: { id: true, email: true, name: true },
      },
    },
  });
}

// =============================================================================
// ADMIN: APPROVE PAYMENT
// =============================================================================

export async function approvePayment(paymentId: string, adminUserId: string) {
  const payment = await prisma.paymentTransaction.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.status !== 'WAITING_PAYMENT') {
    throw new Error('Payment is not in waiting status');
  }

  // Determine plan benefits
  let tokensGranted: number;
  let assignmentsGranted: number;
  let gradesGranted: string[];
  let durationDays: number;

  if (payment.planType === 'CUSTOM') {
    tokensGranted = payment.customTokens || 0;
    assignmentsGranted = 1;
    gradesGranted = payment.customGrade ? [payment.customGrade] : [];
    durationDays = PAYMENT_PLANS.CUSTOM.durationDays;
  } else {
    const planConfig = PAYMENT_PLANS[payment.planType];
    tokensGranted = planConfig.tokensPerMonth;
    assignmentsGranted = planConfig.assignments;
    gradesGranted = planConfig.grades;
    durationDays = planConfig.durationDays;
  }

  // Calculate plan expiration
  const planExpiresAt = new Date();
  planExpiresAt.setDate(planExpiresAt.getDate() + durationDays);

  // Update payment status
  const updatedPayment = await prisma.paymentTransaction.update({
    where: { id: paymentId },
    data: {
      status: 'PAID',
      approvedAt: new Date(),
      approvedByAdminId: adminUserId,
      assignmentsGranted,
      tokensGranted,
      gradesGranted,
      planExpiresAt,
    },
  });

  // Activate user's token plan
  await prisma.tokenPlan.upsert({
    where: { userId: payment.userId },
    create: {
      userId: payment.userId,
      planType: payment.planType === 'CUSTOM' ? 'BASIC' : 
                payment.planType === 'P' ? 'BASIC' :
                payment.planType === 'PM' ? 'PRO' : 'UNLIMITED',
      tokensPerMonth: tokensGranted,
      tokensRemaining: tokensGranted,
      resetAt: planExpiresAt,
      activatedAt: new Date(),
      expiresAt: planExpiresAt,
    },
    update: {
      planType: payment.planType === 'CUSTOM' ? 'BASIC' : 
                payment.planType === 'P' ? 'BASIC' :
                payment.planType === 'PM' ? 'PRO' : 'UNLIMITED',
      tokensPerMonth: tokensGranted,
      tokensRemaining: { increment: tokensGranted },
      resetAt: planExpiresAt,
      activatedAt: new Date(),
      expiresAt: planExpiresAt,
    },
  });

  // Create token transaction log
  await prisma.tokenTransaction.create({
    data: {
      userId: payment.userId,
      tokensUsed: -tokensGranted, // Negative = tokens added
      tokensRemaining: tokensGranted,
      purpose: `PAYMENT_ACTIVATION_${payment.planType}`,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      adminUserId,
      action: 'PAYMENT_APPROVED',
      targetType: 'PAYMENT',
      targetId: paymentId,
      previousValue: { status: 'WAITING_PAYMENT' },
      newValue: {
        status: 'PAID',
        tokensGranted,
        assignmentsGranted,
        gradesGranted,
      },
    },
  });

  // Get user's Discord ID for notification
  const user = await prisma.user.findUnique({
    where: { id: payment.userId },
    select: { discordId: true },
  });

  // Emit Discord event for payment approved
  discordEvents.paymentApproved(payment.userId, user?.discordId || null, {
    paymentId,
    planType: payment.planType,
    tokensGranted,
    expiresAt: planExpiresAt,
  });

  return updatedPayment;
}

// =============================================================================
// ADMIN: REJECT PAYMENT
// =============================================================================

export async function rejectPayment(paymentId: string, adminUserId: string, reason: string) {
  const payment = await prisma.paymentTransaction.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.status !== 'WAITING_PAYMENT') {
    throw new Error('Payment is not in waiting status');
  }

  const updatedPayment = await prisma.paymentTransaction.update({
    where: { id: paymentId },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      approvedByAdminId: adminUserId,
      rejectionReason: reason,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      adminUserId,
      action: 'PAYMENT_REJECTED',
      targetType: 'PAYMENT',
      targetId: paymentId,
      previousValue: { status: 'WAITING_PAYMENT' },
      newValue: { status: 'REJECTED', reason },
    },
  });

  // Get user's Discord ID for notification
  const user = await prisma.user.findUnique({
    where: { id: payment.userId },
    select: { discordId: true },
  });

  // Emit Discord event for payment rejected
  discordEvents.paymentRejected(payment.userId, user?.discordId || null, {
    paymentId,
    reason,
  });

  return updatedPayment;
}

// =============================================================================
// CANCEL PAYMENT (User)
// =============================================================================

export async function cancelPayment(paymentId: string, userId: string) {
  const payment = await prisma.paymentTransaction.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.userId !== userId) {
    throw new Error('Unauthorized');
  }

  if (payment.status !== 'WAITING_PAYMENT') {
    throw new Error('Payment cannot be cancelled');
  }

  return prisma.paymentTransaction.update({
    where: { id: paymentId },
    data: {
      status: 'EXPIRED',
    },
  });
}

// =============================================================================
// EXPIRE OLD PAYMENTS (Cron Job)
// =============================================================================

export async function expireOldPayments() {
  const result = await prisma.paymentTransaction.updateMany({
    where: {
      status: 'WAITING_PAYMENT',
      expiresAt: { lt: new Date() },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  console.log(`[PAYMENT_CRON] Expired ${result.count} payments`);
  return result.count;
}

// =============================================================================
// PAYMENT STATISTICS
// =============================================================================

export async function getPaymentStats() {
  const [
    totalPayments,
    pendingPayments,
    approvedPayments,
    rejectedPayments,
    expiredPayments,
    totalRevenue,
  ] = await Promise.all([
    prisma.paymentTransaction.count(),
    prisma.paymentTransaction.count({ where: { status: 'WAITING_PAYMENT' } }),
    prisma.paymentTransaction.count({ where: { status: 'PAID' } }),
    prisma.paymentTransaction.count({ where: { status: 'REJECTED' } }),
    prisma.paymentTransaction.count({ where: { status: 'EXPIRED' } }),
    prisma.paymentTransaction.aggregate({
      where: { status: 'PAID' },
      _sum: { baseAmount: true },
    }),
  ]);

  return {
    totalPayments,
    pendingPayments,
    approvedPayments,
    rejectedPayments,
    expiredPayments,
    totalRevenue: totalRevenue._sum.baseAmount || 0,
  };
}

// =============================================================================
// GET AVAILABLE PLANS
// =============================================================================

export function getAvailablePlans() {
  return Object.entries(PAYMENT_PLANS).map(([type, config]) => ({
    type: type as PaymentPlanType,
    name: config.name,
    price: config.basePrice,
    priceFormatted: config.basePrice.toLocaleString('uz-UZ') + ' UZS',
    tokensPerMonth: config.tokensPerMonth,
    assignments: config.assignments,
    grades: config.grades,
    durationDays: config.durationDays,
    isCustom: type === 'CUSTOM',
  }));
}
