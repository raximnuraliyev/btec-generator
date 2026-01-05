# =============================================================================
# CONNECT VERCEL TO LOCALHOST - Step by Step
# =============================================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🌐 VERCEL → LOCALHOST CONNECTION SETUP                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check backend is running
Write-Host "Step 1: Checking backend status..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is NOT running!" -ForegroundColor Red
    Write-Host "   Start it with: docker-compose -f docker-compose.local.yml up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 2: Starting ngrok tunnel..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT: Keep this window open!" -ForegroundColor Red
Write-Host "   Closing this window will disconnect Vercel from your localhost" -ForegroundColor Yellow
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 NEXT STEPS (Do these AFTER ngrok starts):" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Copy the HTTPS Forwarding URL (example: https://abc123.ngrok-free.app)" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Open a NEW PowerShell window and run:" -ForegroundColor White
Write-Host '   $ngrokUrl = "YOUR_NGROK_URL_HERE"' -ForegroundColor Gray
Write-Host '   (Get-Content .env) -replace "CORS_ORIGIN=.*", "CORS_ORIGIN=https://www.btecgenerator.page,https://btec-generator-git-main-raximnuraliyevs-projects.vercel.app,http://localhost:5173,$ngrokUrl" | Set-Content .env' -ForegroundColor Gray
Write-Host '   docker-compose -f docker-compose.local.yml restart backend' -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Go to Vercel Dashboard:" -ForegroundColor White
Write-Host "   → https://vercel.com/raximnuraliyevs-projects/btec-generator/settings/environment-variables" -ForegroundColor Gray
Write-Host ""
Write-Host "4️⃣  Add/Update Environment Variable:" -ForegroundColor White
Write-Host "   Key:   VITE_API_URL" -ForegroundColor Gray
Write-Host "   Value: YOUR_NGROK_URL (the https one)" -ForegroundColor Gray
Write-Host "   Environments: ✅ Production ✅ Preview ✅ Development" -ForegroundColor Gray
Write-Host ""
Write-Host "5️⃣  Redeploy Vercel:" -ForegroundColor White
Write-Host "   → Go to Deployments tab" -ForegroundColor Gray
Write-Host "   → Click ︙ on latest deployment → Redeploy" -ForegroundColor Gray
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Starting ngrok..." -ForegroundColor Green
Write-Host ""

# Start ngrok
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http 3000 --log=stdout"

Write-Host ""
Write-Host "✅ ngrok started in a new window" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Or run manually: ngrok http 3000" -ForegroundColor Gray
Write-Host ""
