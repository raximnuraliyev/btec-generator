# =============================================================================
# BTEC Generator - Ngrok Setup Script
# =============================================================================
# This script sets up ngrok to expose your localhost backend to Vercel
# =============================================================================

Write-Host "🚀 BTEC Generator - Ngrok Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is installed
$ngrokInstalled = Get-Command ngrok -ErrorAction SilentlyContinue

if (-not $ngrokInstalled) {
    Write-Host "❌ ngrok is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install ngrok:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "2. Or install via chocolatey: choco install ngrok" -ForegroundColor Yellow
    Write-Host "3. Or install via scoop: scoop install ngrok" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installing, sign up at https://dashboard.ngrok.com/signup" -ForegroundColor Yellow
    Write-Host "Then run: ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ ngrok is installed" -ForegroundColor Green
Write-Host ""

# Check if docker containers are running
Write-Host "📦 Checking Docker containers..." -ForegroundColor Cyan
$backendRunning = docker ps --filter "name=btec-backend" --filter "status=running" -q

if (-not $backendRunning) {
    Write-Host "❌ Backend container is not running!" -ForegroundColor Red
    Write-Host "Start it with: docker-compose -f docker-compose.local.yml up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Backend container is running" -ForegroundColor Green
Write-Host ""

# Start ngrok
Write-Host "🌐 Starting ngrok tunnel on port 3000..." -ForegroundColor Cyan
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  INSTRUCTIONS FOR VERCEL:                                  ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  1. Copy the HTTPS Forwarding URL from ngrok below         ║" -ForegroundColor Green
Write-Host "║  2. Go to your Vercel project settings                     ║" -ForegroundColor Green
Write-Host "║  3. Add environment variable:                              ║" -ForegroundColor Green
Write-Host "║     VITE_API_URL = your_ngrok_url                          ║" -ForegroundColor Green
Write-Host "║  4. Redeploy your Vercel app                               ║" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║  Also update your .env file:                               ║" -ForegroundColor Green
Write-Host "║  - Add ngrok URL to CORS_ORIGIN                            ║" -ForegroundColor Green
Write-Host "║  - Restart backend: docker-compose restart backend         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Start ngrok
ngrok http 3000 --log=stdout
