// =============================================================================
// BTEC GENERATOR - PAYMENT EXPIRATION CRON JOB
// =============================================================================
// This script expires old payments that have passed their 24-hour window.
// Run this every 5-15 minutes via cron or scheduler.
// 
// Usage: npx ts-node src/scripts/expirePayments.ts
// =============================================================================

import { prisma } from '../lib/prisma';

async function expireOldPayments() {
  console.log('[PAYMENT_CRON] Starting payment expiration check...');
  
  try {
    const result = await prisma.paymentTransaction.updateMany({
      where: {
        status: 'WAITING_PAYMENT',
        expiresAt: { lt: new Date() },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    console.log(`[PAYMENT_CRON] Expired ${result.count} old payments`);
    return result.count;
  } catch (error) {
    console.error('[PAYMENT_CRON] Error expiring payments:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run immediately
expireOldPayments()
  .then((count) => {
    console.log(`[PAYMENT_CRON] Done. Expired ${count} payments.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('[PAYMENT_CRON] Failed:', error);
    process.exit(1);
  });
