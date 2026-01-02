# Multi-Stage Generation System - Implementation Progress

## ✅ COMPLETED (Phases 1-3)

### Database Schema (`backend/prisma/schema.prisma`)
**Status:** Complete, migration pending

**New Enums:**
- `TokenPlanType`: FREE, BASIC, PRO, UNLIMITED

**New Models:**
1. **TokenPlan** - User subscription plans
   - `planType`, `tokensPerMonth`, `tokensRemaining`
   - `resetAt`, `activatedAt`, `expiresAt`

2. **TokenTransaction** - Usage tracking
   - `userId`, `assignmentId`, `tokensUsed`, `tokensRemaining`
   - `purpose`, `createdAt`

3. **GenerationPlan** - Stores planner AI output
   - `assignmentId`, `planData` (JSON)
   - `tokensUsed`, `createdAt`

4. **ContentBlock** - Stores writer AI output
   - `assignmentId`, `sectionId`, `criterionCode`
   - `blockOrder`, `content`, `tokensUsed`

**Updated Models:**
- `User`: Added `tokenPlan`, `tokenTransactions` relations
- `Assignment`: Added `generationPlan`, `contentBlocks` relations

---

### Backend Services

#### 1. **PLANNER Service** (`backend/src/services/planner.service.ts`)
**Purpose:** First AI call - generates structured plan from brief

**Key Function:** `generatePlan(briefSnapshot, userId, assignmentId)`
- Input: Brief snapshot (unitName, criteria, scenario, targetGrade, language, options)
- Output: JSON plan with sections, tables, images, order
- Model: `anthropic/claude-3.5-sonnet`
- Temperature: 0.1 (deterministic)
- Validates plan structure
- Saves to `GenerationPlan` table
- Logs AI usage

**PLANNER System Prompt:**
- Strict JSON output only
- No content generation
- Respects grade boundaries (PASS/MERIT/DISTINCTION)
- Ensures criterion coverage
- Deterministic and reproducible

---

#### 2. **WRITER Service** (`backend/src/services/writer.service.ts`)
**Purpose:** Multiple AI calls - generates content blocks

**Key Functions:**
- `generateContentBlock(briefSnapshot, generationPlan, task, userId, assignmentId, blockOrder)`
  - Input: Brief + plan + specific task (section/criterion)
  - Output: Plain text content for ONE block
  - Model: `anthropic/claude-3.5-sonnet`
  - Temperature: 0.7
  - Language-aware (uses language.ts instructions)
  - Maintains continuity with previous blocks

- `generateAllBlocks(briefSnapshot, generationPlan, userId, assignmentId)`
  - Orchestrates all blocks in order
  - Introduction → Sections → Conclusion
  - Passes previous content summary for continuity

**WRITER System Prompt:**
- ONE block at a time
- No headings, no markdown
- Academic tone appropriate to grade (PASS/MERIT/DISTINCTION)
- Checks for invalid criteria
- Checks for duplicate generation

---

#### 3. **Brief Service** (`backend/src/services/brief.service.ts`)
**Purpose:** CRUD operations for briefs

**Functions:**
- `createBrief(userId, data)` - ADMIN/TEACHER only
- `updateBrief(userId, briefId, data)` - Ownership check for TEACHER
- `deleteBrief(userId, briefId)` - Ownership check for TEACHER
- `getBriefs(filters)` - Filter by level, createdById
- `getBrief(briefId)` - Single brief details

**Validation Schema:** `createBriefSchema`
- unitName, unitCode (required)
- level (3-6)
- learningAims array
- assessmentCriteria (pass/merit/distinction arrays)
- scenario (min 50 chars)
- sources array

**Permissions:**
- ADMIN: Can create, edit, delete any brief
- TEACHER: Can create, edit own briefs, delete own briefs
- USER/VIP: Cannot create/edit/delete briefs

---

#### 4. **Token Service** (`backend/src/services/token.service.ts`)
**Purpose:** Token balance and subscription management

**Token Plans:**
```typescript
FREE: { tokensPerMonth: 5000, price: 0 }
BASIC: { tokensPerMonth: 50000, price: 9.99 }
PRO: { tokensPerMonth: 200000, price: 29.99 }
UNLIMITED: { tokensPerMonth: -1, price: 99.99 }
```

**Functions:**
- `initializeTokenPlan(userId)` - Creates FREE plan for new users
- `getTokenBalance(userId)` - Returns current balance + plan info
- `deductTokens(userId, tokensUsed, assignmentId, purpose)` - Deducts and logs
- `upgradePlan(userId, newPlanType)` - Changes subscription
- `resetTokenPlan(userId)` - Monthly reset
- `getTokenHistory(userId, limit)` - Transaction log

**Auto-Reset:** Monthly reset on 1st of each month

---

#### 5. **Generation Orchestrator** (`backend/src/services/generation.service.ts`)
**Purpose:** Coordinates planner + writer + token deduction

**Key Function:** `startGeneration(assignmentId, userId)`

**Flow:**
1. Verify assignment exists and is DRAFT
2. Set status to GENERATING
3. Build brief snapshot from database
4. **Step 1:** Call `generatePlan()` → stores plan
5. **Step 2:** Call `generateAllBlocks()` → stores blocks
6. **Step 3:** Assemble content from blocks
7. Calculate total tokens used
8. **Deduct tokens** from user's balance
9. Set status to COMPLETED
10. Return summary (tokens, duration, blocks)

**Error Handling:**
- On failure: status = FAILED, error message stored
- Tokens NOT deducted on failure

**Other Functions:**
- `getGenerationStatus(assignmentId, userId)` - Progress check
- `getAssignmentContent(assignmentId, userId)` - Full content with blocks

---

### Backend Routes

#### 1. **Token Routes** (`backend/src/routes/token.routes.ts`)
```
GET  /api/tokens/balance   - Get user's token balance
GET  /api/tokens/history   - Get token transaction history
GET  /api/tokens/plans     - List available plans
POST /api/tokens/upgrade   - Upgrade to new plan
```

#### 2. **Generation Routes** (`backend/src/routes/generation.routes.ts`)
```
POST /api/generation/start/:assignmentId    - Start generation
GET  /api/generation/status/:assignmentId   - Check status
GET  /api/generation/content/:assignmentId  - Get full content
```

#### 3. **Brief Routes** (already existed, updated permissions)
```
GET    /api/briefs          - List all briefs (public)
GET    /api/briefs/:id      - Get single brief
POST   /api/briefs          - Create brief (ADMIN/TEACHER)
PUT    /api/briefs/:id      - Update brief (ADMIN/TEACHER)
DELETE /api/briefs/:id      - Delete brief (ADMIN/TEACHER)
```

**Updated `backend/src/app.ts`:**
- Added token routes
- Added generation routes

---

## ⏳ IN PROGRESS

### Update Assignment Controller
**File:** `backend/src/controllers/assignment.controller.ts`

**Changes Needed:**
1. Update `generate()` function:
   - Remove old AI generation logic
   - Call `startGeneration()` from orchestrator
   - Return assignment ID immediately
   - Frontend polls `/api/generation/status/:id` for progress

2. Keep existing functions:
   - `getById()` - fetch assignment
   - `list()` - user's assignments
   - `download()` - export DOCX

---

## ❌ NOT STARTED (Phase 4: Frontend)

### Frontend API Updates (`src/app/services/api.ts`)

**Add Token API:**
```typescript
export const tokenApi = {
  getBalance: () => api.get('/tokens/balance'),
  getHistory: (limit = 50) => api.get(`/tokens/history?limit=${limit}`),
  getPlans: () => api.get('/tokens/plans'),
  upgrade: (planType: string) => api.post('/tokens/upgrade', { planType }),
};
```

**Add Generation API:**
```typescript
export const generationApi = {
  start: (assignmentId: string) => 
    api.post(`/generation/start/${assignmentId}`),
  getStatus: (assignmentId: string) => 
    api.get(`/generation/status/${assignmentId}`),
  getContent: (assignmentId: string) => 
    api.get(`/generation/content/${assignmentId}`),
};
```

**Update Brief API:**
```typescript
export const briefsApi = {
  // ... existing methods
  create: (data: any) => api.post('/briefs', data), // ADMIN/TEACHER
  update: (id: string, data: any) => api.put(`/briefs/${id}`, data),
  delete: (id: string) => api.delete(`/briefs/${id}`),
};
```

---

### Frontend Components to Create

#### 1. **Token Balance Widget** (`src/app/components/TokenBalance.tsx`)
**Location:** Dashboard, top navigation
**Displays:**
- Current plan (FREE/BASIC/PRO/UNLIMITED)
- Tokens remaining
- Tokens per month
- Reset date
- "Upgrade Plan" button

**Features:**
- Real-time balance updates
- Color coding (green > 50%, yellow 20-50%, red < 20%)
- Link to /tokens page for history

---

#### 2. **Token Management Page** (`src/app/components/TokenManagementPage.tsx`)
**Route:** `/tokens`
**Sections:**
- Current Balance (large display)
- Available Plans (cards with pricing)
- Transaction History (table with pagination)
- Upgrade modal

**Plans Display:**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│    FREE     │    BASIC    │     PRO     │  UNLIMITED  │
│  5K tokens  │  50K tokens │ 200K tokens │  Unlimited  │
│    $0/mo    │  $9.99/mo   │  $29.99/mo  │  $99.99/mo  │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

---

#### 3. **Brief Management Page** (`src/app/components/BriefManagementPage.tsx`)
**Route:** `/briefs/manage`
**Access:** ADMIN, TEACHER only

**Features:**
- List briefs (table)
  - Unit name, code, level
  - Created by (email)
  - Usage count (assignments generated)
  - Actions (Edit, Delete)
- "Create New Brief" button
- Filter by level
- Search by unit name/code

**Table:**
```
Unit Name          | Code    | Level | Creator      | Used | Actions
Computing Systems  | UNIT-5  | 3     | teacher@... | 45   | [Edit] [Delete]
```

---

#### 4. **Brief Editor** (`src/app/components/BriefEditor.tsx`)
**Route:** `/briefs/create` or `/briefs/edit/:id`
**Access:** ADMIN, TEACHER only

**Form Sections:**
1. **Basic Info**
   - Unit name (text)
   - Unit code (text)
   - Level (dropdown: 3, 4, 5, 6)

2. **Learning Aims** (dynamic array)
   - Code (e.g., "A")
   - Text (textarea)
   - [Add] [Remove] buttons

3. **Assessment Criteria** (3 sections)
   - **PASS** criteria (array of { code, description })
   - **MERIT** criteria (array of { code, description })
   - **DISTINCTION** criteria (array of { code, description })

4. **Scenario** (rich text editor)
   - Minimum 50 characters
   - Example: "You are working as a junior developer at..."

5. **Sources** (dynamic array)
   - URL or text references
   - [Add] [Remove] buttons

**Validation:**
- All required fields
- Criteria codes must be unique
- Scenario min length
- Learning aims must have at least one

---

#### 5. **Preview Page** (`src/app/components/AssignmentPreviewPage.tsx`)
**Route:** `/assignment/preview/:id`
**Purpose:** Show generated content section-by-section with blur

**Layout:**
```
┌────────────────────────────────────────┐
│ Computing Systems - Level 3            │
│ Grade: DISTINCTION | Language: English │
│ Status: COMPLETED | Tokens: 15,234     │
├────────────────────────────────────────┤
│ [Introduction] ───────────── [Visible] │
│ Lorem ipsum dolor sit amet...          │
│                                        │
│ [Section A1] ────────────── [BLURRED] │
│ ████████████████████████████████████   │
│                                        │
│ [Section A2] ────────────── [BLURRED] │
│ ████████████████████████████████████   │
│                                        │
│ [Unlock Full Content] [Download DOCX] │
└────────────────────────────────────────┘
```

**Features:**
- Introduction visible (first 200 words)
- All other sections blurred
- Click section to expand (if unlocked)
- Download button (triggers payment if not unlocked)
- Progress bar (blocks generated / total blocks)

**Blur Implementation:**
```css
.blurred-content {
  filter: blur(5px);
  user-select: none;
  pointer-events: none;
}
```

---

#### 6. **Teacher Dashboard** (`src/app/components/TeacherDashboard.tsx`)
**Route:** `/teacher`
**Access:** TEACHER role only

**Sections:**
1. **My Briefs**
   - Created briefs count
   - Most used brief
   - Recent briefs

2. **Usage Analytics**
   - Total assignments generated from my briefs
   - Assignments by level (chart)
   - Assignments by language (chart)
   - Most popular brief

3. **Quick Actions**
   - [Create New Brief]
   - [View All Briefs]

**Charts:**
- Bar chart: Assignments per brief
- Pie chart: Distribution by level
- Line chart: Usage over time

---

#### 7. **Generation Progress Modal** (`src/app/components/GenerationProgressModal.tsx`)
**Triggered by:** Generate button in wizard
**Polling:** `/api/generation/status/:id` every 2 seconds

**Progress Display:**
```
┌─────────────────────────────────────┐
│ Generating Your Assignment...      │
├─────────────────────────────────────┤
│ ✓ Creating generation plan         │
│ ⟳ Generating introduction (1/12)   │
│ ○ Generating section A1 (0/12)     │
│ ○ Generating section A2 (0/12)     │
│ ...                                 │
├─────────────────────────────────────┤
│ Progress: █████░░░░░░░░░ 42%       │
│ Tokens used: 5,234 / ~12,000       │
│ Estimated time: 2 minutes           │
└─────────────────────────────────────┘
```

**Status Updates:**
- ✓ Plan created (step 1)
- ⟳ Block X generating (step 2)
- ✓ Block X complete
- ✓ Assembly complete (step 3)
- ✓ Generation successful!

**On Complete:**
- Redirect to `/assignment/preview/:id`

---

## 🔧 Migration Steps

### 1. Run Prisma Migration
```bash
cd backend
npx prisma migrate dev --name add_planner_writer_system
npx prisma generate
```

### 2. Initialize Token Plans for Existing Users
```typescript
// Run this script once
import { prisma } from './lib/prisma';
import { initializeTokenPlan } from './services/token.service';

async function migrateUsers() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    await initializeTokenPlan(user.id);
  }
  console.log(`Initialized token plans for ${users.length} users`);
}

migrateUsers();
```

### 3. Update Environment Variables
Add to `.env`:
```
OPENROUTER_API_KEY=sk-...
AI_MODEL=anthropic/claude-3.5-sonnet
```

---

## 🧪 Testing Checklist

### Backend Tests
- [ ] PLANNER generates valid JSON plan
- [ ] WRITER generates content in correct language
- [ ] Token deduction works correctly
- [ ] UNLIMITED plan doesn't deduct tokens
- [ ] Generation fails gracefully on error
- [ ] Teachers can create/edit own briefs
- [ ] Teachers cannot edit other teachers' briefs
- [ ] Users cannot create briefs
- [ ] Content blocks maintain continuity

### Frontend Tests
- [ ] Token balance displays correctly
- [ ] Upgrade plan flow works
- [ ] Brief creation form validates
- [ ] Brief editing preserves data
- [ ] Preview page blurs content correctly
- [ ] Generation progress updates in real-time
- [ ] Teacher dashboard shows correct analytics
- [ ] Download button works after generation

### Integration Tests
- [ ] End-to-end: Create brief → Generate assignment → Download
- [ ] End-to-end: Upgrade plan → Generate → Check balance
- [ ] Teacher creates brief → User generates from it
- [ ] Generate in all 4 languages
- [ ] Generate at all 3 grade levels
- [ ] Include tables/images options work

---

## 🚀 Deployment Notes

### Database Migration
- **Downtime:** ~2 minutes (schema migration)
- **Backup:** Always backup before migration
- **Run:** `npx prisma migrate deploy` in production

### Environment Setup
- Ensure OPENROUTER_API_KEY is set
- Update CORS_ORIGIN for production domain
- Set up payment provider for plan upgrades (future)

### Monitoring
- Track token usage per plan
- Monitor AI API costs
- Alert on high error rates
- Track generation times

---

## 📊 System Metrics

### Expected Token Usage
- **PLANNER call:** ~1,500 tokens
- **WRITER call (PASS criterion):** ~800 tokens
- **WRITER call (MERIT criterion):** ~1,200 tokens
- **WRITER call (DISTINCTION criterion):** ~1,500 tokens

**Example Assignment (DISTINCTION, 10 criteria):**
- Planner: 1,500
- Introduction: 800
- 10 blocks @ 1,500: 15,000
- Conclusion: 800
- **Total:** ~18,100 tokens

### Plan Capacities
- FREE: 5K → ~0.27 assignments/month
- BASIC: 50K → ~2.7 assignments/month
- PRO: 200K → ~11 assignments/month
- UNLIMITED: ∞

---

## ✅ Summary

**Completed:**
- ✅ Database schema (5 new models)
- ✅ PLANNER service (deterministic plan generation)
- ✅ WRITER service (section-by-section content)
- ✅ Token system (balance, plans, transactions)
- ✅ Brief CRUD (with permissions)
- ✅ Generation orchestrator
- ✅ Backend routes (tokens, generation, briefs)

**Remaining:**
- ⏳ Update assignment controller
- ❌ Frontend token UI
- ❌ Frontend brief management
- ❌ Frontend preview page
- ❌ Frontend teacher dashboard
- ❌ API integration
- ❌ Run migration
- ❌ End-to-end testing

**Next Step:** Run `npx prisma migrate dev` and test planner + writer flow.
