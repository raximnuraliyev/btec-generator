<div align="center">

# 🎓 BTEC Generator

### AI-Powered Educational Assignment Guidance Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Discord](https://img.shields.io/badge/Discord-Bot-5865F2?logo=discord)](https://discord.js.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)

**Generate comprehensive teaching guides for BTEC Level 3-6 assignments (2,000–9,500 words) with intelligent AI guidance**

[Features](#-features) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack)

</div>

---

## ✨ Features

### 🤖 Intelligent Guidance
- **Context-Aware AI** - Uses advanced AI to provide coherent educational guidance
- **Criterion-by-Criterion** - Breaks down each BTEC criterion with detailed explanations
- **Brief Analysis** - Parses assignment briefs to extract key requirements
- **Word Count Control** - Targets specific word counts with smart distribution

### 📊 Real-Time Monitoring
- **Live Progress** - Real-time updates on generation progress
- **Checkpoint System** - Pause and resume functionality
- **Queue Management** - Reliable background processing

### 🔐 Security & Access
- **JWT Authentication** - Secure user authentication
- **Role-Based Access** - Different user roles with appropriate permissions
- **Student Verification** - Academic profile verification

### 🤝 Discord Integration
- **Account Linking** - Connect Discord for notifications
- **Bot Commands** - Manage assignments via Discord
- **Real-Time Alerts** - Get updates on generation status

### 📄 Export Options
- **DOCX Export** - Professional document formatting
- **PDF Export** - Print-ready files

### 🛡️ Admin Dashboard
- **User Management** - Admin controls for users
- **Assignment Overview** - Monitor platform usage
- **Analytics** - Track usage and performance

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** 16+
- **Redis** 7+
- **Docker** (optional)

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
DATABASE_URL
# JWT Secret (generate a secure random string)
JWT_SECRET
# AI Provider
ANTHROPIC_API_KEY
# Discord Bot (optional)
DISCORD_BOT_TOKEN
DISCORD_CLIENT_ID
# Server
PORT
NODE_ENV
```

---

## 🎨 Tech Stack

### Frontend
- React 18, TypeScript, Tailwind CSS, Vite

### Backend
- Node.js 20, Express, TypeScript, Prisma, PostgreSQL, Redis, BullMQ

### AI & Processing
- Claude 3.5 Sonnet, DOCX/PDF generation

---

## ⚠️ Academic Integrity Notice

> **This platform provides educational guidance only.**

Generated content is intended as a learning aid, not final submissions. Users must review, verify, and add personal insights. Comply with institutional policies.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for educational excellence**

[⬆ Back to Top](#-btec-generator)

</div>
