/**
 * Discord Bot Types
 * Type definitions for Discord integration
 */

// Discord Role -> Website Role mapping (matches Prisma UserRole enum)
export type WebsiteRole = 'ADMIN' | 'TEACHER' | 'VIP' | 'USER';

export const DISCORD_ROLE_MAP: Record<string, WebsiteRole> = {
  'Admin': 'ADMIN',
  'Teacher': 'TEACHER', 
  'VIP': 'VIP',
  'User': 'USER',
};

// Event types for website -> Discord communication
export type BotEventType =
  | 'PAYMENT_CREATED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_APPROVED'
  | 'PAYMENT_REJECTED'
  | 'PAYMENT_EXPIRED'
  | 'ASSIGNMENT_STARTED'
  | 'ASSIGNMENT_COMPLETED'
  | 'ASSIGNMENT_FAILED'
  | 'TOKEN_LOW'
  | 'SYSTEM_ERROR'
  | 'USER_REGISTERED'
  | 'USER_SUSPENDED';

export interface BotEvent {
  type: BotEventType;
  userId?: string;
  discordUserId?: string;
  data: Record<string, any>;
  timestamp: Date;
}

// Command context
export interface CommandContext {
  discordUserId: string;
  websiteUserId?: string;
  websiteRole?: WebsiteRole;
  isLinked: boolean;
  isAdmin: boolean;
}

// Linked user
export interface LinkedUser {
  discordId: string;
  websiteUserId: string;
  email: string;
  role: WebsiteRole;
  linkedAt: Date;
}

// Admin constants
export const SUPER_ADMIN_DISCORD_ID = '1165864378491486258';
