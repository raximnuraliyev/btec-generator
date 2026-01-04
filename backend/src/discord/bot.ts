/**
 * Discord Bot - Main Entry Point
 * Control + Notification + Support interface for BTEC Generator
 */

import {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  TextChannel,
  EmbedBuilder,
  Partials,
} from 'discord.js';
import { handlePrefixCommand, handleSlashCommand } from './commands';
import { discordEvents } from './events';
import { SUPER_ADMIN_DISCORD_ID, BotEvent } from './types';

// ============================================
// BOT CONFIGURATION
// ============================================

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || process.env.DISCORD_APPLICATION_ID;
const DISCORD_ADMIN_CHANNEL_ID = process.env.DISCORD_ADMIN_CHANNEL_ID;
const DISCORD_ENABLED = process.env.DISCORD_ENABLED === 'true';

if (!DISCORD_TOKEN) {
  console.warn('[DISCORD_BOT] DISCORD_TOKEN not set, bot will not start');
}

// ============================================
// SLASH COMMANDS DEFINITIONS
// ============================================

const slashCommands = [
  // User commands
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show available commands'),
  
  new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your Discord account using verification code from website')
    .addStringOption(option =>
      option.setName('code')
        .setDescription('6-character verification code from the website')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('unlink')
    .setDescription('Unlink your Discord account'),
  
  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your profile'),
  
  new SlashCommandBuilder()
    .setName('tokens')
    .setDescription('View your token balance'),
  
  new SlashCommandBuilder()
    .setName('assignments')
    .setDescription('List your assignments'),
  
  new SlashCommandBuilder()
    .setName('assignment')
    .setDescription('View assignment status')
    .addStringOption(option =>
      option.setName('id')
        .setDescription('Assignment ID')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('payments')
    .setDescription('View your payment history'),
  
  new SlashCommandBuilder()
    .setName('support')
    .setDescription('Get support information'),

  // Admin commands - hidden from regular users (requires Administrator permission)
  new SlashCommandBuilder()
    .setName('admin-overview')
    .setDescription('[Admin] System overview')
    .setDefaultMemberPermissions('0'),
  
  new SlashCommandBuilder()
    .setName('admin-payments')
    .setDescription('[Admin] View pending payments')
    .setDefaultMemberPermissions('0'),
  
  new SlashCommandBuilder()
    .setName('admin-approve')
    .setDescription('[Admin] Approve a payment')
    .setDefaultMemberPermissions('0')
    .addStringOption(option =>
      option.setName('payment_id')
        .setDescription('Payment ID to approve')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('admin-reject')
    .setDescription('[Admin] Reject a payment')
    .setDefaultMemberPermissions('0')
    .addStringOption(option =>
      option.setName('payment_id')
        .setDescription('Payment ID to reject')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Rejection reason')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('admin-user')
    .setDescription('[Admin] View user details')
    .setDefaultMemberPermissions('0')
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('User ID')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('admin-find')
    .setDescription('[Admin] Find user by email')
    .setDefaultMemberPermissions('0')
    .addStringOption(option =>
      option.setName('email')
        .setDescription('User email')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('admin-add-tokens')
    .setDescription('[Admin] Add tokens to a user')
    .setDefaultMemberPermissions('0')
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('User ID')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Token amount')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('admin-suspend')
    .setDescription('[Admin] Suspend a user')
    .setDefaultMemberPermissions('0')
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('User ID')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Suspension reason')
        .setRequired(false)),
  
  new SlashCommandBuilder()
    .setName('admin-unsuspend')
    .setDescription('[Admin] Unsuspend a user')
    .setDefaultMemberPermissions('0')
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('User ID')
        .setRequired(true)),

  // Teacher commands - hidden from regular users
  new SlashCommandBuilder()
    .setName('teacher-briefs')
    .setDescription('[Teacher] List your briefs')
    .setDefaultMemberPermissions('0'),
  
  new SlashCommandBuilder()
    .setName('teacher-brief')
    .setDescription('[Teacher] View brief details')
    .setDefaultMemberPermissions('0')
    .addStringOption(option =>
      option.setName('brief_id')
        .setDescription('Brief ID')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('teacher-publish')
    .setDescription('[Teacher] Publish a brief')
    .setDefaultMemberPermissions('0')
    .addStringOption(option =>
      option.setName('brief_id')
        .setDescription('Brief ID')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('teacher-unpublish')
    .setDescription('[Teacher] Unpublish a brief')
    .setDefaultMemberPermissions('0')
    .addStringOption(option =>
      option.setName('brief_id')
        .setDescription('Brief ID')
        .setRequired(true)),
];

// ============================================
// BOT CLIENT
// ============================================

class DiscordBot {
  private client: Client;
  private isReady = false;
  private adminChannel: TextChannel | null = null;

  constructor() {
    // Note: MessageContent and GuildMembers are privileged intents
    // You must enable them in Discord Developer Portal > Bot > Privileged Gateway Intents
    // If you don't want to enable them, prefix commands won't work (only slash commands will)
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,  // Required for prefix commands - ENABLE IN DEVELOPER PORTAL
        GatewayIntentBits.DirectMessages,
        // GatewayIntentBits.GuildMembers,  // Not required - removed
      ],
      partials: [Partials.Channel, Partials.Message],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Ready event
    this.client.once(Events.ClientReady, async (readyClient) => {
      console.log(`[DISCORD_BOT] Logged in as ${readyClient.user.tag}`);
      this.isReady = true;

      // Register slash commands
      await this.registerSlashCommands();

      // Get admin channel
      if (DISCORD_ADMIN_CHANNEL_ID) {
        try {
          const channel = await this.client.channels.fetch(DISCORD_ADMIN_CHANNEL_ID);
          if (channel?.isTextBased()) {
            this.adminChannel = channel as TextChannel;
            console.log(`[DISCORD_BOT] Admin channel connected: ${this.adminChannel.name}`);
          }
        } catch (err) {
          console.warn('[DISCORD_BOT] Could not fetch admin channel:', err);
        }
      }

      // Subscribe to bot events
      this.subscribeToEvents();
    });

    // Prefix command handler
    this.client.on(Events.MessageCreate, async (message) => {
      if (message.author.bot) return;
      await handlePrefixCommand(message);
    });

    // Slash command handler
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      await handleSlashCommand(interaction);
    });

    // Error handler
    this.client.on(Events.Error, (error) => {
      console.error('[DISCORD_BOT] Client error:', error);
    });
  }

  private async registerSlashCommands(): Promise<void> {
    if (!DISCORD_CLIENT_ID || !DISCORD_TOKEN) return;

    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

    try {
      console.log('[DISCORD_BOT] Registering slash commands...');
      
      await rest.put(
        Routes.applicationCommands(DISCORD_CLIENT_ID),
        { body: slashCommands.map(cmd => cmd.toJSON()) }
      );

      console.log(`[DISCORD_BOT] Registered ${slashCommands.length} slash commands`);
    } catch (error) {
      console.error('[DISCORD_BOT] Failed to register slash commands:', error);
    }
  }

  private subscribeToEvents(): void {
    // Payment created - DM user
    discordEvents.on('PAYMENT_CREATED', async (event: BotEvent) => {
      if (!event.discordUserId) return;
      
      try {
        const user = await this.client.users.fetch(event.discordUserId);
        const embed = new EmbedBuilder()
          .setTitle('Payment Created')
          .setColor(0xFFAA00)
          .addFields(
            { name: 'Amount', value: `${event.data.amount.toFixed(2)} UZS`, inline: true },
            { name: 'Plan', value: event.data.planType, inline: true },
            { name: 'Payment ID', value: event.data.paymentId, inline: false },
            { name: 'Status', value: 'Waiting for payment', inline: true },
            { name: 'Expires', value: new Date(event.data.expiresAt).toLocaleString(), inline: true }
          )
          .setFooter({ text: 'Pay the exact amount to the card number shown on the website' })
          .setTimestamp();

        await user.send({ embeds: [embed] });
      } catch (err) {
        console.warn('[DISCORD_BOT] Could not DM user for PAYMENT_CREATED:', err);
      }
    });

    // Payment pending - notify admin
    discordEvents.on('PAYMENT_PENDING', async (event: BotEvent) => {
      if (!this.adminChannel) return;

      const embed = new EmbedBuilder()
        .setTitle('New Payment Pending Approval')
        .setColor(0xFFAA00)
        .addFields(
          { name: 'User', value: event.data.userName || 'Unknown', inline: true },
          { name: 'Email', value: event.data.userEmail || 'Unknown', inline: true },
          { name: 'Amount', value: `${event.data.amount.toFixed(2)} UZS`, inline: true },
          { name: 'Plan', value: event.data.planType, inline: true },
          { name: 'Payment ID', value: event.data.paymentId, inline: false }
        )
        .setFooter({ text: `Use !admin approve ${event.data.paymentId} to approve` })
        .setTimestamp();

      await this.adminChannel.send({ embeds: [embed] });

      // Also DM super admin
      try {
        const admin = await this.client.users.fetch(SUPER_ADMIN_DISCORD_ID);
        await admin.send({ embeds: [embed] });
      } catch (err) {
        console.warn('[DISCORD_BOT] Could not DM super admin:', err);
      }
    });

    // Payment approved - DM user
    discordEvents.on('PAYMENT_APPROVED', async (event: BotEvent) => {
      if (!event.discordUserId) return;

      try {
        const user = await this.client.users.fetch(event.discordUserId);
        const embed = new EmbedBuilder()
          .setTitle('Payment Approved')
          .setColor(0x00FF00)
          .addFields(
            { name: 'Plan Activated', value: event.data.planType, inline: true },
            { name: 'Tokens Added', value: event.data.tokensGranted.toLocaleString(), inline: true },
            { name: 'Valid Until', value: new Date(event.data.expiresAt).toLocaleDateString(), inline: true }
          )
          .setFooter({ text: 'You can now generate assignments' })
          .setTimestamp();

        await user.send({ embeds: [embed] });
      } catch (err) {
        console.warn('[DISCORD_BOT] Could not DM user for PAYMENT_APPROVED:', err);
      }

      // Log to admin channel
      if (this.adminChannel) {
        await this.adminChannel.send(
          `Payment ${event.data.paymentId} approved. User: ${event.userId}, Plan: ${event.data.planType}`
        );
      }
    });

    // Payment rejected - DM user
    discordEvents.on('PAYMENT_REJECTED', async (event: BotEvent) => {
      if (!event.discordUserId) return;

      try {
        const user = await this.client.users.fetch(event.discordUserId);
        const embed = new EmbedBuilder()
          .setTitle('Payment Rejected')
          .setColor(0xFF0000)
          .addFields(
            { name: 'Payment ID', value: event.data.paymentId, inline: true },
            { name: 'Reason', value: event.data.reason || 'No reason provided', inline: false }
          )
          .setFooter({ text: 'Contact support if you believe this is an error' })
          .setTimestamp();

        await user.send({ embeds: [embed] });
      } catch (err) {
        console.warn('[DISCORD_BOT] Could not DM user for PAYMENT_REJECTED:', err);
      }
    });

    // Assignment completed - DM user
    discordEvents.on('ASSIGNMENT_COMPLETED', async (event: BotEvent) => {
      if (!event.discordUserId) return;

      try {
        const user = await this.client.users.fetch(event.discordUserId);
        const embed = new EmbedBuilder()
          .setTitle('Assignment Completed')
          .setColor(0x00FF00)
          .addFields(
            { name: 'Assignment ID', value: event.data.assignmentId, inline: false },
            { name: 'Word Count', value: event.data.wordCount.toLocaleString(), inline: true },
            { name: 'Language', value: event.data.language, inline: true }
          )
          .setFooter({ text: 'You can download it from your dashboard' })
          .setTimestamp();

        await user.send({ embeds: [embed] });
      } catch (err) {
        console.warn('[DISCORD_BOT] Could not DM user for ASSIGNMENT_COMPLETED:', err);
      }
    });

    // Token low warning - DM user
    discordEvents.on('TOKEN_LOW', async (event: BotEvent) => {
      if (!event.discordUserId) return;

      try {
        const user = await this.client.users.fetch(event.discordUserId);
        const embed = new EmbedBuilder()
          .setTitle('Low Token Warning')
          .setColor(0xFFAA00)
          .addFields(
            { name: 'Tokens Remaining', value: event.data.tokensRemaining.toLocaleString(), inline: true },
            { name: 'Threshold', value: event.data.threshold.toLocaleString(), inline: true }
          )
          .setFooter({ text: 'Consider upgrading your plan' })
          .setTimestamp();

        await user.send({ embeds: [embed] });
      } catch (err) {
        console.warn('[DISCORD_BOT] Could not DM user for TOKEN_LOW:', err);
      }
    });

    // System error - notify admin
    discordEvents.on('SYSTEM_ERROR', async (event: BotEvent) => {
      if (!this.adminChannel) return;

      const severityColor = {
        low: 0xFFFF00,
        medium: 0xFFA500,
        high: 0xFF4500,
        critical: 0xFF0000,
      };

      const embed = new EmbedBuilder()
        .setTitle('System Alert')
        .setColor(severityColor[event.data.severity as keyof typeof severityColor] || 0xFF0000)
        .addFields(
          { name: 'Severity', value: event.data.severity.toUpperCase(), inline: true },
          { name: 'Context', value: event.data.context, inline: true },
          { name: 'Error', value: event.data.error.substring(0, 1000), inline: false }
        )
        .setTimestamp();

      await this.adminChannel.send({ embeds: [embed] });

      // DM super admin for critical errors
      if (event.data.severity === 'critical') {
        try {
          const admin = await this.client.users.fetch(SUPER_ADMIN_DISCORD_ID);
          await admin.send({ embeds: [embed] });
        } catch (err) {
          console.warn('[DISCORD_BOT] Could not DM super admin for SYSTEM_ERROR:', err);
        }
      }
    });
  }

  async start(): Promise<void> {
    if (!DISCORD_TOKEN) {
      console.warn('[DISCORD_BOT] No token provided, skipping bot start');
      return;
    }

    if (!DISCORD_ENABLED) {
      console.log('[DISCORD_BOT] Bot disabled via DISCORD_ENABLED=false');
      return;
    }

    try {
      await this.client.login(DISCORD_TOKEN);
    } catch (error) {
      console.error('[DISCORD_BOT] Failed to login:', error);
    }
  }

  async stop(): Promise<void> {
    if (this.isReady) {
      await this.client.destroy();
      this.isReady = false;
      console.log('[DISCORD_BOT] Bot stopped');
    }
  }

  // Public methods for sending notifications programmatically
  async sendAdminNotification(content: string | { embeds: EmbedBuilder[] }): Promise<void> {
    if (!this.adminChannel) return;
    await this.adminChannel.send(content);
  }

  async dmUser(discordId: string, content: string | { embeds: EmbedBuilder[] }): Promise<boolean> {
    try {
      const user = await this.client.users.fetch(discordId);
      await user.send(content);
      return true;
    } catch {
      return false;
    }
  }

  async dmSuperAdmin(content: string | { embeds: EmbedBuilder[] }): Promise<void> {
    try {
      const admin = await this.client.users.fetch(SUPER_ADMIN_DISCORD_ID);
      await admin.send(content);
    } catch (err) {
      console.warn('[DISCORD_BOT] Could not DM super admin:', err);
    }
  }

  getClient(): Client {
    return this.client;
  }

  isConnected(): boolean {
    return this.isReady;
  }
}

// Export singleton instance
export const discordBot = new DiscordBot();
