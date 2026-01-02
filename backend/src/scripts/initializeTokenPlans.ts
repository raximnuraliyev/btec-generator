import { PrismaClient } from '@prisma/client';
import { initializeTokenPlan } from '../services/token.service';

const prisma = new PrismaClient();

async function main() {
  console.log('[INIT] Starting token plan initialization...');

  const users = await prisma.user.findMany({
    include: {
      tokenPlan: true,
    },
  });

  console.log(`[INIT] Found ${users.length} users`);

  let initialized = 0;
  let skipped = 0;

  for (const user of users) {
    if (user.tokenPlan) {
      console.log(`[INIT] User ${user.email} already has a token plan, skipping`);
      skipped++;
      continue;
    }

    try {
      await initializeTokenPlan(user.id);
      console.log(`[INIT] ✓ Initialized FREE plan for ${user.email}`);
      initialized++;
    } catch (error) {
      console.error(`[INIT] ✗ Failed to initialize plan for ${user.email}:`, error);
    }
  }

  console.log('[INIT] Initialization complete');
  console.log(`[INIT] - Initialized: ${initialized}`);
  console.log(`[INIT] - Skipped: ${skipped}`);
  console.log(`[INIT] - Total: ${users.length}`);
}

main()
  .catch((error) => {
    console.error('[INIT] Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
