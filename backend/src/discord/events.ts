/**
 * Discord Bot Event Emitter
 * Central event bus for website -> Discord communication
 */

import { EventEmitter } from 'events';
import { BotEvent } from './types';

class DiscordEventEmitter extends EventEmitter {
  private static instance: DiscordEventEmitter;

  private constructor() {
    super();
    this.setMaxListeners(20);
  }

  static getInstance(): DiscordEventEmitter {
    if (!DiscordEventEmitter.instance) {
      DiscordEventEmitter.instance = new DiscordEventEmitter();
    }
    return DiscordEventEmitter.instance;
  }

  emitBotEvent(event: BotEvent): void {
    console.log(`[DISCORD_EVENT] ${event.type}`, { 
      userId: event.userId, 
      discordUserId: event.discordUserId 
    });
    this.emit('bot-event', event);
    this.emit(event.type, event);
  }

  // Helper methods for common events
  paymentCreated(userId: string, discordUserId: string | null, data: {
    paymentId: string;
    amount: number;
    planType: string;
    expiresAt: Date;
  }): void {
    this.emitBotEvent({
      type: 'PAYMENT_CREATED',
      userId,
      discordUserId: discordUserId || undefined,
      data,
      timestamp: new Date(),
    });
  }

  paymentPending(userId: string, data: {
    paymentId: string;
    amount: number;
    planType: string;
    userName: string;
    userEmail: string;
  }): void {
    this.emitBotEvent({
      type: 'PAYMENT_PENDING',
      userId,
      data,
      timestamp: new Date(),
    });
  }

  paymentApproved(userId: string, discordUserId: string | null, data: {
    paymentId: string;
    planType: string;
    tokensGranted: number;
    expiresAt: Date;
  }): void {
    this.emitBotEvent({
      type: 'PAYMENT_APPROVED',
      userId,
      discordUserId: discordUserId || undefined,
      data,
      timestamp: new Date(),
    });
  }

  paymentRejected(userId: string, discordUserId: string | null, data: {
    paymentId: string;
    reason: string;
  }): void {
    this.emitBotEvent({
      type: 'PAYMENT_REJECTED',
      userId,
      discordUserId: discordUserId || undefined,
      data,
      timestamp: new Date(),
    });
  }

  assignmentCompleted(userId: string, discordUserId: string | null, data: {
    assignmentId: string;
    wordCount: number;
    language: string;
  }): void {
    this.emitBotEvent({
      type: 'ASSIGNMENT_COMPLETED',
      userId,
      discordUserId: discordUserId || undefined,
      data,
      timestamp: new Date(),
    });
  }

  tokenLow(userId: string, discordUserId: string | null, data: {
    tokensRemaining: number;
    threshold: number;
  }): void {
    this.emitBotEvent({
      type: 'TOKEN_LOW',
      userId,
      discordUserId: discordUserId || undefined,
      data,
      timestamp: new Date(),
    });
  }

  systemError(data: {
    error: string;
    context: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): void {
    this.emitBotEvent({
      type: 'SYSTEM_ERROR',
      data,
      timestamp: new Date(),
    });
  }
}

export const discordEvents = DiscordEventEmitter.getInstance();
