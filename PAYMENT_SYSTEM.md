# PAYMENT SYSTEM IMPLEMENTATION

## Overview

Complete manual payment system with unique amount matching for BTEC Generator.

## Card for Payments

**Card Number:** `9680 3501 4687 8359` (HUMO/UZCARD)

---

## Payment Plans

| Plan | Price (UZS) | Tokens | Assignments | Grades | Duration |
|------|-------------|--------|-------------|--------|----------|
| P (Pass Only) | 30,000 | 20,000 | 5 | PASS | 30 days |
| PM (Pass + Merit) | 50,000 | 50,000 | 10 | PASS, MERIT | 30 days |
| PMD (Full) | 70,000 | 100,000 | 20 | PASS, MERIT, DISTINCTION | 30 days |
| Custom | Variable | Variable | 1 | User choice | 30 days |

**Custom Plan Rate:** 1 UZS per 10 tokens (minimum 5,000 tokens = 500 UZS)

---

## How It Works

### 1. User Selects Plan
- User clicks "Buy Plan" on dashboard
- Selects P, PM, PMD, or Custom plan
- Chooses payment method (HUMO/UZCARD/Payme)

### 2. Unique Amount Generated
- System generates unique 2-digit suffix (01-99)
- Final amount = base price + suffix/100
- Example: 50,000 + 0.37 = **50,000.37 UZS**
- Suffix is unique among all pending payments

### 3. User Makes Transfer
- User sees card number and exact amount
- Transfers to the card from their bank app
- Amount must be EXACT (including decimals)

### 4. Admin Approves
- Admin opens Payments tab in Admin Panel
- Checks bank app for incoming transfers
- Searches by amount to find matching payment
- Clicks "Approve" to activate plan

---

## API Endpoints

### User Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments/plans` | Get available plans |
| POST | `/api/payments/create` | Create payment request |
| GET | `/api/payments/active` | Get active pending payment |
| GET | `/api/payments/history` | Get payment history |
| POST | `/api/payments/:id/cancel` | Cancel pending payment |
| POST | `/api/payments/calculate-custom` | Calculate custom plan price |

### Admin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments/admin/all` | Get all payments |
| GET | `/api/payments/admin/pending` | Get pending payments |
| GET | `/api/payments/admin/stats` | Get payment statistics |
| GET | `/api/payments/admin/find-by-amount?amount=X` | Find payment by amount |
| GET | `/api/payments/admin/:id` | Get payment details |
| POST | `/api/payments/admin/:id/approve` | Approve payment |
| POST | `/api/payments/admin/:id/reject` | Reject payment |
| POST | `/api/payments/admin/expire-old` | Manually expire old payments |

---

## Database Schema

```prisma
enum PaymentStatus {
  WAITING_PAYMENT
  PAID
  REJECTED
  EXPIRED
}

enum PaymentMethod {
  HUMO
  UZCARD
  PAYME
}

enum PaymentPlanType {
  P        // Pass only
  PM       // Pass + Merit
  PMD      // Full (Pass + Merit + Distinction)
  CUSTOM   // Custom token amount
}

model PaymentTransaction {
  id                String          @id @default(uuid())
  userId            String
  
  planType          PaymentPlanType
  customTokens      Int?
  customGrade       Grade?
  
  baseAmount        Int             // Base price in UZS
  uniqueSuffix      Int             // Unique 2-digit suffix (01-99)
  finalAmount       Float           // baseAmount + suffix/100
  
  paymentMethod     PaymentMethod   @default(HUMO)
  status            PaymentStatus   @default(WAITING_PAYMENT)
  
  createdAt         DateTime        @default(now())
  expiresAt         DateTime        // 24 hours from creation
  approvedAt        DateTime?
  rejectedAt        DateTime?
  
  approvedByAdminId String?
  rejectionReason   String?
  
  assignmentsGranted   Int?
  tokensGranted        Int?
  gradesGranted        String[]     @default([])
  planExpiresAt        DateTime?
  
  user              User            @relation(...)
}
```

---

## Safety Rules Implemented

### 1. Payment Expiration
- Each pending payment expires in 24 hours
- Cron job runs every 5 minutes to expire old payments
- Expired suffixes become reusable

### 2. No Auto-Activation
- Admin must manually click approve
- No automatic matching and activation
- Protects against fraud, duplicates, bank delays

### 3. One Active Payment Per User
- User cannot create new payment while one is pending
- Must wait for approval, rejection, or expiration

### 4. Unique Suffix Guarantee
- Suffix is unique among all pending payments
- No two active payments have same final amount
- Makes manual matching reliable

---

## Frontend Components

### PaymentPage.tsx
- Plan selection cards
- Payment instructions display
- Active payment banner with countdown
- Payment history list
- Custom plan calculator

### AdminPaymentsTab.tsx
- Payment statistics dashboard
- Search by amount (for bank app matching)
- Pending payments table
- Approve/Reject actions
- Filter by status

---

## Files Created/Modified

### Backend
- `prisma/schema.prisma` - Added PaymentTransaction model and enums
- `src/services/payment.service.ts` - Payment business logic
- `src/controllers/payment.controller.ts` - API controllers
- `src/routes/payment.routes.ts` - Route definitions
- `src/app.ts` - Added payment routes
- `src/server.ts` - Added expiration cron job
- `src/scripts/expirePayments.ts` - Manual expiration script

### Frontend
- `src/app/services/api.ts` - Added payment API methods
- `src/app/components/PaymentPage.tsx` - User payment interface
- `src/app/components/admin/AdminPaymentsTab.tsx` - Admin interface
- `src/app/components/admin/index.ts` - Export AdminPaymentsTab
- `src/app/components/AdminPage.tsx` - Added Payments tab
- `src/app/components/DashboardPage.tsx` - Added Buy Plan button
- `src/app/App.tsx` - Added payment route

---

## Warnings Shown to Users

1. Pay the EXACT amount shown (including decimal)
2. No refunds after payment
3. One payment = one plan activation
4. Manual approval may take up to 12 hours
5. This is for educational assistance only

---

## Admin Workflow

1. Open Admin Panel → Payments tab
2. See pending payments with amounts
3. Open bank app (Click/Payme/etc)
4. Look for matching transfer amount
5. In Admin Panel, search by that amount
6. Click "Approve" on the found payment
7. User's plan is activated automatically

---

## Testing

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Login as user, click "Buy Plan"
4. Select a plan and create payment
5. Login as admin, go to Payments tab
6. Approve the payment
7. Verify user's tokens are updated
