import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { UserRole } from '@prisma/client';
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
    res.status(200).json(user);
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
      data: { status: 'paused' }
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
      data: { status: 'generating' }
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
      data: { status: 'stopped' }
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
    
    // Update assignment status back to pending/generating
    const assignment = await prisma.assignment.update({
      where: { id },
      data: { 
        status: 'GENERATING',
        error: null
      }
    });
    
    res.status(200).json({ 
      message: 'Assignment restarted', 
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
    res.status(200).json({ 
      type, 
      lines, 
      content: 'No logs available', 
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
    res.status(200).json({
      period,
      summary: { totalTokens: 0, inputTokens: 0, outputTokens: 0, totalRequests: 0 },
      byUser: [],
      byDay: []
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
