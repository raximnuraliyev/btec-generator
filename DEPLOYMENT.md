# 🚀 BTEC Generator - Deployment Guide

Complete guide to deploy BTEC Generator for **FREE** using cloud services.

---

## 📋 Table of Contents

1. [Free Hosting Stack](#-recommended-free-stack)
2. [Option A: Railway (Easiest)](#-option-a-railway-one-click-deploy)
3. [Option B: Mixed Free Services](#-option-b-mixed-free-services)
4. [Option C: VPS Deployment](#-option-c-vps-deployment)
5. [Domain & SSL Setup](#-domain--ssl-setup)
6. [Environment Variables](#-environment-variables)
7. [Troubleshooting](#-troubleshooting)

---

## 💰 Recommended Free Stack

| Service | Provider | Free Tier |
|---------|----------|-----------|
| **Frontend** | Vercel | Unlimited |
| **Backend** | Railway | $5/month credit |
| **Database** | Supabase | 500MB free |
| **Redis** | Upstash | 10k commands/day |
| **Domain** | Your domain | - |

**Total Cost: $0/month** (within free limits)

---

## 🚂 Option A: Railway (One-Click Deploy)

Railway is the easiest - deploy everything in one place.

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. You get **$5 free credit/month**

### Step 2: Deploy from GitHub
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose `raximnuraliyev/btec-generator`
4. Railway auto-detects the Dockerfile

### Step 3: Add PostgreSQL
1. Click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway creates it automatically
3. Copy the `DATABASE_URL` from the Variables tab

### Step 4: Add Redis
1. Click **"New"** → **"Database"** → **"Redis"**
2. Copy the `REDIS_URL` from Variables

### Step 5: Set Environment Variables
In your backend service, add these variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<from PostgreSQL service>
REDIS_URL=<from Redis service>
JWT_SECRET=<generate: openssl rand -base64 64>
ANTHROPIC_API_KEY=<your Claude API key>
CORS_ORIGINS=https://your-railway-app.up.railway.app
FRONTEND_URL=https://your-railway-app.up.railway.app
```

### Step 6: Deploy Frontend
1. Add another service from the same repo
2. Set root directory to `/` 
3. Set build command: `npm run build`
4. Set start command: `npx serve dist`

### Step 7: Connect Domain
1. Go to Settings → Domains
2. Add your custom domain
3. Add DNS records as shown

**Railway provides free SSL automatically!**

---

## 🔀 Option B: Mixed Free Services

Best free limits by using specialized services.

### Step 1: Database - Supabase (Free PostgreSQL)

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to **Settings** → **Database**
4. Copy the connection string:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
   ```

### Step 2: Redis - Upstash (Free Redis)

1. Go to [upstash.com](https://upstash.com)
2. Create new Redis database
3. Select **Free tier**
4. Copy the Redis URL:
   ```
   redis://default:[PASSWORD]@[HOST].upstash.io:6379
   ```

### Step 3: Backend - Render (Free)

1. Go to [render.com](https://render.com)
2. Click **"New"** → **"Web Service"**
3. Connect GitHub repo
4. Settings:
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`

5. Add Environment Variables:
   ```env
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<Supabase URL>
   REDIS_URL=<Upstash URL>
   JWT_SECRET=<your secret>
   ANTHROPIC_API_KEY=<your key>
   CORS_ORIGINS=https://your-vercel-app.vercel.app
   ```

### Step 4: Frontend - Vercel (Free & Unlimited)

1. Go to [vercel.com](https://vercel.com)
2. Click **"Import Project"**
3. Select GitHub repo
4. Settings:
   - **Framework**: Vite
   - **Root Directory**: `/`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables:
   ```env
   VITE_API_URL=https://your-backend.onrender.com
   ```

### Step 5: Connect Your Domain to Vercel

1. Go to Vercel Dashboard → Domains
2. Add your domain
3. Add DNS records:
   ```
   Type: A     Name: @    Value: 76.76.19.19
   Type: CNAME Name: www  Value: cname.vercel-dns.com
   ```

---

## 🖥️ Option C: VPS Deployment

For a cheap VPS ($4-6/month): DigitalOcean, Vultr, Hetzner, or Oracle Cloud (free tier).

### Step 1: Get a VPS

**Oracle Cloud Free Tier** (completely free forever):
1. Go to [cloud.oracle.com](https://cloud.oracle.com)
2. Create free account
3. Create a VM instance (free tier: 1 CPU, 1GB RAM)
4. Use Ubuntu 22.04

**Or cheap options:**
- DigitalOcean: $4/month (use code for $200 credit)
- Vultr: $5/month
- Hetzner: €4/month

### Step 2: SSH into Server

```bash
ssh root@YOUR_SERVER_IP
```

### Step 3: Install Docker

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Add user to docker group
usermod -aG docker $USER
```

### Step 4: Clone Repository

```bash
# Create app directory
mkdir -p /opt/btec-generator
cd /opt/btec-generator

# Clone repo
git clone https://github.com/raximnuraliyev/btec-generator.git .
```

### Step 5: Configure Environment

```bash
# Copy example env
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

Fill in all required values (see Environment Variables section).

### Step 6: Update Nginx Config

```bash
# Edit nginx config with your domain
nano nginx.prod.conf

# Replace 'yourdomain.com' with your actual domain
```

### Step 7: Get SSL Certificate

```bash
# Create certbot directories
mkdir -p certbot/conf certbot/www

# Get initial certificate (replace with your domain and email)
docker run -it --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly \
  --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --email your@email.com \
  --agree-tos \
  --no-eff-email
```

### Step 8: Deploy

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Run database migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Step 9: Point Domain to Server

In your domain registrar (Namecheap, GoDaddy, etc.):

```
Type: A     Name: @    Value: YOUR_SERVER_IP
Type: A     Name: www  Value: YOUR_SERVER_IP
```

Wait 5-30 minutes for DNS propagation.

---

## 🌐 Domain & SSL Setup

### If Using Vercel (Frontend)

Vercel handles SSL automatically. Just add your domain in the dashboard.

### If Using Railway

Railway provides free SSL. Add domain in Settings → Domains.

### If Using VPS

Use Let's Encrypt (free SSL):

```bash
# Auto-renew is handled by the certbot container
# Manual renewal:
docker compose -f docker-compose.prod.yml run --rm certbot renew
```

---

## 🔐 Environment Variables

### Required Variables

| Variable | Description | How to Get |
|----------|-------------|------------|
| `DATABASE_URL` | PostgreSQL connection | Supabase/Railway |
| `REDIS_URL` | Redis connection | Upstash/Railway |
| `JWT_SECRET` | Auth secret (64+ chars) | `openssl rand -base64 64` |
| `ANTHROPIC_API_KEY` | Claude AI key | [console.anthropic.com](https://console.anthropic.com) |
| `CORS_ORIGINS` | Frontend URL | Your Vercel/domain URL |
| `FRONTEND_URL` | Frontend URL | Your Vercel/domain URL |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Discord bot token |
| `DISCORD_CLIENT_ID` | Discord app ID |

### Generate JWT Secret

```bash
# On Mac/Linux:
openssl rand -base64 64

# On Windows (PowerShell):
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 🔄 Updating Deployment

### Railway/Render
- Push to GitHub → Auto deploys

### VPS
```bash
cd /opt/btec-generator
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

---

## 🐛 Troubleshooting

### Backend not starting
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs backend

# Common fixes:
# 1. Check DATABASE_URL is correct
# 2. Check REDIS_URL is correct
# 3. Run migrations: docker compose exec backend npx prisma migrate deploy
```

### Database connection failed
```bash
# Test connection
docker compose -f docker-compose.prod.yml exec backend npx prisma db pull

# If using Supabase, ensure you're using the correct pooler URL
```

### CORS errors
- Ensure `CORS_ORIGINS` includes your frontend URL (with https://)
- Include both `https://domain.com` and `https://www.domain.com`

### SSL certificate issues
```bash
# Regenerate certificate
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d yourdomain.com -d www.yourdomain.com
```

---

## 📊 Monitoring

### Check service status
```bash
docker compose -f docker-compose.prod.yml ps
```

### View logs
```bash
# All logs
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
```

### Resource usage
```bash
docker stats
```

---

## 🎉 You're Live!

Once deployed, your app will be available at:
- **Frontend**: `https://yourdomain.com`
- **API**: `https://yourdomain.com/api`
- **Health Check**: `https://yourdomain.com/api/health`

---

## 💡 Tips

1. **Start with Railway** - Easiest to get started
2. **Move to mixed services** - For better free limits
3. **Use VPS** - When you need more control/scale

Good luck with your deployment! 🚀
