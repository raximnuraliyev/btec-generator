// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { expireOldPayments } from './services/payment.service';
import { discordBot } from './discord';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, async () => {
  console.log(`🚀 BTEC Generator Backend`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  // Start payment expiration job (runs every 5 minutes)
  startPaymentExpirationJob();
  
  // Start Discord bot
  await startDiscordBot();
});

// Discord bot startup
async function startDiscordBot() {
  try {
    await discordBot.start();
  } catch (error) {
    console.error('[DISCORD_BOT] Failed to start:', error);
  }
}

// Payment expiration job
let paymentExpirationInterval: NodeJS.Timeout | null = null;

function startPaymentExpirationJob() {
  // Run immediately on startup
  expireOldPayments().catch(console.error);
  
  // Then run every 5 minutes
  paymentExpirationInterval = setInterval(async () => {
    try {
      const count = await expireOldPayments();
      if (count > 0) {
        console.log(`[PAYMENT_CRON] Expired ${count} old payments`);
      }
    } catch (error) {
      console.error('[PAYMENT_CRON] Error:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes
  
  console.log('💳 Payment expiration job started (every 5 minutes)');
}

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  // Stop Discord bot
  await discordBot.stop();
  
  // Clear payment expiration interval
  if (paymentExpirationInterval) {
    clearInterval(paymentExpirationInterval);
  }
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
