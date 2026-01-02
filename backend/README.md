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

| Role | Generate Assignments | Create Briefs | Manage Users | Token Limit |
|------|---------------------|---------------|--------------|-------------|
| **ADMIN** | ✅ Yes | ✅ Yes | ✅ Yes | Unlimited |
| **TEACHER** | ❌ No | ✅ Yes | ❌ No | N/A |
| **USER** | ✅ Yes | ❌ No | ❌ No | 5000 trial |
| **VIP** | ✅ Yes (unlimited) | ❌ No | ❌ No | Unlimited |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Student Profile (REQUIRED BEFORE GENERATION)
- `POST /api/students/profile` - Create academic profile
- `GET /api/students/profile` - Get profile status

Required fields:
- Full Name
- University Name
- Faculty/Department
- Group/Class
- City
- Academic Year (optional)

### Briefs (ADMIN/TEACHER only)
- `POST /api/briefs` - Create new brief
- `GET /api/briefs?level=3` - Get briefs (optional level filter)
- `GET /api/briefs/:id` - Get brief by ID

### Assignments (USER/VIP/ADMIN only)
- `POST /api/assignments/generate` - Generate new assignment
  - **Requires header**: `X-Disclaimer-Accepted: true`
- `GET /api/assignments` - Get user's assignments
- `GET /api/assignments/:id` - Get assignment by ID
- `GET /api/assignments/:id/download` - Download assignment as DOCX

### Admin (ADMIN only)
- `GET /api/admin/dashboard` - System statistics
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:userId` - User details
- `PUT /api/admin/users/:userId/role` - Change user role
- `PUT /api/admin/users/:userId/tokens` - Reset user tokens
- `GET /api/admin/ai-analytics?days=7` - AI usage analytics
- `GET /api/admin/flags` - View user flags (abuse detection)
- `PUT /api/admin/flags/:flagId/resolve` - Resolve flag
- `GET /api/admin/briefs` - View all briefs
- `GET /api/admin/assignments/:assignmentId/download` - Download any assignment

## Database Schema

### Core Models

**User** - Authentication & usage tracking
- id, email, password, role
- trialTokens, plan
- totalTokensUsedAllTime, totalAssignmentsGenerated
- lastGenerationAt

**StudentProfile** - Academic identity (1:1 with User)
- userId, fullName, universityName
- faculty, groupName, city, academicYear

**Brief** - Reusable assignment definitions
- unitName, unitCode, level (3-6)
- learningAims[], assessmentCriteria (JSON)
- scenario, sources[]

**ResolvedBriefSnapshot** - Immutable brief copy
- Locked at generation time
- Never modified
- Ensures consistency

**Assignment** - Generated teaching guides
- userId, snapshotId, grade
- status, totalTokensUsed, totalAiCalls
- modelsUsed[], generationDurationMs
- content (JSON), docxUrl

**AIUsageLog** - Detailed AI tracking
- assignmentId, userId, userRole
- aiProvider, aiModel
- promptTokens, completionTokens, totalTokens
- purpose (GENERATION/PLANNING/etc)

**UserFlag** - Abuse detection
- userId, reason, severity
- resolved, resolvedAt

## Business Rules

### 1. Student Profile Required
Users CANNOT generate assignments without completing their academic profile.
Returns 403 if profile missing.

### 2. Token System
- New users: 5000 trial tokens
- Each generation consumes tokens
- VIP users: unlimited
- Token usage tracked per assignment

### 3. Grade-Based References
- PASS: 5 references
- MERIT: 7 references
- DISTINCTION: 10 references

### 4. Immutable Snapshots
Briefs are copied to snapshots before generation.
Generation ONLY uses snapshot data.
Ensures consistency even if brief is edited later.

### 5. Legal Disclaimer
Generation requires disclaimer acceptance via header:
```
X-Disclaimer-Accepted: true
```

Returns 428 (Precondition Required) if missing.

### 6. Abuse Detection
System automatically flags users who:
- Generate 5+ assignments in 1 hour
- Hit token limits repeatedly
- Show suspicious patterns

## Admin Features

### Dashboard
- Total users, assignments, tokens used
- Active users (last 7 days)
- Success/failure rates

### User Management
- View all users with pagination
- Change roles (USER ↔ VIP ↔ TEACHER)
- Reset tokens
- View generation history
- Ban/flag users

### AI Analytics
- Token usage by model
- Top token consumers
- Cost tracking (future)
- Usage patterns

### Abuse Monitoring
- Flagged users
- Suspicious patterns
- Resolution workflow

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
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://btec:btec_dev_password@localhost:5432/btec_generator
OPENROUTER_API_KEY=your_key_here
AI_MODEL=mistralai/devstral-2512:free
AI_MAX_TOKENS=4000
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
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
