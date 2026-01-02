import { prisma } from '../lib/prisma';

export const TOKEN_PLANS = {
  FREE: { tokensPerMonth: 5000, price: 0 },
  BASIC: { tokensPerMonth: 50000, price: 9.99 },
  PRO: { tokensPerMonth: 200000, price: 29.99 },
  UNLIMITED: { tokensPerMonth: -1, price: 99.99 }, // -1 means unlimited
};

export async function initializeTokenPlan(userId: string) {
  const existing = await prisma.tokenPlan.findUnique({
    where: { userId },
  });

  if (existing) {
    return existing;
  }

  const plan = await prisma.tokenPlan.create({
    data: {
      userId,
      planType: 'FREE',
      tokensPerMonth: TOKEN_PLANS.FREE.tokensPerMonth,
      tokensRemaining: TOKEN_PLANS.FREE.tokensPerMonth,
      resetAt: getNextMonthDate(),
    },
  });

  return plan;
}

export async function getTokenBalance(userId: string) {
  let plan = await prisma.tokenPlan.findUnique({
    where: { userId },
  });

  if (!plan) {
    plan = await initializeTokenPlan(userId);
  }

  // Check if plan needs reset
  if (plan.resetAt && new Date() > plan.resetAt) {
    plan = await resetTokenPlan(userId);
  }

  return {
    planType: plan.planType,
    tokensPerMonth: plan.tokensPerMonth,
    tokensRemaining: plan.tokensRemaining,
    resetAt: plan.resetAt,
  };
}

export async function deductTokens(
  userId: string,
  tokensUsed: number,
  assignmentId: string | null,
  purpose: string
) {
  const plan = await prisma.tokenPlan.findUnique({
    where: { userId },
  });

  if (!plan) {
    throw new Error('Token plan not initialized');
  }

  // Unlimited plan doesn't deduct
  if (plan.planType === 'UNLIMITED') {
    await prisma.tokenTransaction.create({
      data: {
        userId,
        assignmentId,
        tokensUsed,
        tokensRemaining: -1, // Unlimited
        purpose,
      },
    });
    return;
  }

  // Check if enough tokens
  if (plan.tokensRemaining < tokensUsed) {
    throw new Error(
      `Insufficient tokens. You have ${plan.tokensRemaining} tokens remaining, but need ${tokensUsed}`
    );
  }

  // Deduct tokens
  const updated = await prisma.tokenPlan.update({
    where: { userId },
    data: {
      tokensRemaining: plan.tokensRemaining - tokensUsed,
    },
  });

  // Log transaction
  await prisma.tokenTransaction.create({
    data: {
      userId,
      assignmentId,
      tokensUsed,
      tokensRemaining: updated.tokensRemaining,
      purpose,
    },
  });

  return updated;
}

export async function upgradePlan(userId: string, newPlanType: keyof typeof TOKEN_PLANS) {
  const planConfig = TOKEN_PLANS[newPlanType];

  const plan = await prisma.tokenPlan.upsert({
    where: { userId },
    create: {
      userId,
      planType: newPlanType,
      tokensPerMonth: planConfig.tokensPerMonth,
      tokensRemaining: planConfig.tokensPerMonth,
      resetAt: getNextMonthDate(),
    },
    update: {
      planType: newPlanType,
      tokensPerMonth: planConfig.tokensPerMonth,
      tokensRemaining: planConfig.tokensPerMonth,
      resetAt: getNextMonthDate(),
      activatedAt: new Date(),
    },
  });

  return plan;
}

export async function resetTokenPlan(userId: string) {
  const plan = await prisma.tokenPlan.findUnique({
    where: { userId },
  });

  if (!plan) {
    throw new Error('Token plan not found');
  }

  const updated = await prisma.tokenPlan.update({
    where: { userId },
    data: {
      tokensRemaining: plan.tokensPerMonth,
      resetAt: getNextMonthDate(),
    },
  });

  return updated;
}

export async function getTokenHistory(userId: string, limit = 50) {
  const transactions = await prisma.tokenTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return transactions;
}

function getNextMonthDate(): Date {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}
