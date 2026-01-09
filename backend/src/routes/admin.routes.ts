// =============================================================================
// BTEC GENERATOR - ADMIN ROUTES
// =============================================================================
// All admin routes for the new architecture.
// =============================================================================

import { Router } from 'express';
import {
  dashboard,
  getOverviewStats,
  listUsers,
  userDetails,
  updateUser,
  changeRole,
  suspendUser,
  unsuspendUser,
  banUser,
  unbanUser,
  addTokens,
  deductTokens,
  resetTokens,
  getAllAssignments,
  forceCompleteAssignment,
  cancelAssignment,
  regenerateAssignment,
  deleteAssignment,
  bulkDeleteAssignments,
  bulkRegenerateAssignments,
  downloadAssignment,
  exportAssignments,
  exportUsers,
  briefs,
  aiAnalytics,
  getTokenAnalytics,
  getRecap,
  getLogs,
  getAuditLogs,
  getAllIssues,
  respondToIssue,
  resolveIssue,
  reopenIssue,
  setIssueInProgress,
  pauseAllGeneration,
  resumeAllGeneration,
  getSystemStatus,
  // Legacy placeholders
  pauseAssignment,
  resumeAssignment,
  stopAssignment,
  restartAssignment,
  getPendingApprovals,
  approveAssignment,
  rejectAssignment,
} from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireRole } from '../middlewares/role';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require ADMIN role
router.use(authMiddleware);
router.use(requireRole(UserRole.ADMIN));

// =============================================================================
// DASHBOARD & STATS
// =============================================================================
router.get('/dashboard', dashboard);
router.get('/stats', getOverviewStats); // Main stats endpoint
router.get('/stats/overview', getOverviewStats);
router.get('/analytics/ai', aiAnalytics);
router.get('/analytics/tokens', getTokenAnalytics);
router.get('/analytics/recap', getRecap);

// Legacy alias
router.get('/ai-analytics', aiAnalytics);

// =============================================================================
// USER MANAGEMENT
// =============================================================================
router.get('/users', listUsers);
router.get('/users/:userId', userDetails);
router.put('/users/:userId', updateUser);
router.put('/users/:userId/role', changeRole);

// User status management
router.post('/users/:userId/suspend', suspendUser);
router.post('/users/:userId/unsuspend', unsuspendUser);
router.post('/users/:userId/ban', banUser);
router.post('/users/:userId/unban', unbanUser);

// Token management
router.post('/users/:userId/tokens/add', addTokens);
router.post('/users/:userId/tokens/deduct', deductTokens);
router.post('/users/:userId/tokens/reset', resetTokens);

// Legacy alias
router.put('/users/:userId/tokens', resetTokens);

// =============================================================================
// ASSIGNMENT MANAGEMENT
// =============================================================================
router.get('/assignments', getAllAssignments);
router.get('/all-assignments', getAllAssignments);
router.get('/assignments/:assignmentId/download', downloadAssignment);
router.post('/assignments/:id/force-complete', forceCompleteAssignment);
router.post('/assignments/:id/cancel', cancelAssignment);
router.post('/assignments/:id/regenerate', regenerateAssignment);
router.delete('/assignments/:id', deleteAssignment);

// Bulk actions
router.post('/assignments/bulk-delete', bulkDeleteAssignments);
router.post('/assignments/bulk-regenerate', bulkRegenerateAssignments);

// Legacy aliases (point to new functions or placeholders)
router.post('/assignments/:id/pause', pauseAssignment);
router.post('/assignments/:id/resume', resumeAssignment);
router.post('/assignments/:id/stop', stopAssignment);
router.post('/assignments/:id/restart', restartAssignment);

// Legacy approvals (placeholders)
router.get('/pending-approvals', getPendingApprovals);
router.post('/assignments/:id/approve', approveAssignment);
router.post('/assignments/:id/reject', rejectAssignment);

// =============================================================================
// BRIEFS
// =============================================================================
router.get('/briefs', briefs);

// =============================================================================
// EXPORT
// =============================================================================
router.get('/export/assignments', exportAssignments);
router.get('/export/users', exportUsers);

// =============================================================================
// LOGS
// =============================================================================
router.get('/logs', getLogs);
router.get('/logs/audit', getAuditLogs);
router.get('/logs/:type', getLogs);
router.get('/audit-logs', getAuditLogs);

// =============================================================================
// ISSUES
// =============================================================================
router.get('/issues', getAllIssues);
router.post('/issues/:issueId/respond', respondToIssue);
router.post('/issues/:issueId/resolve', resolveIssue);
router.post('/issues/:issueId/reopen', reopenIssue);
router.post('/issues/:issueId/in-progress', setIssueInProgress);

// =============================================================================
// SYSTEM CONTROLS
// =============================================================================
router.get('/system/status', getSystemStatus);
router.post('/system/pause-generation', pauseAllGeneration);
router.post('/system/resume-generation', resumeAllGeneration);

export default router;
