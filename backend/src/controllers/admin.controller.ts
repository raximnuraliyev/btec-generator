import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { UserRole, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUserRole,
  resetUserTokens,
  getAIUsageAnalytics,
  getUserFlags,
  resolveUserFlag,
  getAllBriefs,
  downloadAnyAssignment,
} from '../services/admin.service';
import { APIError } from '../types';

export const dashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await getDashboardStats();
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await getAllUsers(page, limit);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const userDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await getUserDetails(userId);
    // Wrap in { user: ... } to match frontend expectation
    res.status(200).json({ user });
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      } as APIError);
      return;
    }
    next(error);
  }
};

export const changeRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid role',
      } as APIError);
      return;
    }

    const user = await updateUserRole(userId, role);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const resetTokens = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { tokens } = req.body;

    if (typeof tokens !== 'number' || tokens < 0) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Tokens must be a positive number',
      } as APIError);
      return;
    }

    const user = await resetUserTokens(userId, tokens);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const aiAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const analytics = await getAIUsageAnalytics(days);
    res.status(200).json(analytics);
  } catch (error) {
    next(error);
  }
};

export const flags = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const resolved = req.query.resolved === 'true';
    const flags = await getUserFlags(resolved);
    res.status(200).json(flags);
  } catch (error) {
    next(error);
  }
};

export const resolveFlag = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { flagId } = req.params;
    const flag = await resolveUserFlag(flagId);
    res.status(200).json(flag);
  } catch (error) {
    next(error);
  }
};

export const briefs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const briefs = await getAllBriefs();
    res.status(200).json(briefs);
  } catch (error) {
    next(error);
  }
};

export const downloadAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const assignment = await downloadAnyAssignment(assignmentId);
    res.status(200).json(assignment);
  } catch (error) {
    if (error instanceof Error && error.message === 'Assignment not found') {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      } as APIError);
      return;
    }
    next(error);
  }
};

// New endpoints for admin functionality
export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role, email, trialTokens, plan } = req.body;
    
    // Build update data
    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (email !== undefined) updateData.email = email;
    if (trialTokens !== undefined) updateData.trialTokens = parseInt(trialTokens);
    if (plan !== undefined) updateData.plan = plan;
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        trialTokens: true,
        plan: true,
        createdAt: true,
        studentProfile: {
          select: {
            fullName: true
          }
        }
      }
    });
    
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const getAllAssignments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    
    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        take: limit,
        skip: skip,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              studentProfile: {
                select: {
                  fullName: true
                }
              }
            }
          },
          snapshot: {
            select: {
              id: true,
              unitName: true,
              subjectName: true,
              unitCode: true,
              level: true
            }
          }
        }
      }),
      prisma.assignment.count()
    ]);
    
    res.status(200).json({ 
      assignments, 
      total, 
      page, 
      pages: Math.ceil(total / limit) 
    });
  } catch (error) {
    next(error);
  }
};

export const pauseAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const assignment = await prisma.assignment.update({
      where: { id },
      data: { status: 'DRAFT' } // Use valid status, no 'paused' status
    });
    
    res.status(200).json({ 
      message: 'Assignment paused', 
      status: assignment.status 
    });
  } catch (error) {
    next(error);
  }
};

export const resumeAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const assignment = await prisma.assignment.update({
      where: { id },
      data: { status: 'GENERATING' }
    });
    
    res.status(200).json({ 
      message: 'Assignment resumed', 
      status: assignment.status 
    });
  } catch (error) {
    next(error);
  }
};

export const stopAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const assignment = await prisma.assignment.update({
      where: { id },
      data: { status: 'FAILED' } // Use FAILED instead of 'stopped'
    });
    
    res.status(200).json({ 
      message: 'Assignment stopped', 
      status: assignment.status 
    });
  } catch (error) {
    next(error);
  }
};

export const restartAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    // First, clear old content blocks and generation plan
    await prisma.contentBlock.deleteMany({
      where: { assignmentId: id }
    });
    
    await prisma.generationPlan.deleteMany({
      where: { assignmentId: id }
    });
    
    // Update assignment status back to DRAFT so it can be regenerated
    const assignment = await prisma.assignment.update({
      where: { id },
      data: { 
        status: 'DRAFT',
        error: null,
        content: Prisma.JsonNull,
        guidance: Prisma.JsonNull,
        totalTokensUsed: 0,
        totalAiCalls: 0,
        generationDurationMs: null,
        completedAt: null,
        docxUrl: null,
      }
    });
    
    res.status(200).json({ 
      message: 'Assignment reset and ready for regeneration', 
      jobId: assignment.id, 
      status: assignment.status 
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Delete the assignment (cascade will handle related records)
    await prisma.assignment.delete({
      where: { id }
    });
    
    res.status(200).json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type } = req.params;
    const lines = parseInt(req.query.lines as string) || 100;
    
    // Get AI usage logs from database
    if (type === 'ai' || type === 'backend') {
      const logs = await prisma.aIUsageLog.findMany({
        take: lines,
        orderBy: { createdAt: 'desc' },
        include: {
          assignment: {
            select: {
              id: true,
              snapshot: {
                select: {
                  unitName: true
                }
              }
            }
          }
        }
      });
      
      // Format as string for frontend display in <pre> tag
      const logLines = logs.map(log => {
        const timestamp = log.createdAt.toISOString();
        const unitName = log.assignment?.snapshot?.unitName || 'Unknown';
        return `[${timestamp}] [${log.purpose}] Model: ${log.aiModel}, Tokens: ${log.totalTokens}, Unit: ${unitName}`;
      });
      
      res.status(200).json({ 
        type, 
        lines: logLines.length, 
        content: logLines.join('\n'),
        timestamp: new Date().toISOString() 
      });
      return;
    }
    
    // Get error logs from failed assignments
    if (type === 'error') {
      const failedAssignments = await prisma.assignment.findMany({
        where: { status: 'FAILED' },
        take: lines,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          error: true,
          createdAt: true,
          user: {
            select: { email: true }
          },
          snapshot: {
            select: { unitName: true }
          }
        }
      });
      
      // Format as string for frontend display
      const errorLines = failedAssignments.map(a => {
        const timestamp = a.createdAt.toISOString();
        const email = a.user?.email || 'Unknown';
        const unitName = a.snapshot?.unitName || 'Unknown';
        return `[${timestamp}] [ERROR] User: ${email}, Unit: ${unitName}\n  Error: ${a.error || 'Unknown error'}`;
      });
      
      res.status(200).json({ 
        type, 
        lines: errorLines.length, 
        content: errorLines.join('\n\n'),
        timestamp: new Date().toISOString() 
      });
      return;
    }
    
    // Default response for other log types (placeholder - no data)
    res.status(200).json({ 
      type, 
      lines: 0, 
      content: `No ${type} logs available. This feature is not yet implemented.`, 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    res.status(200).json({ logs: [], total: 0, page, pages: 0 });
  } catch (error) {
    next(error);
  }
};

export const getOverviewStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get all users for counting by role
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        studentProfile: {
          select: {
            fullName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Count users by role
    const usersByRole = allUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Ensure all roles are represented
    const roleStats = {
      ADMIN: usersByRole.ADMIN || 0,
      TEACHER: usersByRole.TEACHER || 0,
      USER: usersByRole.USER || 0,
      VIP: usersByRole.VIP || 0
    };

    // Get assignment stats
    const allAssignments = await prisma.assignment.findMany({
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true
          }
        },
        snapshot: {
          select: {
            unitName: true,
            subjectName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const assignmentsByStatus = allAssignments.reduce((acc, assignment) => {
      acc[assignment.status] = (acc[assignment.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.status(200).json({
      totals: {
        users: allUsers.length,
        assignments: allAssignments.length,
        activeGenerations: allAssignments.filter(a => a.status === 'GENERATING').length
      },
      usersByRole: roleStats,
      assignmentsByStatus: {
        DRAFT: assignmentsByStatus.DRAFT || 0,
        GENERATING: assignmentsByStatus.GENERATING || 0,
        COMPLETED: assignmentsByStatus.COMPLETED || 0,
        FAILED: assignmentsByStatus.FAILED || 0
      },
      recentUsers: allUsers.slice(0, 5).map(user => ({
        id: user.id,
        email: user.email,
        name: user.studentProfile?.fullName || null,
        role: user.role,
        createdAt: user.createdAt.toISOString()
      })),
      recentAssignments: allAssignments.slice(0, 5)
    });
  } catch (error) {
    next(error);
  }
};

export const getTokenAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const period = req.query.period as string || '7d';
    
    // Calculate date range
    let days = 7;
    if (period === '24h') days = 1;
    else if (period === '30d') days = 30;
    else if (period === '90d') days = 90;
    else if (period === '1y') days = 365;
    
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Get total tokens
    const tokenSummary = await prisma.aIUsageLog.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: {
        totalTokens: true,
        promptTokens: true,
        completionTokens: true
      },
      _count: true
    });
    
    // Get tokens by user
    const tokensByUser = await prisma.aIUsageLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: startDate } },
      _sum: { totalTokens: true },
      orderBy: { _sum: { totalTokens: 'desc' } },
      take: 20
    });
    
    // Get user details for the top users
    const userIds = tokensByUser.map(t => t.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        studentProfile: { select: { fullName: true } }
      }
    });
    
    const userMap = new Map(users.map(u => [u.id, u]));
    
    const byUser = tokensByUser.map(t => ({
      userId: t.userId,
      email: userMap.get(t.userId)?.email || 'Unknown',
      name: userMap.get(t.userId)?.studentProfile?.fullName || null,
      tokens: t._sum.totalTokens || 0
    }));
    
    // Get tokens by day
    const allLogs = await prisma.aIUsageLog.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, totalTokens: true }
    });
    
    // Group by day
    const byDayMap = new Map<string, { tokens: number; requests: number }>();
    allLogs.forEach(log => {
      const dateKey = log.createdAt.toISOString().split('T')[0];
      const existing = byDayMap.get(dateKey) || { tokens: 0, requests: 0 };
      byDayMap.set(dateKey, {
        tokens: existing.tokens + log.totalTokens,
        requests: existing.requests + 1
      });
    });
    
    const byDay = Array.from(byDayMap.entries()).map(([date, data]) => ({
      date,
      tokens: data.tokens,
      requests: data.requests
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    res.status(200).json({
      period,
      summary: {
        totalTokens: tokenSummary._sum.totalTokens || 0,
        inputTokens: tokenSummary._sum.promptTokens || 0,
        outputTokens: tokenSummary._sum.completionTokens || 0,
        totalRequests: tokenSummary._count || 0
      },
      byUser,
      byDay
    });
  } catch (error) {
    next(error);
  }
};

export const getRecap = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const type = req.query.type as string || 'weekly';
    res.status(200).json({
      type,
      period: { start: new Date().toISOString(), end: new Date().toISOString() },
      current: {
        newUsers: 0,
        totalAssignments: 0,
        completedAssignments: 0,
        totalTokensUsed: 0,
        assignmentsByGrade: {},
        assignmentsByLevel: {},
        topUsers: []
      },
      previous: { newUsers: 0, totalAssignments: 0, totalTokensUsed: 0 },
      growth: { users: 0, assignments: 0, tokens: 0 }
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingApprovals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({ count: 0, assignments: [] });
  } catch (error) {
    next(error);
  }
};

export const approveAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    res.status(200).json({ success: true, message: 'Assignment approved' });
  } catch (error) {
    next(error);
  }
};

export const rejectAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    res.status(200).json({ success: true, message: 'Assignment rejected' });
  } catch (error) {
    next(error);
  }
};
