# BTEC Generator Discord Bot

This Discord bot serves as a **control + notification + support** interface for the BTEC Generator website. It is NOT a chat bot.

## ⚠️ IMPORTANT: Setup Requirements

**You MUST enable Privileged Gateway Intents in Discord Developer Portal:**

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to **Bot** section
4. Scroll down to **Privileged Gateway Intents**
5. Enable **MESSAGE CONTENT INTENT** (required for `!` prefix commands)
6. Save changes

Without this, the bot will fail to start with "Used disallowed intents" error.

## Features

### 🔐 Authentication & Account Linking
- Link Discord accounts to website accounts via email
- Role synchronization between website and Discord
- Super admin access for platform owner

### 📣 Notification System
- **Payment Created**: DMs user when they create a payment request
- **Payment Pending**: Notifies admin channel when a new payment needs review
- **Payment Approved**: DMs user when their payment is approved
- **Payment Rejected**: DMs user with reason when payment is rejected
- **Assignment Completed**: DMs user when their assignment generation is complete
- **Token Low Warning**: DMs user when tokens are running low
- **System Errors**: Notifies super admin of critical system errors

### 🎛️ Commands

#### User Commands (Everyone)
| Command | Slash | Description |
|---------|-------|-------------|
| `!help` | `/help` | Show available commands |
| `!link <code>` | `/link code:<code>` | Link Discord using verification code from website |
| `!unlink` | `/unlink` | Unlink your Discord account |
| `!profile` | `/profile` | View your profile information |
| `!tokens` | `/tokens` | Check your token balance |
| `!assignments` | `/assignments` | List your recent assignments |
| `!assignment <id>` | `/assignment id:<id>` | View specific assignment details |
| `!payments` | `/payments` | View your payment history |
| `!support` | `/support` | Get support information |

#### Teacher Commands
| Command | Slash | Description |
|---------|-------|-------------|
| `!teacher briefs` | `/teacher-briefs` | List your briefs |
| `!teacher publish <id>` | `/teacher-publish id:<id>` | Publish a brief |
| `!teacher unpublish <id>` | `/teacher-unpublish id:<id>` | Unpublish a brief |

#### Admin Commands (Admin only)
| Command | Slash | Description |
|---------|-------|-------------|
| `!admin overview` | `/admin-overview` | Platform statistics |
| `!admin payments` | `/admin-payments` | View pending payments |
| `!admin approve <id> [note]` | `/admin-approve` | Approve a payment |
| `!admin reject <id> <reason>` | `/admin-reject` | Reject a payment |
| `!admin user <id>` | `/admin-user` | View user details |
| `!admin find <email>` | `/admin-find` | Find user by email |
| `!admin set-role <id> <role>` | `/admin-set-role` | Change user role |
| `!admin add-tokens <id> <amount>` | `/admin-add-tokens` | Add tokens to user |
| `!admin suspend <id>` | `/admin-suspend` | Suspend a user |
| `!admin unsuspend <id>` | `/admin-unsuspend` | Unsuspend a user |
| `!admin logs [count]` | `/admin-logs` | View recent activity logs |
| `!admin users [count]` | `/admin-users` | List recent users |

## Setup

### 1. Create Discord Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Go to "Bot" section and click "Add Bot"
4. **CRITICAL**: Enable these Privileged Gateway Intents:
   - ✅ MESSAGE CONTENT INTENT (required for ! prefix commands)
5. Copy the bot token

### 2. Configure Environment Variables
Add these to your `.env` file:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_application_id_here
DISCORD_ADMIN_CHANNEL_ID=your_admin_channel_id_here
DISCORD_ENABLED=true
```

### 3. Invite Bot to Server
Generate an invite URL with these permissions:
- Send Messages
- Embed Links
- Read Message History
- Use Slash Commands
- Manage Roles (optional, for role sync)

URL format:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2147485696&scope=bot%20applications.commands
```

### 4. Set Admin Channel
Create a private channel in your Discord server for admin notifications and copy its ID to `DISCORD_ADMIN_CHANNEL_ID`.

## Role Mapping

Website roles are mapped to Discord roles:

| Website Role | Discord Role |
|-------------|--------------|
| ADMIN | Admin |
| TEACHER | Teacher |
| VIP | VIP |
| USER | User |

## Super Admin

The super admin Discord ID is hardcoded:
- **Discord ID**: `1165864378491486258`

Super admin can:
- Receive critical system error notifications via DM
- Use all admin commands regardless of linked account status

## Architecture

```
backend/src/discord/
├── bot.ts       # Main bot client, slash commands, event handlers
├── commands.ts  # Command handlers (prefix & slash)
├── events.ts    # Event emitter for website → Discord notifications
├── service.ts   # Data retrieval and actions
├── types.ts     # Type definitions and constants
└── index.ts     # Module exports
```

## Event Flow

### Payment Notification Flow
```
User creates payment on website
    ↓
Website emits PAYMENT_CREATED event
    ↓
Bot DMs user: "Your payment request has been created"
Bot posts in admin channel: "New pending payment needs review"
    ↓
Admin approves/rejects via Discord command or website
    ↓
Website emits PAYMENT_APPROVED or PAYMENT_REJECTED event
    ↓
Bot DMs user: "Your payment has been approved/rejected"
```

### Assignment Completion Flow
```
Assignment generation completes
    ↓
Website emits ASSIGNMENT_COMPLETED event
    ↓
Bot DMs user: "Your assignment is ready for download"
```

## Payment Card

For manual card payments:
```
Card Number: 9680 3501 4687 8359
Cardholder: BTEC Generator
```

## Discord Server

Join the official BTEC Generator Discord server:
**https://discord.gg/wjPGhY6X**

## How to Link Your Account

1. Go to the BTEC Generator website
2. Open Dashboard → Click "Link Your Discord Account"
3. Click "Generate Link Code"
4. Copy the 6-character code
5. Join our Discord server (link above)
6. Use command: `!link YOUR_CODE` or `/link code:YOUR_CODE`
7. Done! You'll now receive notifications via Discord DM

## Troubleshooting

### "Used disallowed intents" Error
This is the most common error. You MUST enable **MESSAGE CONTENT INTENT** in Discord Developer Portal:
1. Go to https://discord.com/developers/applications
2. Select your application → Bot section
3. Scroll to "Privileged Gateway Intents"
4. Enable **MESSAGE CONTENT INTENT**
5. Save and restart the bot

### Bot Not Starting
1. Check `DISCORD_TOKEN` is valid
2. Verify `DISCORD_ENABLED=true`
3. Ensure MESSAGE CONTENT INTENT is enabled in Discord Developer Portal

### Connect Timeout Error
This is a network issue - check your firewall/proxy settings. Discord API must be accessible.

### Slash Commands Not Appearing
1. Re-invite bot with `applications.commands` scope
2. Wait a few minutes for Discord to propagate commands
3. Check bot logs for registration errors

### DMs Not Sending
1. User must have DMs enabled for the server
2. Check user has linked their Discord account via the website
3. Verify `discordId` is stored in user record

### Link Code Not Working
1. Codes expire after 5 minutes
2. Generate a new code from the website
3. Make sure to use the exact code (case-insensitive)

## Database Schema

The User model includes:
```prisma
model User {
  discordId  String?  @unique  // Discord user ID for linking
  // ... other fields
}
```
