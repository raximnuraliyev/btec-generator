/**
 * Discord Bot Command Handler
 * Handles both prefix (!) and slash commands
 */

import {
  Message,
  ChatInputCommandInteraction,
  EmbedBuilder,
  User as DiscordUser,
} from 'discord.js';
import { discordBotService } from './service';
import { SUPER_ADMIN_DISCORD_ID } from './types';

// ============================================
// MESSAGE FORMATTERS (No Emojis)
// ============================================

function formatOverview(data: any): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('System Overview')
    .setColor(0x000000)
    .addFields(
      { name: 'Total Users', value: data.totalUsers.toString(), inline: true },
      { name: 'Active Today', value: data.activeUsersToday.toString(), inline: true },
      { name: 'Pending Payments', value: data.pendingPayments.toString(), inline: true },
      { name: 'Total Assignments', value: data.totalAssignments.toString(), inline: true },
      { name: 'Today\'s Assignments', value: data.assignmentsToday.toString(), inline: true },
      { name: 'Completed', value: data.completedAssignments.toString(), inline: true },
      { name: 'Failed', value: data.failedAssignments.toString(), inline: true },
      { name: 'Total Tokens Used', value: data.totalTokensUsed.toLocaleString(), inline: true }
    )
    .setTimestamp();
}

// formatPayment function - exported for future use
export function formatPayment(payment: any): EmbedBuilder {
  const user = payment.user;
  const profile = user?.studentProfile;
  
  return new EmbedBuilder()
    .setTitle('Payment Details')
    .setColor(payment.status === 'PAID' ? 0x00FF00 : payment.status === 'REJECTED' ? 0xFF0000 : 0xFFAA00)
    .addFields(
      { name: 'Payment ID', value: payment.id, inline: false },
      { name: 'Status', value: payment.status, inline: true },
      { name: 'Plan', value: payment.planType, inline: true },
      { name: 'Amount', value: `${payment.finalAmount.toFixed(2)} UZS`, inline: true },
      { name: 'User', value: profile?.fullName || user?.email || 'Unknown', inline: true },
      { name: 'Email', value: user?.email || 'N/A', inline: true },
      { name: 'Method', value: payment.paymentMethod, inline: true },
      { name: 'Created', value: new Date(payment.createdAt).toLocaleString(), inline: true },
      { name: 'Expires', value: new Date(payment.expiresAt).toLocaleString(), inline: true }
    )
    .setTimestamp();
}

function formatUser(user: any): EmbedBuilder {
  const profile = user.studentProfile;
  const plan = user.tokenPlan;
  
  return new EmbedBuilder()
    .setTitle('User Profile')
    .setColor(0x000000)
    .addFields(
      { name: 'User ID', value: user.id, inline: false },
      { name: 'Email', value: user.email, inline: true },
      { name: 'Role', value: user.role, inline: true },
      { name: 'Status', value: user.status, inline: true },
      { name: 'Name', value: profile?.fullName || 'Not set', inline: true },
      { name: 'University', value: profile?.universityName || 'Not set', inline: true },
      { name: 'Group', value: profile?.groupName || 'Not set', inline: true },
      { name: 'Plan Type', value: plan?.planType || 'FREE', inline: true },
      { name: 'Tokens', value: plan?.tokensRemaining?.toLocaleString() || '0', inline: true },
      { name: 'Assignments', value: user.totalAssignmentsGenerated?.toString() || '0', inline: true },
      { name: 'Last Active', value: user.lastGenerationAt ? new Date(user.lastGenerationAt).toLocaleString() : 'Never', inline: true },
      { name: 'Registered', value: new Date(user.createdAt).toLocaleString(), inline: true }
    )
    .setTimestamp();
}

function formatAssignment(assignment: any): EmbedBuilder {
  const wordCount = assignment.content ? assignment.content.split(/\s+/).length : 0;
  
  return new EmbedBuilder()
    .setTitle('Assignment Status')
    .setColor(assignment.status === 'COMPLETED' ? 0x00FF00 : assignment.status === 'FAILED' ? 0xFF0000 : 0xFFAA00)
    .addFields(
      { name: 'Assignment ID', value: assignment.id, inline: false },
      { name: 'Status', value: assignment.status, inline: true },
      { name: 'Grade', value: assignment.grade, inline: true },
      { name: 'Language', value: assignment.language, inline: true },
      { name: 'Word Count', value: wordCount.toLocaleString(), inline: true },
      { name: 'Tokens Used', value: assignment.totalTokensUsed?.toLocaleString() || '0', inline: true },
      { name: 'AI Calls', value: assignment.totalAiCalls?.toString() || '0', inline: true },
      { name: 'Unit', value: assignment.snapshot?.unitName || 'N/A', inline: true },
      { name: 'Level', value: assignment.snapshot?.level?.toString() || 'N/A', inline: true },
      { name: 'Created', value: new Date(assignment.createdAt).toLocaleString(), inline: true }
    )
    .setTimestamp();
}

// ============================================
// COMMAND DEFINITIONS
// ============================================

interface CommandHandler {
  name: string;
  aliases?: string[];
  description: string;
  usage: string;
  adminOnly?: boolean;
  teacherOnly?: boolean;
  execute: (args: string[], discordUser: DiscordUser, reply: (content: any) => Promise<void>) => Promise<void>;
}

const commands: CommandHandler[] = [
  // ============ GENERAL COMMANDS ============
  {
    name: 'help',
    description: 'Show available commands',
    usage: '!help',
    execute: async (_args, user, reply) => {
      const isAdmin = discordBotService.isAdmin(user.id);
      const linkedUser = await discordBotService.getUserByDiscordId(user.id);
      const isTeacher = linkedUser?.role === 'TEACHER';

      let helpText = '**BTEC Generator Bot Commands**\n\n';
      helpText += '**General Commands:**\n';
      helpText += '`!help` - Show this help\n';
      helpText += '`!link <code>` - Link your Discord (get code from website)\n';
      helpText += '`!unlink` - Unlink your Discord account\n';
      helpText += '`!profile` - View your profile\n';
      helpText += '`!status` - View your plan & token status\n';
      helpText += '`!tokens` - View token balance\n';
      helpText += '`!assignments` - List your assignments\n';
      helpText += '`!assignment <id>` - View assignment status\n';
      helpText += '\n**Payment Commands:**\n';
      helpText += '`!buy` - View available plans\n';
      helpText += '`!buy <P|PM|PMD>` - Start a plan purchase\n';
      helpText += '`!buy custom <grade> <tokens>` - Buy custom tokens\n';
      helpText += '`!payments` - View payment history\n';
      helpText += '`!support` - Get support info\n';

      if (isTeacher) {
        helpText += '\n**Teacher Commands:**\n';
        helpText += '`!teacher help` - Show teacher commands\n';
        helpText += '`!teacher briefs` - List your briefs\n';
        helpText += '`!teacher brief <id>` - View brief details\n';
        helpText += '`!teacher publish <id>` - Publish a brief\n';
        helpText += '`!teacher unpublish <id>` - Unpublish a brief\n';
      }

      if (isAdmin) {
        helpText += '\n**Admin Commands:**\n';
        helpText += '`!admin help` - Show all admin commands\n';
        helpText += '`!admin overview` - System overview\n';
        helpText += '`!admin payments` - Pending payments\n';
        helpText += '`!admin approve <paymentId>` - Approve payment\n';
        helpText += '`!admin reject <paymentId> <reason>` - Reject payment\n';
        helpText += '`!admin user <userId>` - View user details\n';
        helpText += '`!admin find <email>` - Find user by email\n';
        helpText += '`!admin set-role <userId> <role>` - Set user role\n';
        helpText += '`!admin add-tokens <userId> <amount>` - Add tokens\n';
        helpText += '`!admin suspend <userId> <reason>` - Suspend user\n';
        helpText += '`!admin unsuspend <userId>` - Unsuspend user\n';
        helpText += '`!admin logs` - Recent system logs\n';
        helpText += '`!admin users` - List all users\n';
      }

      await reply(helpText);
    },
  },

  {
    name: 'link',
    description: 'Link Discord account to website using verification code',
    usage: '!link <code>',
    execute: async (args, user, reply) => {
      if (!args[0]) {
        await reply('**How to link your account:**\n\n1. Go to the BTEC Generator website\n2. Open the **Discord Integration** section on your dashboard\n3. Click **Generate Link Code**\n4. Copy the 6-character code\n5. Use `!link <code>` here\n\nExample: `!link ABC123`');
        return;
      }

      const code = args[0].toUpperCase();
      const { discordService } = await import('../services/discord.service');
      const result = await discordService.verifyAndLinkDiscord(code, user.id);
      
      if (result.success) {
        await reply(`✅ **Success!** Your Discord account has been linked to ${result.email}\n\nYou will now receive notifications about:\n• Payment status updates\n• Assignment completion\n• Token balance warnings`);
      } else {
        await reply(`❌ ${result.message}`);
      }
    },
  },

  {
    name: 'unlink',
    description: 'Unlink Discord account',
    usage: '!unlink',
    execute: async (_args, user, reply) => {
      const success = await discordBotService.unlinkDiscordAccount(user.id);
      await reply(success ? 'Account unlinked successfully' : 'No linked account found');
    },
  },

  {
    name: 'profile',
    description: 'View your profile',
    usage: '!profile',
    execute: async (_args, user, reply) => {
      const linkedUser = await discordBotService.getUserByDiscordId(user.id);
      if (!linkedUser) {
        await reply('Account not linked. Use `!link <email>` to link your account.');
        return;
      }
      await reply({ embeds: [formatUser(linkedUser)] });
    },
  },

  {
    name: 'tokens',
    description: 'View token balance',
    usage: '!tokens',
    execute: async (_args, user, reply) => {
      const linkedUser = await discordBotService.getUserByDiscordId(user.id);
      if (!linkedUser) {
        await reply('Account not linked. Use `!link <email>` first.');
        return;
      }

      const plan = linkedUser.tokenPlan;
      const embed = new EmbedBuilder()
        .setTitle('Token Balance')
        .setColor(0x000000)
        .addFields(
          { name: 'Plan Type', value: plan?.planType || 'FREE', inline: true },
          { name: 'Tokens Remaining', value: plan?.tokensRemaining?.toLocaleString() || '0', inline: true },
          { name: 'Tokens Per Month', value: plan?.tokensPerMonth?.toLocaleString() || '0', inline: true },
          { name: 'Total Used (All Time)', value: linkedUser.totalTokensUsedAllTime?.toLocaleString() || '0', inline: true },
          { name: 'Assignments Generated', value: linkedUser.totalAssignmentsGenerated?.toString() || '0', inline: true },
          { name: 'Plan Expires', value: plan?.expiresAt ? new Date(plan.expiresAt).toLocaleDateString() : 'N/A', inline: true }
        )
        .setTimestamp();

      await reply({ embeds: [embed] });
    },
  },

  {
    name: 'assignments',
    description: 'List your assignments',
    usage: '!assignments',
    execute: async (_args, user, reply) => {
      const linkedUser = await discordBotService.getUserByDiscordId(user.id);
      if (!linkedUser) {
        await reply('Account not linked. Use `!link <email>` first.');
        return;
      }

      const assignments = await discordBotService.getUserAssignments(linkedUser.id);
      if (assignments.length === 0) {
        await reply('No assignments found.');
        return;
      }

      let text = '**Your Assignments:**\n\n';
      for (const a of assignments) {
        const status = a.status === 'COMPLETED' ? '[DONE]' : a.status === 'FAILED' ? '[FAIL]' : `[${a.status}]`;
        text += `${status} \`${a.id}\` - ${a.snapshot?.unitName || 'Unknown'} (${a.grade})\n`;
      }

      await reply(text);
    },
  },

  {
    name: 'assignment',
    description: 'View assignment status',
    usage: '!assignment <id>',
    execute: async (args, user, reply) => {
      if (!args[0]) {
        await reply('Usage: `!assignment <assignmentId>`');
        return;
      }

      const assignment = await discordBotService.getAssignmentStatus(args[0]);
      if (!assignment) {
        await reply('Assignment not found.');
        return;
      }

      // Verify ownership unless admin
      const linkedUser = await discordBotService.getUserByDiscordId(user.id);
      if (!discordBotService.isAdmin(user.id) && assignment.userId !== linkedUser?.id) {
        await reply('You do not have permission to view this assignment.');
        return;
      }

      await reply({ embeds: [formatAssignment(assignment)] });
    },
  },

  {
    name: 'payments',
    description: 'View your payment history',
    usage: '!payments',
    execute: async (_args, user, reply) => {
      const linkedUser = await discordBotService.getUserByDiscordId(user.id);
      if (!linkedUser) {
        await reply('Account not linked. Use `!link <email>` first.');
        return;
      }

      const { prisma } = await import('../lib/prisma');
      const payments = await prisma.paymentTransaction.findMany({
        where: { userId: linkedUser.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      if (payments.length === 0) {
        await reply('No payment history found.');
        return;
      }

      let text = '**Your Payment History:**\n\n';
      for (const p of payments) {
        const status = p.status === 'PAID' ? '[APPROVED]' : p.status === 'REJECTED' ? '[REJECTED]' : `[${p.status}]`;
        text += `${status} \`${p.id}\` - ${p.planType} - ${p.finalAmount.toFixed(2)} UZS\n`;
      }

      await reply(text);
    },
  },

  {
    name: 'support',
    description: 'Get support information',
    usage: '!support',
    execute: async (_args, _user, reply) => {
      const text = `**BTEC Generator Support**

To get support:
1. Visit the website and go to Support page
2. Create a support ticket describing your issue
3. Include your email and assignment ID if relevant

For urgent issues, contact an admin directly.

Website: https://btec-generator.com`;

      await reply(text);
    },
  },

  // ============ PAYMENT COMMANDS ============
  {
    name: 'buy',
    description: 'View plans and start a purchase',
    usage: '!buy [plan] OR !buy custom <grade> <tokens>',
    execute: async (args, user, reply) => {
      const { prisma } = await import('../lib/prisma');
      const { PAYMENT_PLANS, CUSTOM_MIN_TOKENS, getPaymentCard } = await import('../services/payment.service');
      
      const linkedUser = await discordBotService.getUserByDiscordId(user.id);
      
      // Get payment card
      const paymentCard = await getPaymentCard();
      
      // No arguments - show available plans
      if (!args[0]) {
        const embed = new EmbedBuilder()
          .setTitle('Available Plans')
          .setColor(0x000000)
          .setDescription(`**Payment Card:** \`${paymentCard}\`\n\nUse \`!buy <plan>\` to start a purchase.`)
          .addFields(
            { 
              name: '📗 PLAN P (Pass Only)', 
              value: `**30,000 UZS** - 3 days\n• 5 assignments\n• 100,000 tokens\n• PASS grade only\n\n\`!buy P\``, 
              inline: true 
            },
            { 
              name: '📘 PLAN PM (Pass + Merit)', 
              value: `**50,000 UZS** - 5 days\n• 7 assignments\n• 150,000 tokens\n• PASS & MERIT grades\n\n\`!buy PM\``, 
              inline: true 
            },
            { 
              name: '📙 PLAN PMD (All Grades)', 
              value: `**100,000 UZS** - 7 days\n• 10 assignments\n• 200,000 tokens\n• All grades\n\n\`!buy PMD\``, 
              inline: true 
            },
            { 
              name: '🔧 Custom Plan', 
              value: `**1 UZS per token** - One assignment only\n• Min: 20,000 tokens (PASS/MERIT)\n• Min: 25,000 tokens (DISTINCTION)\n\n\`!buy custom PASS 25000\``, 
              inline: false 
            }
          )
          .setFooter({ text: 'After transfer, admin will verify and activate your plan.' })
          .setTimestamp();

        await reply({ embeds: [embed] });
        return;
      }

      // Check if user is linked
      if (!linkedUser) {
        await reply('❌ Please link your account first using `!link <code>` (get the code from the website dashboard).');
        return;
      }

      // Check for existing pending payment
      const existingPayment = await prisma.paymentTransaction.findFirst({
        where: {
          userId: linkedUser.id,
          status: 'WAITING_PAYMENT',
          expiresAt: { gt: new Date() },
        },
      });

      if (existingPayment) {
        await reply(`❌ You already have a pending payment.\n\nPayment ID: \`${existingPayment.id}\`\nAmount: **${existingPayment.finalAmount.toFixed(2)} UZS**\nExpires: ${new Date(existingPayment.expiresAt).toLocaleString()}\n\nPlease complete this payment or wait for it to expire.`);
        return;
      }

      const planArg = args[0].toUpperCase();

      // Handle custom plan
      if (planArg === 'CUSTOM') {
        const grade = args[1]?.toUpperCase();
        const tokens = parseInt(args[2] || '0');

        if (!grade || !['PASS', 'MERIT', 'DISTINCTION'].includes(grade)) {
          await reply('❌ Invalid grade. Usage: `!buy custom <PASS|MERIT|DISTINCTION> <tokens>`\n\nExample: `!buy custom MERIT 25000`');
          return;
        }

        const minTokens = CUSTOM_MIN_TOKENS[grade as keyof typeof CUSTOM_MIN_TOKENS];
        if (!tokens || tokens < minTokens) {
          await reply(`❌ Minimum tokens for ${grade} grade is **${minTokens.toLocaleString()}**.\n\nUsage: \`!buy custom ${grade} ${minTokens}\``);
          return;
        }

        // Create payment
        const { createPayment } = await import('../services/payment.service');
        try {
          const result = await createPayment({
            userId: linkedUser.id,
            planType: 'CUSTOM',
            customTokens: tokens,
            customGrade: grade as any,
          });

          const embed = new EmbedBuilder()
            .setTitle('Payment Created - Custom Plan')
            .setColor(0xFFAA00)
            .setDescription(`Transfer the **exact** amount below to complete your purchase.`)
            .addFields(
              { name: 'Payment Card', value: `\`${paymentCard}\``, inline: false },
              { name: 'Amount to Pay', value: `**${result.payment.finalAmount.toFixed(2)} UZS**`, inline: true },
              { name: 'Grade', value: grade, inline: true },
              { name: 'Tokens', value: tokens.toLocaleString(), inline: true },
              { name: 'Payment ID', value: `\`${result.payment.id}\``, inline: false },
              { name: 'Expires', value: new Date(result.payment.expiresAt).toLocaleString(), inline: true }
            )
            .setFooter({ text: 'Pay the EXACT amount (including decimals). Admin will verify your payment.' })
            .setTimestamp();

          await reply({ embeds: [embed] });
        } catch (error: any) {
          await reply(`❌ Error: ${error.message}`);
        }
        return;
      }

      // Handle standard plans (P, PM, PMD)
      if (!['P', 'PM', 'PMD'].includes(planArg)) {
        await reply('❌ Invalid plan. Use `!buy` to see available plans.\n\nValid plans: `P`, `PM`, `PMD`, `custom`');
        return;
      }

      const planConfig = PAYMENT_PLANS[planArg as keyof typeof PAYMENT_PLANS];

      // Create payment
      const { createPayment } = await import('../services/payment.service');
      try {
        const result = await createPayment({
          userId: linkedUser.id,
          planType: planArg as any,
        });

        const embed = new EmbedBuilder()
          .setTitle(`Payment Created - Plan ${planArg}`)
          .setColor(0xFFAA00)
          .setDescription(`Transfer the **exact** amount below to complete your purchase.`)
          .addFields(
            { name: 'Payment Card', value: `\`${paymentCard}\``, inline: false },
            { name: 'Amount to Pay', value: `**${result.payment.finalAmount.toFixed(2)} UZS**`, inline: true },
            { name: 'Duration', value: `${planConfig.durationDays} days`, inline: true },
            { name: 'Assignments', value: planConfig.assignments.toString(), inline: true },
            { name: 'Tokens', value: planConfig.tokensPerMonth.toLocaleString(), inline: true },
            { name: 'Grades', value: planConfig.grades.join(', '), inline: true },
            { name: 'Payment ID', value: `\`${result.payment.id}\``, inline: false },
            { name: 'Expires', value: new Date(result.payment.expiresAt).toLocaleString(), inline: true }
          )
          .setFooter({ text: 'Pay the EXACT amount (including decimals). Admin will verify your payment.' })
          .setTimestamp();

        await reply({ embeds: [embed] });
      } catch (error: any) {
        await reply(`❌ Error: ${error.message}`);
      }
    },
  },

  {
    name: 'status',
    aliases: ['mystatus', 'plan'],
    description: 'Check your current plan and token status',
    usage: '!status',
    execute: async (_args, user, reply) => {
      const linkedUser = await discordBotService.getUserByDiscordId(user.id);
      if (!linkedUser) {
        await reply('❌ Account not linked. Use `!link <code>` first.');
        return;
      }

      const plan = linkedUser.tokenPlan;
      
      if (!plan) {
        await reply('❌ No active plan. Use `!buy` to purchase a plan.');
        return;
      }

      const isExpired = plan.expiresAt && new Date() > new Date(plan.expiresAt);
      const statusColor = isExpired ? 0xFF0000 : plan.tokensRemaining > 0 ? 0x00FF00 : 0xFFAA00;

      const embed = new EmbedBuilder()
        .setTitle('Your Plan Status')
        .setColor(statusColor)
        .addFields(
          { name: 'Plan Type', value: plan.planType, inline: true },
          { name: 'Status', value: isExpired ? '❌ EXPIRED' : '✅ ACTIVE', inline: true },
          { name: 'Tokens Remaining', value: plan.tokensRemaining.toLocaleString(), inline: true },
          { name: 'Tokens Total', value: plan.tokensPerMonth.toLocaleString(), inline: true },
          { name: 'Assignments Used', value: `${(plan as any).assignmentsUsed || 0} / ${(plan as any).assignmentsAllowed || '∞'}`, inline: true },
          { name: 'Allowed Grades', value: (plan as any).allowedGrades?.join(', ') || 'All', inline: true },
          { name: 'Activated', value: new Date(plan.activatedAt).toLocaleDateString(), inline: true },
          { name: 'Expires', value: plan.expiresAt ? new Date(plan.expiresAt).toLocaleDateString() : 'Never', inline: true }
        )
        .setTimestamp();

      if (isExpired) {
        embed.setFooter({ text: 'Your plan has expired. Use !buy to purchase a new plan.' });
      }

      await reply({ embeds: [embed] });
    },
  },

  // ============ TEACHER COMMANDS ============
  {
    name: 'teacher',
    description: 'Teacher commands',
    usage: '!teacher <subcommand>',
    teacherOnly: true,
    execute: async (args, user, reply) => {
      const linkedUser = await discordBotService.getUserByDiscordId(user.id);
      if (!linkedUser || (linkedUser.role !== 'TEACHER' && linkedUser.role !== 'ADMIN')) {
        await reply('You must be a teacher to use this command.');
        return;
      }

      const subcommand = args[0]?.toLowerCase();

      if (!subcommand || subcommand === 'help') {
        await reply(`**Teacher Commands:**
\`!teacher briefs\` - List your briefs
\`!teacher brief <id>\` - View brief details
\`!teacher publish <id>\` - Publish a draft brief
\`!teacher unpublish <id>\` - Unpublish a brief`);
        return;
      }

      if (subcommand === 'briefs') {
        const briefs = await discordBotService.getTeacherBriefs(linkedUser.id);
        if (briefs.length === 0) {
          await reply('No briefs found.');
          return;
        }

        let text = '**Your Briefs:**\n\n';
        for (const b of briefs) {
          const status = b.status === 'PUBLISHED' ? '[PUB]' : '[DRAFT]';
          text += `${status} \`${b.id}\` - ${b.unitName} (Level ${b.level})\n`;
        }
        await reply(text);
        return;
      }

      if (subcommand === 'brief' && args[1]) {
        const brief = await discordBotService.getBriefById(args[1]);
        if (!brief) {
          await reply('Brief not found.');
          return;
        }

        const embed = new EmbedBuilder()
          .setTitle('Brief Details')
          .setColor(0x000000)
          .addFields(
            { name: 'Brief ID', value: brief.id, inline: false },
            { name: 'Unit', value: brief.unitName, inline: true },
            { name: 'Code', value: brief.unitCode || 'N/A', inline: true },
            { name: 'Level', value: brief.level.toString(), inline: true },
            { name: 'Status', value: brief.status, inline: true },
            { name: 'Subject', value: brief.subjectName, inline: true },
            { name: 'Created', value: new Date(brief.createdAt).toLocaleDateString(), inline: true }
          )
          .setTimestamp();

        await reply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'publish' && args[1]) {
        const result = await discordBotService.publishBrief(args[1]);
        await reply(result.message);
        return;
      }

      if (subcommand === 'unpublish' && args[1]) {
        const result = await discordBotService.unpublishBrief(args[1]);
        await reply(result.message);
        return;
      }

      await reply('Unknown subcommand. Use `!teacher help` for available commands.');
    },
  },

  // ============ ADMIN COMMANDS ============
  {
    name: 'admin',
    description: 'Admin commands',
    usage: '!admin <subcommand>',
    adminOnly: true,
    execute: async (args, user, reply) => {
      if (!discordBotService.isAdmin(user.id)) {
        await reply('You do not have permission to use admin commands.');
        return;
      }

      const subcommand = args[0]?.toLowerCase();

      if (!subcommand || subcommand === 'help') {
        await reply(`**Admin Commands:**
\`!admin overview\` - System overview
\`!admin payments\` - Pending payments
\`!admin approve <paymentId>\` - Approve payment
\`!admin reject <paymentId> <reason>\` - Reject payment
\`!admin user <userId>\` - View user details
\`!admin find <email>\` - Find user by email
\`!admin set-role <userId> <role>\` - Set user role (USER/VIP/TEACHER/ADMIN)
\`!admin add-tokens <userId> <amount>\` - Add tokens to user
\`!admin suspend <userId> <reason>\` - Suspend user
\`!admin unsuspend <userId>\` - Unsuspend user
\`!admin logs\` - Recent audit logs
\`!admin users\` - List all users
\`!admin card\` - View current payment card
\`!admin set-card <newCard>\` - Change payment card (DMs verification code)
\`!admin verify-card <code>\` - Verify and apply card change`);
        return;
      }

      // Overview
      if (subcommand === 'overview') {
        const data = await discordBotService.getOverview();
        await reply({ embeds: [formatOverview(data)] });
        return;
      }

      // Pending payments
      if (subcommand === 'payments') {
        const payments = await discordBotService.getPendingPayments();
        if (payments.length === 0) {
          await reply('No pending payments.');
          return;
        }

        let text = '**Pending Payments:**\n\n';
        for (const p of payments) {
          const userName = p.user?.studentProfile?.fullName || p.user?.email || 'Unknown';
          text += `\`${p.id}\`\n`;
          text += `  User: ${userName}\n`;
          text += `  Plan: ${p.planType}\n`;
          text += `  Amount: ${p.finalAmount.toFixed(2)} UZS\n`;
          text += `  Created: ${new Date(p.createdAt).toLocaleString()}\n\n`;
        }
        await reply(text);
        return;
      }

      // Approve payment
      if (subcommand === 'approve' && args[1]) {
        const result = await discordBotService.approvePayment(args[1], user.id);
        if (result.success) {
          await reply(`Payment approved successfully.
User: ${result.payment?.user?.email}
Plan: ${result.payment?.planType}
Tokens Granted: ${result.grants?.tokens?.toLocaleString()}
Expires: ${result.expiresAt?.toLocaleDateString()}`);
        } else {
          await reply(`Failed: ${result.message}`);
        }
        return;
      }

      // Reject payment
      if (subcommand === 'reject' && args[1]) {
        const reason = args.slice(2).join(' ') || 'No reason provided';
        const result = await discordBotService.rejectPayment(args[1], user.id, reason);
        await reply(result.success ? `Payment rejected. Reason: ${reason}` : `Failed: ${result.message}`);
        return;
      }

      // View user
      if (subcommand === 'user' && args[1]) {
        const userData = await discordBotService.getUserById(args[1]);
        if (!userData) {
          await reply('User not found.');
          return;
        }
        await reply({ embeds: [formatUser(userData)] });
        return;
      }

      // Find user by email
      if (subcommand === 'find' && args[1]) {
        const userData = await discordBotService.getUserByEmail(args[1]);
        if (!userData) {
          await reply('User not found.');
          return;
        }
        await reply({ embeds: [formatUser(userData)] });
        return;
      }

      // Set role
      if (subcommand === 'set-role' && args[1] && args[2]) {
        const role = args[2].toUpperCase();
        const validRoles = ['USER', 'VIP', 'TEACHER', 'ADMIN'];
        if (!validRoles.includes(role)) {
          await reply(`Invalid role. Valid roles: ${validRoles.join(', ')}`);
          return;
        }
        const result = await discordBotService.setUserRole(args[1], role as any);
        await reply(result.message);
        return;
      }

      // Add tokens
      if (subcommand === 'add-tokens' && args[1] && args[2]) {
        const amount = parseInt(args[2]);
        if (isNaN(amount) || amount <= 0) {
          await reply('Invalid amount. Must be a positive number.');
          return;
        }
        const result = await discordBotService.addTokensToUser(args[1], amount, user.id);
        await reply(result.message + (result.newBalance ? ` New balance: ${result.newBalance.toLocaleString()}` : ''));
        return;
      }

      // Suspend user
      if (subcommand === 'suspend' && args[1]) {
        const reason = args.slice(2).join(' ') || 'No reason provided';
        const result = await discordBotService.suspendUser(args[1], reason);
        await reply(result.message);
        return;
      }

      // Unsuspend user
      if (subcommand === 'unsuspend' && args[1]) {
        const result = await discordBotService.unsuspendUser(args[1]);
        await reply(result.message);
        return;
      }

      // Logs
      if (subcommand === 'logs') {
        const logs = await discordBotService.getRecentLogs();
        if (logs.length === 0) {
          await reply('No recent logs.');
          return;
        }

        let text = '**Recent Audit Logs:**\n\n';
        for (const log of logs) {
          text += `[${new Date(log.createdAt).toLocaleString()}]\n`;
          text += `  Action: ${log.action}\n`;
          text += `  Target: ${log.targetType} (${log.targetId})\n\n`;
        }
        await reply(text);
        return;
      }

      // List users
      if (subcommand === 'users') {
        const users = await discordBotService.getAllUsers();
        let text = '**Recent Users:**\n\n';
        for (const u of users) {
          const name = u.studentProfile?.fullName || u.email;
          const tokens = u.tokenPlan?.tokensRemaining || 0;
          text += `\`${u.id}\` - ${name} (${u.role}) - ${tokens.toLocaleString()} tokens\n`;
        }
        await reply(text);
        return;
      }

      // View current payment card
      if (subcommand === 'card') {
        const currentCard = await discordBotService.getCurrentPaymentCard();
        await reply(`**Current Payment Card:**\n\`${currentCard}\``);
        return;
      }

      // Set new payment card (initiates verification)
      if (subcommand === 'set-card' && args[1]) {
        if (user.id !== SUPER_ADMIN_DISCORD_ID) {
          await reply('Only the super admin can change the payment card.');
          return;
        }
        
        const newCard = args.slice(1).join(' ').trim();
        
        // Validate card format (basic check: 16-19 chars of digits and spaces)
        const digitsOnly = newCard.replace(/\s/g, '');
        if (!/^\d{13,19}$/.test(digitsOnly)) {
          await reply('Invalid card format. Please enter a valid card number (13-19 digits).');
          return;
        }

        // Generate verification code and try to DM the admin
        const code = discordBotService.generateCardChangeCode(newCard);
        
        try {
          // Send DM to super admin
          await user.send(`**Payment Card Change Verification**\n\nYou requested to change the payment card to:\n\`${newCard}\`\n\nVerification Code: \`${code}\`\n\nThis code expires in 5 minutes.\n\nTo confirm, use: \`!admin verify-card ${code}\` in the server.`);
          await reply(`Verification code sent to your DMs.\nUse \`!admin verify-card <code>\` to confirm the change.`);
        } catch {
          await reply(`Could not send DM. Your verification code is: \`${code}\`\n\nUse \`!admin verify-card ${code}\` to confirm the card change.`);
        }
        return;
      }

      // Verify card change
      if (subcommand === 'verify-card' && args[1]) {
        if (user.id !== SUPER_ADMIN_DISCORD_ID) {
          await reply('Only the super admin can change the payment card.');
          return;
        }
        
        const code = args[1].toUpperCase();
        const result = await discordBotService.verifyAndChangeCard(code, user.id);
        await reply(result.message);
        return;
      }

      await reply('Unknown subcommand. Use `!admin help` for available commands.');
    },
  },
];

// ============================================
// COMMAND EXECUTOR
// ============================================

export async function handlePrefixCommand(message: Message): Promise<void> {
  const prefix = '!';
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();

  if (!commandName) return;

  const command = commands.find(
    (c) => c.name === commandName || c.aliases?.includes(commandName)
  );

  if (!command) return;

  const reply = async (content: any) => {
    if (typeof content === 'string' && content.length > 2000) {
      // Split long messages
      const chunks = content.match(/.{1,1900}/gs) || [];
      for (const chunk of chunks) {
        await message.reply(chunk);
      }
    } else {
      await message.reply(content);
    }
  };

  try {
    await command.execute(args, message.author, reply);
  } catch (error) {
    console.error(`[DISCORD_CMD] Error executing ${commandName}:`, error);
    await message.reply('An error occurred while executing this command.');
  }
}

export async function handleSlashCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const commandName = interaction.commandName;
  
  // Map slash commands to prefix commands
  const slashToPrefix: Record<string, { command: string; args: () => string[] }> = {
    'help': { command: 'help', args: () => [] },
    'link': { command: 'link', args: () => [interaction.options.getString('code') || ''] },
    'unlink': { command: 'unlink', args: () => [] },
    'profile': { command: 'profile', args: () => [] },
    'tokens': { command: 'tokens', args: () => [] },
    'assignments': { command: 'assignments', args: () => [] },
    'assignment': { command: 'assignment', args: () => [interaction.options.getString('id') || ''] },
    'payments': { command: 'payments', args: () => [] },
    'support': { command: 'support', args: () => [] },
    'admin-overview': { command: 'admin', args: () => ['overview'] },
    'admin-payments': { command: 'admin', args: () => ['payments'] },
    'admin-approve': { command: 'admin', args: () => ['approve', interaction.options.getString('payment_id') || ''] },
    'admin-reject': { command: 'admin', args: () => ['reject', interaction.options.getString('payment_id') || '', interaction.options.getString('reason') || ''] },
    'admin-user': { command: 'admin', args: () => ['user', interaction.options.getString('user_id') || ''] },
    'admin-find': { command: 'admin', args: () => ['find', interaction.options.getString('email') || ''] },
    'admin-add-tokens': { command: 'admin', args: () => ['add-tokens', interaction.options.getString('user_id') || '', interaction.options.getInteger('amount')?.toString() || ''] },
    'admin-suspend': { command: 'admin', args: () => ['suspend', interaction.options.getString('user_id') || '', interaction.options.getString('reason') || ''] },
    'admin-unsuspend': { command: 'admin', args: () => ['unsuspend', interaction.options.getString('user_id') || ''] },
    'teacher-briefs': { command: 'teacher', args: () => ['briefs'] },
    'teacher-brief': { command: 'teacher', args: () => ['brief', interaction.options.getString('brief_id') || ''] },
    'teacher-publish': { command: 'teacher', args: () => ['publish', interaction.options.getString('brief_id') || ''] },
    'teacher-unpublish': { command: 'teacher', args: () => ['unpublish', interaction.options.getString('brief_id') || ''] },
  };

  const mapping = slashToPrefix[commandName];
  if (!mapping) {
    await interaction.reply({ content: 'Unknown command', ephemeral: true });
    return;
  }

  const command = commands.find((c) => c.name === mapping.command);
  if (!command) {
    await interaction.reply({ content: 'Command not found', ephemeral: true });
    return;
  }

  await interaction.deferReply();

  const reply = async (content: any) => {
    if (typeof content === 'string' && content.length > 2000) {
      const chunks = content.match(/.{1,1900}/gs);
      if (chunks && chunks.length > 0) {
        await interaction.editReply(chunks[0] as string);
        for (let i = 1; i < chunks.length; i++) {
          await interaction.followUp(chunks[i] as string);
        }
      } else {
        await interaction.editReply('No content to display.');
      }
    } else {
      await interaction.editReply(content);
    }
  };

  try {
    await command.execute(mapping.args(), interaction.user, reply);
  } catch (error) {
    console.error(`[DISCORD_SLASH] Error executing ${commandName}:`, error);
    await interaction.editReply('An error occurred while executing this command.');
  }
}

export { commands };
