import { Router } from 'express';
import {
  dashboard,
  listUsers,
  userDetails,
  updateUser,
  changeRole,
  resetTokens,
  aiAnalytics,
  flags,
  resolveFlag,
  briefs,
  downloadAssignment,
  getAllAssignments,
  pauseAssignment,
  resumeAssignment,
  stopAssignment,
  restartAssignment,
  deleteAssignment,
  getLogs,
  getAuditLogs,
  getOverviewStats,
  getTokenAnalytics,
  getRecap,
  getPendingApprovals,
  approveAssignment,
  rejectAssignment,
} from '../controllers/admin.controller';
import { getAllIssues } from '../controllers/issue.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireRole } from '../middlewares/role';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require ADMIN role
router.use(authMiddleware);
router.use(requireRole(UserRole.ADMIN));

// Users
router.get('/users', listUsers);
router.get('/users/:userId', userDetails);
router.put('/users/:userId', updateUser);
router.put('/users/:userId/role', changeRole);
router.put('/users/:userId/tokens', resetTokens);

// Assignments
router.get('/all-assignments', getAllAssignments);
router.post('/assignments/:id/pause', pauseAssignment);
router.post('/assignments/:id/resume', resumeAssignment);
router.post('/assignments/:id/stop', stopAssignment);
router.post('/assignments/:id/restart', restartAssignment);
router.delete('/assignments/:id', deleteAssignment);
router.get('/assignments/:assignmentId/download', downloadAssignment);

// Approvals
router.get('/pending-approvals', getPendingApprovals);
router.post('/assignments/:id/approve', approveAssignment);
router.post('/assignments/:id/reject', rejectAssignment);

// Stats & Analytics
router.get('/dashboard', dashboard);
router.get('/stats/overview', getOverviewStats);
router.get('/analytics/tokens', getTokenAnalytics);
router.get('/analytics/recap', getRecap);
router.get('/ai-analytics', aiAnalytics);

// Logs
router.get('/logs/:type', getLogs);
router.get('/logs/audit', getAuditLogs);

// Briefs & Flags
router.get('/briefs', briefs);
router.get('/flags', flags);
router.put('/flags/:flagId/resolve', resolveFlag);

// Issues
router.get('/issues', getAllIssues);

export default router;
