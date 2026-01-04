# BTEC Generator Backend

Production-grade Node.js + TypeScript backend for BTEC Generator - AI-powered educational assignment guide generator.

## 🎯 System Overview

This is NOT an assignment generator for students. It's a TEACHING GUIDE generator that explains:
- What each criterion means
- How to approach it
- What evidence is expected
- Common mistakes to avoid

**Legal Protection**: Educational guidance only. All content is a learning aid, not final submission material.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: JWT
- **AI**: OpenRouter API
- **Export**: DOCX generation

## Quick Start

### 1. Start Database

```bash
docker compose -f docker-compose.db.yml up -d
```

This starts:
- PostgreSQL on port 5432
- Adminer on port 8080 (http://localhost:8080)

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs on http://localhost:3000

## User Roles & Permissions

| Role        | Generate Assignments | Create Briefs | Manage Users | Token Limit  |
|-------------|----------------------|---------------|--------------|--------------|
| **ADMIN**   | ✅ Yes              | ✅ Yes        | ✅ Yes       | Unlimited    |
| **TEACHER** | ❌ No               | ✅ Yes        | ❌ No        | N/A          |
| **USER**    | ✅ Yes              | ❌ No         | ❌ No        | 5000 trial   |
| **VIP**     | ✅ Yes (unlimited)  | ❌ No         | ❌ No        | Unlimited    |

## Key Features

### Authentication
- User registration and login
- JWT-based authentication

### Student Profile
- Required academic profile before generation
- Includes full name, university, faculty, etc.

### Briefs
- Admin/Teacher can create assignment briefs
- Reusable definitions for assignments

### Assignments
- Generate teaching guides with AI
- Export to DOCX format
- Real-time progress tracking

### Admin Dashboard
- User management
- System statistics
- AI usage analytics

## Business Rules

### 1. Student Profile Required
Users CANNOT generate assignments without completing their academic profile.

### 2. Token System
- New users: 5000 trial tokens
- Each generation consumes tokens
- VIP users: unlimited

### 3. Legal Disclaimer
Generation requires disclaimer acceptance.

### 4. Abuse Detection
System flags suspicious user patterns.

## Development

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production
npm start

# Database management
npm run prisma:studio    # Open Prisma Studio
npm run prisma:migrate   # Run migrations
```

## Environment Variables

Key variables in `.env`:
```env
NODE_ENV
PORT
DATABASE_URL
OPENROUTER_API_KEY
AI_MODEL
AI_MAX_TOKENS
JWT_SECRET
JWT_EXPIRES_IN
CORS_ORIGIN
```

## Security

✅ JWT authentication
✅ Role-based access control
✅ Password hashing (bcrypt)
✅ Input validation (Zod)
✅ SQL injection prevention (Prisma)
✅ CORS protection
✅ Rate limiting ready
✅ Abuse detection

## Legal Compliance (Uzbekistan)

**Educational Disclaimer** displayed before generation:
> "This platform is provided for educational guidance only. The generated materials are learning aids, not final submissions. Responsibility for academic integrity lies solely with the student."

This protects the platform legally and ethically.

## Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Use production database
- [ ] Enable rate limiting
- [ ] Configure proper CORS
- [ ] Set up monitoring
- [ ] Enable HTTPS
- [ ] Backup database regularly
- [ ] Monitor AI costs
- [ ] Review user flags daily

## Support

For issues or questions, contact the development team.
