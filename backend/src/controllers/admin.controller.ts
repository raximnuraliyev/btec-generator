// =============================================================================
// BTEC GENERATOR - ADMIN CONTROLLER
// =============================================================================
// All admin endpoints for the new architecture.
// =============================================================================

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { UserRole, UserStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import * as adminService from '../services/admin.service';
import { APIError } from '../types';

// =============================================================================
// DASHBOARD
// =============================================================================

export const dashboard = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

export const getOverviewStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await adminService.getOverviewStats();
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// USER MANAGEMENT
// =============================================================================

export const listUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const role = req.query.role as UserRole;
    const status = req.query.status as UserStatus;

    const result = await adminService.getAllUsers(page, limit, { search, role, status });
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
    const user = await adminService.getUserDetails(userId);
    res.status(200).json({ user });
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({ error: 'Not Found', message: error.message } as APIError);
      return;
    }
    next(error);
  }
};

export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { name, email } = req.body;
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    
    res.status(200).json({ user });
  } catch (error) {
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
      res.status(400).json({ error: 'Validation Error', message: 'Invalid role' } as APIError);
      return;
    }

    // Create audit log
    const oldUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const user = await adminService.updateUserRole(userId, role);
    
    if (req.user?.userId) {
      await adminService.createAuditLog({
        adminUserId: req.user.userId,
        action: 'USER_ROLE_CHANGE',
        targetType: 'USER',
        targetId: userId,
        previousValue: { role: oldUser?.role },
        newValue: { role },
      });
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const suspendUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    await adminService.suspendUser(userId);
    
    if (req.user?.userId) {
      await adminService.createAuditLog({
        adminUserId: req.user.userId,
        action: 'USER_SUSPENDED',
        targetType: 'USER',
        targetId: userId,
        newValue: { reason },
      });
    }

    res.status(200).json({ success: true, message: 'User suspended' });
  } catch (error) {
    next(error);
  }
};

export const unsuspendUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    await adminService.unsuspendUser(userId);
    res.status(200).json({ success: true, message: 'User unsuspended' });
  } catch (error) {
    next(error);
  }
};

export const banUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    await adminService.banUser(userId);
    
    if (req.user?.userId) {
      await adminService.createAuditLog({
        adminUserId: req.user.userId,
        action: 'USER_BANNED',
        targetType: 'USER',
        targetId: userId,
        newValue: { reason },
      });
    }

    res.status(200).json({ success: true, message: 'User banned' });
  } catch (error) {
    next(error);
  }
};

export const unbanUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    await adminService.unbanUser(userId);
    res.status(200).json({ success: true, message: 'User unbanned' });
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// TOKEN MANAGEMENT
// =============================================================================

export const addTokens = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'Validation Error', message: 'Amount must be a positive number' } as APIError);
      return;
    }

    const result = await adminService.addUserTokens(userId, amount, reason || 'Admin adjustment');
    res.status(200).json({ success: true, newBalance: result.newBalance });
  } catch (error) {
    next(error);
  }
};

export const deductTokens = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'Validation Error', message: 'Amount must be a positive number' } as APIError);
      return;
    }

    const result = await adminService.deductUserTokens(userId, amount, reason || 'Admin adjustment');
    res.status(200).json({ success: true, newBalance: result.newBalance });
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
    const { reason } = req.body;

    const result = await adminService.resetUserTokens(userId, reason);
    res.status(200).json({ success: true, newBalance: result.newBalance });
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// ASSIGNMENT MANAGEMENT
// =============================================================================

export const getAllAssignments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as any;
    const grade = req.query.grade as string;
    const level = req.query.level ? parseInt(req.query.level as string) : undefined;
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

    const result = await adminService.getAllAssignments(page, limit, { status, grade, level, dateFrom, dateTo });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const forceCompleteAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await adminService.forceCompleteAssignment(id);
    res.status(200).json({ success: true, message: 'Assignment marked as completed' });
  } catch (error) {
    next(error);
  }
};

export const cancelAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await adminService.cancelAssignment(id);
    res.status(200).json({ success: true, message: 'Assignment cancelled' });
  } catch (error) {
    next(error);
  }
};

export const regenerateAssignment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Clear old content and reset status
    await prisma.$transaction([
      prisma.contentBlock.deleteMany({ where: { assignmentId: id } }),
      prisma.generationPlan.deleteMany({ where: { assignmentId: id } }),
      prisma.assignment.update({
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
        },
      }),
    ]);

    res.status(200).json({ success: true, message: 'Assignment reset for regeneration' });
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
    await adminService.deleteAssignment(id);
    res.status(200).json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// BULK ACTIONS
// =============================================================================

export const bulkDeleteAssignments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'Bad Request', message: 'No assignment IDs provided' } as APIError);
      return;
    }

    // Delete related records first, then assignments
    await prisma.$transaction([
      prisma.contentBlock.deleteMany({ where: { assignmentId: { in: ids } } }),
      prisma.generationPlan.deleteMany({ where: { assignmentId: { in: ids } } }),
      prisma.assignment.deleteMany({ where: { id: { in: ids } } }),
    ]);

    res.status(200).json({ success: true, deleted: ids.length });
  } catch (error) {
    next(error);
  }
};

export const bulkRegenerateAssignments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'Bad Request', message: 'No assignment IDs provided' } as APIError);
      return;
    }

    // Reset all assignments for regeneration
    await prisma.$transaction([
      prisma.contentBlock.deleteMany({ where: { assignmentId: { in: ids } } }),
      prisma.generationPlan.deleteMany({ where: { assignmentId: { in: ids } } }),
      prisma.assignment.updateMany({
        where: { id: { in: ids } },
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
        },
      }),
    ]);

    res.status(200).json({ success: true, regenerated: ids.length });
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
    const assignment = await adminService.downloadAnyAssignment(assignmentId);
    res.status(200).json(assignment);
  } catch (error) {
    if (error instanceof Error && error.message === 'Assignment not found') {
      res.status(404).json({ error: 'Not Found', message: error.message } as APIError);
      return;
    }
    next(error);
  }
};

// =============================================================================
// BRIEFS
// =============================================================================

export const briefs = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const briefs = await adminService.getAllBriefs();
    res.status(200).json(briefs);
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// ANALYTICS
// =============================================================================

export const aiAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const analytics = await adminService.getAIUsageAnalytics(days);
    res.status(200).json(analytics);
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
    const period = (req.query.period as '24h' | '7d' | '30d' | '90d' | '1y') || '7d';
    const analytics = await adminService.getTokenAnalytics(period);
    res.status(200).json(analytics);
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
    const type = (req.query.type as 'weekly' | 'monthly' | 'yearly') || 'weekly';
    const recap = await adminService.getRecap(type);
    res.status(200).json(recap);
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// LOGS
// =============================================================================

export const getLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const level = req.query.level as string;
    const category = req.query.category as string;
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

    // Default to system logs if no type specified
    if (!type || type === 'system') {
      const result = await adminService.getSystemLogs(page, limit, { level, category, dateFrom, dateTo });
      res.status(200).json(result);
    } else if (type === 'audit') {
      const action = req.query.action as string;
      const result = await adminService.getAuditLogs(page, limit, { action, dateFrom, dateTo });
      res.status(200).json(result);
    } else {
      // AI logs
      const logs = await prisma.aIUsageLog.findMany({
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignment: { select: { id: true, snapshot: { select: { unitName: true } } } },
        },
      });
      const total = await prisma.aIUsageLog.count();
      res.status(200).json({
        logs,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    }
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
    const action = req.query.action as string;
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

    const result = await adminService.getAuditLogs(page, limit, { action, dateFrom, dateTo });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// ISSUES (Admin view)
// =============================================================================

export const getAllIssues = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const status = req.query.status as string;
    const category = req.query.category as string;
    const priority = req.query.priority as string;

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const issues = await prisma.issue.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ issues });
  } catch (error) {
    next(error);
  }
};

export const respondToIssue = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { issueId } = req.params;
    const { response } = req.body;

    await prisma.issue.update({
      where: { id: issueId },
      data: {
        adminResponse: response,
        status: 'IN_PROGRESS',
      },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const resolveIssue = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { issueId } = req.params;

    await prisma.issue.update({
      where: { id: issueId },
      data: { status: 'RESOLVED' },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const reopenIssue = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { issueId } = req.params;

    await prisma.issue.update({
      where: { id: issueId },
      data: { status: 'OPEN' },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// SYSTEM CONTROLS
// =============================================================================

export const pauseAllGeneration = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({ success: true, message: 'Generation paused (placeholder)' });
  } catch (error) {
    next(error);
  }
};

export const resumeAllGeneration = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({ success: true, message: 'Generation resumed (placeholder)' });
  } catch (error) {
    next(error);
  }
};

export const getSystemStatus = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [activeJobs, failedLast24h] = await Promise.all([
      prisma.assignment.count({ where: { status: 'GENERATING' } }),
      prisma.assignment.count({
        where: {
          status: 'FAILED',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const aiModel = process.env.AI_MODEL || 'mistralai/devstral-2512:free';
    
    res.status(200).json({
      generationPaused: false,
      activeJobs,
      queuedJobs: 0,
      failedJobsLast24h: failedLast24h,
      averageGenerationTime: 0,
      aiModelsHealth: [
        { model: aiModel, status: 'healthy', failRate: 0 },
      ],
    });
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// EXPORT ENDPOINTS
// =============================================================================

export const exportAssignments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ids, status, grade, level, search, dateFrom, dateTo } = req.query;
    
    // Build where clause
    const where: any = {};
    
    // If specific IDs provided, export only those
    if (ids) {
      const idArray = Array.isArray(ids) ? ids : (ids as string).split(',');
      where.id = { in: idArray };
    } else {
      // Otherwise use filters
      if (status) where.status = status;
      if (grade) where.grade = grade;
      if (level) where.snapshot = { path: ['level'], equals: parseInt(level as string) };
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
        if (dateTo) where.createdAt.lte = new Date(dateTo as string);
      }
      if (search) {
        where.OR = [
          { snapshot: { path: ['unitName'], string_contains: search } },
          { user: { email: { contains: search as string } } },
        ];
      }
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        user: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000, // Limit to prevent huge exports
    });

    // Generate CSV
    const headers = ['ID', 'Unit Name', 'Unit Number', 'Level', 'Grade', 'Status', 'User Email', 'User Name', 'Created At', 'Completed At'];
    const rows = assignments.map(a => {
      const snapshotData = (a as any).snapshot as any || {};
      return [
        a.id,
        snapshotData?.unitName || '',
        snapshotData?.unitNumber || '',
        snapshotData?.level || '',
        a.grade,
        a.status,
        a.user?.email || '',
        a.user?.name || '',
        a.createdAt.toISOString(),
        (a as any).completedAt?.toISOString() || '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="assignments-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

export const exportUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role, status, search, dateFrom, dateTo } = req.query;
    
    // Build where clause
    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }
    if (search) {
      where.OR = [
        { email: { contains: search as string } },
        { name: { contains: search as string } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        studentProfile: true,
        tokenPlan: true,
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    // Generate CSV
    const headers = ['ID', 'Email', 'Name', 'Role', 'Status', 'University', 'Tokens Remaining', 'Total Assignments', 'Created At'];
    const rows = users.map(u => [
      u.id,
      u.email,
      u.name || '',
      u.role,
      u.status,
      u.studentProfile?.universityName || '',
      u.tokenPlan?.tokensRemaining || 0,
      u._count.assignments,
      u.createdAt.toISOString(),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

// Legacy placeholder exports for backward compatibility
export const pauseAssignment = async (_req: AuthRequest, res: Response, _next: NextFunction) => {
  res.status(200).json({ message: 'Not supported', status: 'DRAFT' });
};

export const resumeAssignment = async (_req: AuthRequest, res: Response, _next: NextFunction) => {
  res.status(200).json({ message: 'Not supported', status: 'DRAFT' });
};

export const stopAssignment = cancelAssignment;

export const restartAssignment = regenerateAssignment;

export const getPendingApprovals = async (_req: AuthRequest, res: Response, _next: NextFunction) => {
  res.status(200).json({ count: 0, assignments: [] });
};

export const approveAssignment = async (_req: AuthRequest, res: Response, _next: NextFunction) => {
  res.status(200).json({ success: true, message: 'Not implemented' });
};

export const rejectAssignment = async (_req: AuthRequest, res: Response, _next: NextFunction) => {
  res.status(200).json({ success: true, message: 'Not implemented' });
};
