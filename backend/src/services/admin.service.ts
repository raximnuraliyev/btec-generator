// =============================================================================
// BTEC GENERATOR - ADMIN SERVICE
// =============================================================================
// All admin functionality for the new architecture.
// =============================================================================

import { prisma } from '../lib/prisma';
import { UserRole, AssignmentStatus } from '@prisma/client';

// Status type (matches schema but may not be exported from client yet)
type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';

// =============================================================================
// DASHBOARD & STATS
// =============================================================================

export const getDashboardStats = async () => {
  const [
    totalUsers,
    totalAssignments,
    totalBriefs,
    totalTokensUsed,
    activeUsers,
    completedAssignments,
    failedAssignments,
    generatingAssignments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.assignment.count(),
    prisma.brief.count(),
    prisma.user.aggregate({ _sum: { totalTokensUsedAllTime: true } }),
    prisma.user.count({
      where: {
        lastGenerationAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.assignment.count({ where: { status: 'COMPLETED' } }),
    prisma.assignment.count({ where: { status: 'FAILED' } }),
    prisma.assignment.count({ where: { status: 'GENERATING' } }),
  ]);

  return {
    totalUsers,
    totalAssignments,
    totalBriefs,
    totalTokensUsed: totalTokensUsed._sum.totalTokensUsedAllTime || 0,
    activeUsers,
    completedAssignments,
    failedAssignments,
    generatingAssignments,
  };
};

export const getOverviewStats = async () => {
  const [
    usersByRole,
    assignmentsByStatus,
    assignmentsByGrade,
    assignmentsByLevel,
    recentUsers,
    recentAssignments,
    newUsersThisWeek,
    newUsersThisMonth,
    totalUsers,
    totalAssignments,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.assignment.groupBy({ by: ['status'], _count: true }),
    prisma.assignment.groupBy({ by: ['grade'], _count: true }),
    prisma.resolvedBriefSnapshot.groupBy({ by: ['level'], _count: true }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.assignment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true } },
        snapshot: { select: { unitName: true } },
      },
    }),
    prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.user.count(),
    prisma.assignment.count(),
  ]);

  return {
    totals: await getDashboardStats(),
    usersByRole: Object.fromEntries(usersByRole.map((r: any) => [r.role, r._count])),
    assignmentsByStatus: Object.fromEntries(assignmentsByStatus.map((s: any) => [s.status, s._count])),
    recentUsers,
    recentAssignments,
    // Additional data for Analytics tab
    assignments: {
      total: totalAssignments,
      byGrade: Object.fromEntries(assignmentsByGrade.map((g: any) => [g.grade || 'Unknown', g._count])),
      byLevel: Object.fromEntries(assignmentsByLevel.map((l: any) => [`Level ${l.level}`, l._count])),
      byStatus: Object.fromEntries(assignmentsByStatus.map((s: any) => [s.status, s._count])),
    },
    users: {
      total: totalUsers,
      newThisWeek: newUsersThisWeek,
      newThisMonth: newUsersThisMonth,
      byRole: Object.fromEntries(usersByRole.map((r: any) => [r.role, r._count])),
    },
    generation: {
      avgTime: 0, // Would need actual tracking
      successRate: 0.95, // Placeholder
      failureReasons: [],
    },
  };
};

// =============================================================================
// USER MANAGEMENT
// =============================================================================

export const getAllUsers = async (page = 1, limit = 50, filters?: {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}) => {
  const skip = (page - 1) * limit;
  const where: any = {};

  if (filters?.search) {
    where.OR = [
      { email: { contains: filters.search, mode: 'insensitive' } },
      { name: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters?.role) where.role = filters.role;
  if (filters?.status) {
    // Convert lowercase status to uppercase enum value
    const statusMap: Record<string, string> = {
      'active': 'ACTIVE',
      'suspended': 'SUSPENDED',
      'banned': 'BANNED',
    };
    where.status = statusMap[filters.status.toLowerCase()] || filters.status;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      where,
      select: {
        id: true,
        email: true,
        role: true,
        totalTokensUsedAllTime: true,
        totalAssignmentsGenerated: true,
        lastGenerationAt: true,
        createdAt: true,
        studentProfile: {
          select: { fullName: true, universityName: true },
        },
        tokenPlan: {
          select: { planType: true, tokensRemaining: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUserDetails = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studentProfile: true,
      tokenPlan: true,
      assignments: {
        include: {
          snapshot: { select: { unitName: true, unitCode: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      issues: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!user) throw new Error('User not found');
  return user;
};

export const updateUserRole = async (userId: string, role: UserRole) => {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
};

export const updateUserStatus = async (userId: string, status: UserStatus) => {
  return prisma.user.update({
    where: { id: userId },
    data: { status } as any, // Cast due to Prisma client regeneration pending
  });
};

export const suspendUser = async (userId: string) => {
  return updateUserStatus(userId, 'SUSPENDED');
};

export const unsuspendUser = async (userId: string) => {
  return updateUserStatus(userId, 'ACTIVE');
};

export const banUser = async (userId: string) => {
  return updateUserStatus(userId, 'BANNED');
};

export const unbanUser = async (userId: string) => {
  return updateUserStatus(userId, 'ACTIVE');
};

// =============================================================================
// TOKEN MANAGEMENT
// =============================================================================

export const addUserTokens = async (userId: string, amount: number, reason: string) => {
  const tokenPlan = await prisma.tokenPlan.findUnique({ where: { userId } });
  if (!tokenPlan) throw new Error('User has no token plan');

  const newBalance = tokenPlan.tokensRemaining + amount;
  
  await prisma.$transaction([
    prisma.tokenPlan.update({
      where: { userId },
      data: { tokensRemaining: newBalance },
    }),
    prisma.tokenTransaction.create({
      data: {
        userId,
        tokensUsed: -amount,
        tokensRemaining: newBalance,
        purpose: `ADMIN_ADD: ${reason}`,
      },
    }),
  ]);

  return { newBalance };
};

export const deductUserTokens = async (userId: string, amount: number, reason: string) => {
  const tokenPlan = await prisma.tokenPlan.findUnique({ where: { userId } });
  if (!tokenPlan) throw new Error('User has no token plan');

  const newBalance = Math.max(0, tokenPlan.tokensRemaining - amount);
  
  await prisma.$transaction([
    prisma.tokenPlan.update({
      where: { userId },
      data: { tokensRemaining: newBalance },
    }),
    prisma.tokenTransaction.create({
      data: {
        userId,
        tokensUsed: amount,
        tokensRemaining: newBalance,
        purpose: `ADMIN_DEDUCT: ${reason}`,
      },
    }),
  ]);

  return { newBalance };
};

export const resetUserTokens = async (userId: string, reason?: string) => {
  const tokenPlan = await prisma.tokenPlan.findUnique({ where: { userId } });
  if (!tokenPlan) throw new Error('User has no token plan');

  const newBalance = tokenPlan.tokensPerMonth;
  
  await prisma.$transaction([
    prisma.tokenPlan.update({
      where: { userId },
      data: { 
        tokensRemaining: newBalance,
        resetAt: new Date(),
      },
    }),
    prisma.tokenTransaction.create({
      data: {
        userId,
        tokensUsed: 0,
        tokensRemaining: newBalance,
        purpose: `ADMIN_RESET: ${reason || 'Manual reset'}`,
      },
    }),
  ]);

  return { newBalance };
};

// =============================================================================
// ASSIGNMENT MANAGEMENT
// =============================================================================

export const getAllAssignments = async (page = 1, limit = 50, filters?: {
  status?: AssignmentStatus;
  grade?: string;
  level?: number;
  dateFrom?: Date;
  dateTo?: Date;
}) => {
  const skip = (page - 1) * limit;
  const where: any = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.grade) where.grade = filters.grade;
  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
    if (filters.dateTo) where.createdAt.lte = filters.dateTo;
  }
  if (filters?.level) {
    where.snapshot = { level: filters.level };
  }

  const [assignments, total] = await Promise.all([
    prisma.assignment.findMany({
      skip,
      take: limit,
      where,
      include: {
        user: { select: { email: true } },
        snapshot: { select: { unitName: true, unitCode: true, level: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.assignment.count({ where }),
  ]);

  return {
    assignments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const forceCompleteAssignment = async (assignmentId: string) => {
  return prisma.assignment.update({
    where: { id: assignmentId },
    data: { 
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });
};

export const cancelAssignment = async (assignmentId: string) => {
  return prisma.assignment.update({
    where: { id: assignmentId },
    data: { 
      status: 'FAILED',
      error: 'Cancelled by admin',
    },
  });
};

export const deleteAssignment = async (assignmentId: string) => {
  return prisma.assignment.delete({
    where: { id: assignmentId },
  });
};

export const downloadAnyAssignment = async (assignmentId: string) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      user: { select: { email: true } },
      snapshot: true,
    },
  });

  if (!assignment) throw new Error('Assignment not found');
  return assignment;
};

// =============================================================================
// BRIEF MANAGEMENT
// =============================================================================

export const getAllBriefs = async () => {
  return prisma.brief.findMany({
    include: {
      createdBy: { select: { id: true, email: true, role: true } },
      _count: { select: { snapshots: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// =============================================================================
// ANALYTICS
// =============================================================================

export const getAIUsageAnalytics = async (days = 7) => {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalLogs, totalTokens, byModel, byPurpose] = await Promise.all([
    prisma.aIUsageLog.count({ where: { createdAt: { gte: startDate } } }),
    prisma.aIUsageLog.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: { totalTokens: true },
    }),
    prisma.aIUsageLog.groupBy({
      by: ['aiModel'],
      where: { createdAt: { gte: startDate } },
      _count: true,
      _sum: { totalTokens: true },
    }),
    prisma.aIUsageLog.groupBy({
      by: ['purpose'],
      where: { createdAt: { gte: startDate } },
      _count: true,
      _sum: { totalTokens: true },
    }),
  ]);

  return {
    totalLogs,
    totalTokens: totalTokens._sum.totalTokens || 0,
    byModel,
    byPurpose,
  };
};

export const getTokenAnalytics = async (period: '24h' | '7d' | '30d' | '90d' | '1y' = '7d') => {
  const periodMap = {
    '24h': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  };
  const days = periodMap[period];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [summary, byUser, dailyData] = await Promise.all([
    prisma.aIUsageLog.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
      _count: true,
    }),
    prisma.aIUsageLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: startDate } },
      _sum: { totalTokens: true },
      orderBy: { _sum: { totalTokens: 'desc' } },
      take: 10,
    }),
    // Get daily breakdown
    prisma.$queryRaw<{ date: string; tokens: bigint; requests: bigint }[]>`
      SELECT 
        DATE("createdAt") as date,
        SUM("totalTokens") as tokens,
        COUNT(*) as requests
      FROM "AIUsageLog"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,
  ]);

  // Get user details for top users
  const userIds = byUser.map(u => u.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true },
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  return {
    period,
    summary: {
      totalTokens: summary._sum.totalTokens || 0,
      inputTokens: summary._sum.promptTokens || 0,
      outputTokens: summary._sum.completionTokens || 0,
      totalRequests: summary._count,
    },
    byUser: byUser.map(u => ({
      userId: u.userId,
      email: userMap.get(u.userId)?.email || 'Unknown',
      name: null, // Name field pending Prisma regeneration
      tokens: u._sum.totalTokens || 0,
    })),
    byDay: dailyData.map(d => ({
      date: d.date,
      tokens: Number(d.tokens) || 0,
      requests: Number(d.requests) || 0,
    })),
  };
};

export const getRecap = async (type: 'weekly' | 'monthly' | 'yearly' = 'weekly') => {
  const periodMap = { weekly: 7, monthly: 30, yearly: 365 };
  const days = periodMap[type];
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const prevStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

  const [currentStats, previousStats] = await Promise.all([
    getRecapStats(startDate, now),
    getRecapStats(prevStartDate, startDate),
  ]);

  return {
    type,
    period: { start: startDate.toISOString(), end: now.toISOString() },
    current: currentStats,
    previous: previousStats,
    growth: {
      users: calculateGrowth(previousStats.newUsers, currentStats.newUsers),
      assignments: calculateGrowth(previousStats.totalAssignments, currentStats.totalAssignments),
      tokens: calculateGrowth(previousStats.totalTokensUsed, currentStats.totalTokensUsed),
    },
  };
};

const getRecapStats = async (startDate: Date, endDate: Date) => {
  const [newUsers, assignments, tokens, byGrade] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: startDate, lt: endDate } } }),
    prisma.assignment.findMany({
      where: { createdAt: { gte: startDate, lt: endDate } },
      include: { snapshot: { select: { level: true } } },
    }),
    prisma.aIUsageLog.aggregate({
      where: { createdAt: { gte: startDate, lt: endDate } },
      _sum: { totalTokens: true },
    }),
    prisma.assignment.groupBy({
      by: ['grade'],
      where: { createdAt: { gte: startDate, lt: endDate } },
      _count: true,
    }),
  ]);

  return {
    newUsers,
    totalAssignments: assignments.length,
    completedAssignments: assignments.filter(a => a.status === 'COMPLETED').length,
    totalTokensUsed: tokens._sum.totalTokens || 0,
    assignmentsByGrade: Object.fromEntries(byGrade.map(g => [g.grade, g._count])),
    assignmentsByLevel: {},
  };
};

const calculateGrowth = (previous: number, current: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

// =============================================================================
// LOGGING
// =============================================================================

export const logAIUsage = async (data: {
  assignmentId?: string;
  userId?: string;
  userRole?: UserRole;
  aiProvider: string;
  aiModel: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  purpose: string;
}) => {
  try {
    // Only create log if we have a userId
    if (data.userId) {
      await prisma.aIUsageLog.create({ 
        data: {
          ...data,
          userRole: data.userRole || 'USER',
        } as any,
      });
    }
  } catch (error) {
    console.error('[AI USAGE] Failed to log:', error);
  }
};

export const getSystemLogs = async (page = 1, limit = 100, _filters?: {
  level?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) => {
  // SystemLog table not yet in schema - return empty result
  return {
    logs: [],
    pagination: { total: 0, page, limit, totalPages: 0 },
  };
};

export const getAuditLogs = async (page = 1, limit = 100, _filters?: {
  action?: string;
  adminUserId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) => {
  // AuditLog table not yet in schema - return empty result
  return {
    logs: [],
    pagination: { total: 0, page, limit, totalPages: 0 },
  };
};

export const createAuditLog = async (_data: {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  previousValue?: any;
  newValue?: any;
}) => {
  // AuditLog table not yet in schema - no-op
  return null;
};
