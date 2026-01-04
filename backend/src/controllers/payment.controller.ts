// =============================================================================
// BTEC GENERATOR - PAYMENT CONTROLLER
// =============================================================================
// Handles payment endpoints for users and admins.
// =============================================================================

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { PaymentPlanType, PaymentMethod, Grade, PaymentStatus } from '@prisma/client';
import * as paymentService from '../services/payment.service';
import { APIError } from '../types';

// =============================================================================
// USER ENDPOINTS
// =============================================================================

/**
 * GET /api/payments/plans
 * Get available payment plans
 */
export const getPlans = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const plans = paymentService.getAvailablePlans();
    const cardNumber = await paymentService.getPaymentCard();
    res.status(200).json({ 
      plans,
      cardNumber,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/create
 * Create a new payment request
 */
export const createPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' } as APIError);
      return;
    }

    const { planType, paymentMethod, customTokens, customGrade } = req.body;

    // Validate plan type
    if (!['P', 'PM', 'PMD', 'CUSTOM'].includes(planType)) {
      res.status(400).json({ 
        error: 'Validation Error', 
        message: 'Invalid plan type. Must be P, PM, PMD, or CUSTOM' 
      } as APIError);
      return;
    }

    // Validate payment method
    if (paymentMethod && !['HUMO', 'UZCARD', 'PAYME'].includes(paymentMethod)) {
      res.status(400).json({ 
        error: 'Validation Error', 
        message: 'Invalid payment method. Must be HUMO, UZCARD, or PAYME' 
      } as APIError);
      return;
    }

    // Validate custom plan requirements
    if (planType === 'CUSTOM') {
      if (!customTokens || customTokens < paymentService.MIN_CUSTOM_TOKENS) {
        res.status(400).json({ 
          error: 'Validation Error', 
          message: `Custom plan requires at least ${paymentService.MIN_CUSTOM_TOKENS} tokens` 
        } as APIError);
        return;
      }
      if (!customGrade || !['PASS', 'MERIT', 'DISTINCTION'].includes(customGrade)) {
        res.status(400).json({ 
          error: 'Validation Error', 
          message: 'Custom plan requires a valid grade (PASS, MERIT, or DISTINCTION)' 
        } as APIError);
        return;
      }
    }

    const result = await paymentService.createPayment({
      userId,
      planType: planType as PaymentPlanType,
      paymentMethod: paymentMethod as PaymentMethod,
      customTokens,
      customGrade: customGrade as Grade,
    });

    res.status(201).json(result);
  } catch (error: any) {
    if (error.message?.includes('active pending payment')) {
      res.status(400).json({ error: 'Bad Request', message: error.message } as APIError);
      return;
    }
    next(error);
  }
};

/**
 * GET /api/payments/active
 * Get user's active payment (if any)
 */
export const getActivePayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' } as APIError);
      return;
    }

    const payment = await paymentService.getActivePayment(userId);
    const cardNumber = await paymentService.getPaymentCard();
    res.status(200).json({ 
      payment,
      cardNumber,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/payments/history
 * Get user's payment history
 */
export const getPaymentHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' } as APIError);
      return;
    }

    const payments = await paymentService.getUserPayments(userId);
    res.status(200).json({ payments });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/:paymentId/cancel
 * Cancel a pending payment
 */
export const cancelPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' } as APIError);
      return;
    }

    const { paymentId } = req.params;
    const payment = await paymentService.cancelPayment(paymentId, userId);
    res.status(200).json({ payment, message: 'Payment cancelled' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      res.status(403).json({ error: 'Forbidden', message: 'You cannot cancel this payment' } as APIError);
      return;
    }
    if (error.message === 'Payment not found') {
      res.status(404).json({ error: 'Not Found', message: error.message } as APIError);
      return;
    }
    next(error);
  }
};

/**
 * POST /api/payments/calculate-custom
 * Calculate price for custom plan
 */
export const calculateCustomPrice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tokens } = req.body;

    if (!tokens || tokens < paymentService.MIN_CUSTOM_TOKENS) {
      res.status(400).json({ 
        error: 'Validation Error', 
        message: `Minimum tokens is ${paymentService.MIN_CUSTOM_TOKENS}` 
      } as APIError);
      return;
    }

    const price = paymentService.calculateCustomPlanPrice(tokens);
    res.status(200).json({ 
      tokens, 
      price,
      priceFormatted: price.toLocaleString('uz-UZ') + ' UZS',
    });
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// ADMIN ENDPOINTS
// =============================================================================

/**
 * GET /api/admin/payments
 * Get all payments (with filters)
 */
export const getAllPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as PaymentStatus | undefined;
    const userId = req.query.userId as string | undefined;

    const result = await paymentService.getAllPayments(page, limit, { status, userId });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/payments/pending
 * Get pending payments
 */
export const getPendingPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await paymentService.getPendingPayments({ 
      status: 'WAITING_PAYMENT',
      page, 
      limit 
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/payments/stats
 * Get payment statistics
 */
export const getPaymentStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await paymentService.getPaymentStats();
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/payments/:paymentId
 * Get payment details
 */
export const getPaymentDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const payment = await paymentService.getPaymentById(paymentId);

    if (!payment) {
      res.status(404).json({ error: 'Not Found', message: 'Payment not found' } as APIError);
      return;
    }

    res.status(200).json({ payment });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/payments/find-by-amount
 * Find payment by exact amount (for manual matching)
 */
export const findPaymentByAmount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const amount = parseFloat(req.query.amount as string);

    if (isNaN(amount)) {
      res.status(400).json({ 
        error: 'Validation Error', 
        message: 'Amount must be a valid number' 
      } as APIError);
      return;
    }

    const payment = await paymentService.findPaymentByAmount(amount);

    if (!payment) {
      res.status(404).json({ 
        error: 'Not Found', 
        message: `No pending payment found for amount ${amount}` 
      } as APIError);
      return;
    }

    res.status(200).json({ payment });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/payments/:paymentId/approve
 * Approve a pending payment
 */
export const approvePayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminUserId = req.user?.userId;
    if (!adminUserId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Admin not authenticated' } as APIError);
      return;
    }

    const { paymentId } = req.params;
    const payment = await paymentService.approvePayment(paymentId, adminUserId);

    res.status(200).json({ 
      payment, 
      message: 'Payment approved and plan activated successfully' 
    });
  } catch (error: any) {
    if (error.message === 'Payment not found') {
      res.status(404).json({ error: 'Not Found', message: error.message } as APIError);
      return;
    }
    if (error.message === 'Payment is not in waiting status') {
      res.status(400).json({ error: 'Bad Request', message: error.message } as APIError);
      return;
    }
    next(error);
  }
};

/**
 * POST /api/admin/payments/:paymentId/reject
 * Reject a pending payment
 */
export const rejectPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminUserId = req.user?.userId;
    if (!adminUserId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Admin not authenticated' } as APIError);
      return;
    }

    const { paymentId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ 
        error: 'Validation Error', 
        message: 'Rejection reason is required' 
      } as APIError);
      return;
    }

    const payment = await paymentService.rejectPayment(paymentId, adminUserId, reason);

    res.status(200).json({ 
      payment, 
      message: 'Payment rejected' 
    });
  } catch (error: any) {
    if (error.message === 'Payment not found') {
      res.status(404).json({ error: 'Not Found', message: error.message } as APIError);
      return;
    }
    if (error.message === 'Payment is not in waiting status') {
      res.status(400).json({ error: 'Bad Request', message: error.message } as APIError);
      return;
    }
    next(error);
  }
};

/**
 * POST /api/admin/payments/expire-old
 * Manually trigger expiration of old payments
 */
export const expireOldPayments = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const count = await paymentService.expireOldPayments();
    res.status(200).json({ 
      message: `Expired ${count} old payments`,
      expiredCount: count,
    });
  } catch (error) {
    next(error);
  }
};
