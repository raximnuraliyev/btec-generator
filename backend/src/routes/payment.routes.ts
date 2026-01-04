// =============================================================================
// BTEC GENERATOR - PAYMENT ROUTES
// =============================================================================
// Routes for payment management (user and admin endpoints).
// =============================================================================

import { Router } from 'express';
import {
  // User endpoints
  getPlans,
  createPayment,
  getActivePayment,
  getPaymentHistory,
  cancelPayment,
  calculateCustomPrice,
  // Admin endpoints
  getAllPayments,
  getPendingPayments,
  getPaymentStats,
  getPaymentDetails,
  findPaymentByAmount,
  approvePayment,
  rejectPayment,
  expireOldPayments,
} from '../controllers/payment.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireRole } from '../middlewares/role';
import { UserRole } from '@prisma/client';

const router = Router();

// =============================================================================
// PUBLIC ENDPOINTS (No auth required)
// =============================================================================
router.get('/plans', getPlans);

// =============================================================================
// USER ENDPOINTS (Auth required)
// =============================================================================
router.use(authMiddleware);

router.post('/create', createPayment);
router.get('/active', getActivePayment);
router.get('/history', getPaymentHistory);
router.post('/calculate-custom', calculateCustomPrice);
router.post('/:paymentId/cancel', cancelPayment);

// =============================================================================
// ADMIN ENDPOINTS (Admin role required)
// =============================================================================
router.get('/admin/all', requireRole(UserRole.ADMIN), getAllPayments);
router.get('/admin/pending', requireRole(UserRole.ADMIN), getPendingPayments);
router.get('/admin/stats', requireRole(UserRole.ADMIN), getPaymentStats);
router.get('/admin/find-by-amount', requireRole(UserRole.ADMIN), findPaymentByAmount);
router.get('/admin/:paymentId', requireRole(UserRole.ADMIN), getPaymentDetails);
router.post('/admin/:paymentId/approve', requireRole(UserRole.ADMIN), approvePayment);
router.post('/admin/:paymentId/reject', requireRole(UserRole.ADMIN), rejectPayment);
router.post('/admin/expire-old', requireRole(UserRole.ADMIN), expireOldPayments);

export default router;
