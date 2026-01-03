import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardStats = async () => {
  const [
    totalUsers,
    totalAssignments,
    totalTokensUsed,
    activeUsers,
    completedAssignments,
    failedAssignments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.assignment.count(),
    prisma.user.aggregate({
      _sum: { totalTokensUsedAllTime: true },
    }),
    prisma.user.count({
      where: {
        lastGenerationAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    }),
    prisma.assignment.count({ where: { status: 'COMPLETED' } }),
    prisma.assignment.count({ where: { status: 'FAILED' } }),
  ]);

  return {
    totalUsers,
    totalAssignments,
    totalTokensUsed: totalTokensUsed._sum.totalTokensUsedAllTime || 0,
    activeUsers,
    completedAssignments,
    failedAssignments,
  };
};

export const getAllUsers = async (page = 1, limit = 50) => {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        role: true,
        trialTokens: true,
        plan: true,
        totalTokensUsedAllTime: true,
        totalAssignmentsGenerated: true,
        lastGenerationAt: true,
        createdAt: true,
        studentProfile: {
          select: {
            fullName: true,
            universityName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getUserDetails = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studentProfile: true,
      assignments: {
        include: {
          snapshot: {
            select: {
              unitName: true,
              unitCode: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      userFlags: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Ensure assignments is always an array
  return {
    ...user,
    assignments: user.assignments || [],
    userFlags: user.userFlags || [],
  };
};

export const updateUserRole = async (userId: string, role: UserRole) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  return user;
};

export const resetUserTokens = async (userId: string, tokens: number) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { trialTokens: tokens },
  });

  return user;
};

export const getAIUsageAnalytics = async (days = 7) => {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalLogs, totalTokens, byModel, byUser, byLanguage] = await Promise.all([
    prisma.aIUsageLog.count({
      where: { createdAt: { gte: startDate } },
    }),
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
      by: ['userId'],
      where: { createdAt: { gte: startDate } },
      _count: true,
      _sum: { totalTokens: true },
      orderBy: { _sum: { totalTokens: 'desc' } },
      take: 10,
    }),
    prisma.assignment.groupBy({
      by: ['language'],
      where: { 
        createdAt: { gte: startDate },
        status: 'COMPLETED',
      },
      _count: true,
      _sum: { totalTokensUsed: true },
      _avg: { totalTokensUsed: true },
    }),
  ]);

  return {
    totalLogs,
    totalTokens: totalTokens._sum.totalTokens || 0,
    byModel,
    topUsers: byUser,
    byLanguage: byLanguage.map((lang) => ({
      language: lang.language,
      assignments: lang._count,
      tokensUsed: lang._sum.totalTokensUsed || 0,
      avgTokens: Math.round(lang._avg.totalTokensUsed || 0),
    })),
  };
};

export const getUserFlags = async (resolved = false) => {
  const flags = await prisma.userFlag.findMany({
    where: { resolved },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return flags;
};

export const resolveUserFlag = async (flagId: string) => {
  const flag = await prisma.userFlag.update({
    where: { id: flagId },
    data: {
      resolved: true,
      resolvedAt: new Date(),
    },
  });

  return flag;
};

export const getAllBriefs = async () => {
  const briefs = await prisma.brief.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
      _count: {
        select: {
          snapshots: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return briefs;
};

export const downloadAnyAssignment = async (assignmentId: string) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      user: {
        select: {
          email: true,
          role: true,
        },
      },
      snapshot: true,
    },
  });

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  return assignment;
};

export const logAIUsage = async (
  dataOrAssignmentId: {
    assignmentId: string;
    userId?: string;
    userRole?: string;
    aiProvider?: string;
    aiModel: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    responseTimeMs?: number;
    endpoint?: string;
    purpose?: string;
  } | string,
  purpose?: string,
  model?: string,
  tokenData?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }
) => {
  try {
    let logData: any;
    
    if (typeof dataOrAssignmentId === 'string') {
      // Positional arguments pattern (legacy)
      logData = {
        assignmentId: dataOrAssignmentId,
        purpose: purpose || 'UNKNOWN',
        aiModel: model || 'unknown',
        aiProvider: 'openrouter',
        promptTokens: tokenData?.promptTokens || 0,
        completionTokens: tokenData?.completionTokens || 0,
        totalTokens: tokenData?.totalTokens || 0,
      };
    } else {
      // Object pattern
      logData = {
        assignmentId: dataOrAssignmentId.assignmentId,
        aiModel: dataOrAssignmentId.aiModel,
        aiProvider: dataOrAssignmentId.aiProvider || 'openrouter',
        promptTokens: dataOrAssignmentId.promptTokens || 0,
        completionTokens: dataOrAssignmentId.completionTokens || 0,
        totalTokens: dataOrAssignmentId.totalTokens || 0,
        purpose: dataOrAssignmentId.purpose || 'UNKNOWN',
        userId: dataOrAssignmentId.userId,
        userRole: dataOrAssignmentId.userRole,
      };
    }
    
    console.log('[AI USAGE]', {
      assignment: logData.assignmentId,
      model: logData.aiModel,
      tokens: logData.totalTokens,
      purpose: logData.purpose,
    });

    // Save to database if we have assignment info
    if (logData.assignmentId) {
      // Get assignment to find user info
      const assignment = await prisma.assignment.findUnique({
        where: { id: logData.assignmentId },
        select: { userId: true, user: { select: { role: true } } }
      });
      
      if (assignment) {
        await prisma.aIUsageLog.create({
          data: {
            assignmentId: logData.assignmentId,
            userId: logData.userId || assignment.userId,
            userRole: logData.userRole || assignment.user.role,
            aiProvider: logData.aiProvider,
            aiModel: logData.aiModel,
            promptTokens: logData.promptTokens,
            completionTokens: logData.completionTokens,
            totalTokens: logData.totalTokens,
            purpose: logData.purpose,
          }
        });
      }
    }
  } catch (error) {
    // Don't fail generation if logging fails
    console.error('[AI USAGE] Failed to log:', error);
  }
};
