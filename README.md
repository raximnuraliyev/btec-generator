<div align="center">

# 🎓 BTEC Generator

### AI-Powered Academic Assignment Generation Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Discord](https://img.shields.io/badge/Discord-Bot-5865F2?logo=discord)](https://discord.js.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)

**Generate complete BTEC Level 3-6 assignments (2,000–9,500 words) with intelligent AI that never loses context**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API](#-api-endpoints) • [Discord Bot](#-discord-bot)

</div>

---

## ✨ Features

### 🤖 Intelligent Generation
- **Context-Aware AI** - Uses Claude 3.5 Sonnet with micro-task architecture to maintain coherence across long documents
- **Criterion-by-Criterion** - Generates content for each BTEC criterion separately, ensuring all requirements are met
- **Brief Analysis** - Automatically parses PDF/DOCX briefs to extract learning outcomes and requirements
- **Word Count Control** - Precise targeting from 2,000 to 9,500 words with smart distribution

### 📊 Real-Time Monitoring
- **Live Progress** - WebSocket-powered updates showing generation progress in real-time
- **Checkpoint System** - Automatic saving allows pause/resume of generation at any point
- **Queue Management** - BullMQ-powered job queue with Redis for reliable background processing

### 🔐 Security & Access Control
- **JWT Authentication** - Secure token-based auth with refresh tokens
- **Role-Based Access** - USER, VIP, and ADMIN roles with different capabilities
- **Rate Limiting** - Intelligent rate limiting to prevent abuse
- **Student Verification** - HEMIS ID verification system for institutional use

### 🤝 Discord Integration
- **Account Linking** - Link Discord accounts for notifications
- **Bot Commands** - Check progress, cancel jobs, export assignments via Discord
- **Real-Time Alerts** - Get notified when generation completes or needs attention
- **Admin Approvals** - Approve/reject assignments directly from Discord

### 📄 Export Options
- **DOCX Export** - Professional Word documents with proper formatting
- **PDF Export** - Print-ready PDF generation
- **Custom Formatting** - Headers, citations, and academic styling

### 🛡️ Admin Dashboard
- **User Management** - View, edit, ban/unban users
- **Assignment Overview** - Monitor all assignments across the platform
- **Token Analytics** - Track AI token usage and costs
- **Issue Tracking** - Built-in support ticket system

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** 16+
- **Redis** 7+
- **Docker** (optional, for containerized deployment)

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/raximnuraliyev/btec-generator.git
cd btec-generator

# Copy environment file
cp .env.example .env
# Edit .env with your API keys and database credentials

# Start everything with Docker
npm run docker:full
```

The app will be available at `http://localhost:3000`

### Option 2: Manual Setup

```bash
# Clone the repository
git clone https://github.com/raximnuraliyev/btec-generator.git
cd btec-generator

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Start Redis (required for job queue)
# Using Docker: docker run -d -p 6379:6379 redis:alpine

# Start backend (in backend directory)
npm run dev

# Start frontend (in root directory, new terminal)
cd ..
npm run dev
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/btec_generator"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key"

# AI Provider (Anthropic Claude)
ANTHROPIC_API_KEY="sk-ant-..."

# Discord Bot (optional)
DISCORD_BOT_TOKEN="your-discord-bot-token"
DISCORD_CLIENT_ID="your-client-id"

# Server
PORT=3001
NODE_ENV=development
```

---

## 🏗️ Architecture

```
btec-generator/
├── src/                          # Frontend (React + TypeScript)
│   ├── app/
│   │   ├── components/           # React components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── AssignmentSetup.tsx
│   │   │   ├── MonitorPage.tsx
│   │   │   ├── ReviewPage.tsx
│   │   │   ├── AdminPage.tsx
│   │   │   └── IssuePage.tsx
│   │   ├── context/              # React Context providers
│   │   ├── services/             # API client
│   │   └── types/                # TypeScript definitions
│   └── styles/                   # Tailwind CSS
│
├── backend/                      # Backend (Node.js + Express)
│   ├── src/
│   │   ├── index.ts              # Server entry point
│   │   ├── config/               # Configuration
│   │   ├── routes/               # API routes
│   │   ├── services/
│   │   │   ├── ai/               # Claude AI integration
│   │   │   ├── generation/       # Content generation pipeline
│   │   │   ├── queue/            # BullMQ job queue
│   │   │   └── export/           # DOCX/PDF export
│   │   ├── discord/              # Discord bot
│   │   ├── middleware/           # Auth, rate limiting
│   │   └── websockets/           # Real-time updates
│   └── prisma/
│       └── schema.prisma         # Database schema
│
├── docker-compose.yml            # Production deployment
├── docker-compose.dev.yml        # Development with hot reload
└── docker-compose.full.yml       # Full stack including DB & Redis
```

### Generation Pipeline

```
Brief Upload → Parse PDF/DOCX → Extract Learning Outcomes
                                        ↓
                               Plan Micro-Tasks
                                        ↓
         ┌──────────────────────────────┴──────────────────────────────┐
         ↓                              ↓                              ↓
   Generate P1                    Generate P2                    Generate M1
   (with context)                 (with P1 context)              (with P1,P2)
         ↓                              ↓                              ↓
         └──────────────────────────────┴──────────────────────────────┘
                                        ↓
                               Assemble Document
                                        ↓
                               Export DOCX/PDF
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login user |
| `POST` | `/api/auth/refresh` | Refresh JWT token |
| `GET` | `/api/auth/me` | Get current user |

### Assignments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/assignments` | List user's assignments |
| `POST` | `/api/assignments` | Create new assignment |
| `GET` | `/api/assignments/:id` | Get assignment details |
| `DELETE` | `/api/assignments/:id` | Delete assignment |
| `POST` | `/api/assignments/:id/start` | Start generation |
| `POST` | `/api/assignments/:id/pause` | Pause generation |
| `POST` | `/api/assignments/:id/resume` | Resume generation |

### Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/export/:id/docx` | Download as DOCX |
| `GET` | `/api/export/:id/pdf` | Download as PDF |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users` | List all users |
| `PUT` | `/api/admin/users/:id` | Update user |
| `POST` | `/api/admin/users/:id/ban` | Ban user |
| `GET` | `/api/admin/stats` | Platform statistics |
| `GET` | `/api/admin/pending-approvals` | Assignments pending approval |

---

## 🤖 Discord Bot

### User Commands

| Command | Description |
|---------|-------------|
| `/link` | Get code to link Discord account |
| `/status` | Check your assignment status |
| `/progress <id>` | Get detailed progress for assignment |
| `/cancel <id>` | Cancel a running generation |
| `/export <id>` | Get download link for completed assignment |
| `/help` | Show all available commands |

### Admin Commands

| Command | Description |
|---------|-------------|
| `/approve list` | List assignments pending approval |
| `/approve assignment <id> <approve/reject>` | Approve or reject assignment |

---

## 🎨 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Tailwind CSS | Styling |
| Radix UI | Accessible Components |
| Vite | Build Tool |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 20 | Runtime |
| Express | Web Framework |
| TypeScript | Type Safety |
| Prisma | ORM |
| PostgreSQL | Database |
| Redis | Caching & Queue |
| BullMQ | Job Queue |
| Socket.IO | WebSockets |

### AI & Processing
| Technology | Purpose |
|------------|---------|
| Claude 3.5 Sonnet | AI Generation |
| docx | Document Generation |
| pdf-parse | PDF Parsing |

---

## 📊 Database Schema

```prisma
model User {
  id              String   @id
  email           String   @unique
  name            String?
  role            UserRole // USER, VIP, ADMIN
  discordUserId   String?  // Discord integration
  totalTokensUsed Int
  assignments     Assignment[]
}

model Assignment {
  id           String   @id
  userId       String
  title        String
  level        Int      // 3, 4, 5, 6
  targetGrade  Grade    // PASS, MERIT, DISTINCTION
  status       Status   // DRAFT, GENERATING, COMPLETED
  briefContent String?
  isApproved   Boolean
  sections     Section[]
  microTasks   MicroTask[]
}

model MicroTask {
  id           String   @id
  assignmentId String
  criterion    String   // P1, M1, D1, etc.
  status       Status
  content      String?
  wordCount    Int
}
```

---

## 🔧 Development

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
npm test
```

### Database Management

```bash
# Open Prisma Studio
npm run db:studio

# Create migration
npm run db:migrate

# Reset database
npx prisma migrate reset

# Seed database
npm run db:seed
```

---

## 🚢 Deployment

### Docker Production

```bash
# Build and deploy
docker-compose -f docker-compose.full.yml up -d

# View logs
docker-compose -f docker-compose.full.yml logs -f

# Stop services
docker-compose -f docker-compose.full.yml down
```

### System Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Storage | 20 GB | 50 GB |

---

## ⚠️ Academic Integrity Notice

> **This platform is designed as an educational tool and learning aid.**

Users must:
- ✅ Review and verify all generated content
- ✅ Add personal insights and original research
- ✅ Properly cite AI assistance if required
- ✅ Comply with institutional academic integrity policies

**Generated content should be used as a starting point, not a final submission.**

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ by Ajax Manson**

*Revolutionizing AI-assisted academic writing, one criterion at a time.*

[⬆ Back to Top](#-btec-generator)

</div>
