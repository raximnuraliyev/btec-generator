# =====================================================================
# BTEC Generator - SEMI HOST (Hybrid Mode)
# =====================================================================
# Backend runs locally with Docker, exposed via ngrok
# Frontend uses Vercel for production hosting
#
# =====================================================================
# HOW TO USE:
# =====================================================================
#   1. Make sure Docker Desktop is running
#   2. Make sure ngrok is installed (winget install ngrok.ngrok)
#   3. Open PowerShell in this directory
#   4. Run: .\semi-host.ps1
#   5. Wait for backend to start and ngrok to connect
#   6. Copy the ngrok HTTPS URL displayed
#   7. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
#   8. Update VITE_API_URL with the ngrok URL (e.g., https://xxxx.ngrok.io)
#   9. Redeploy on Vercel or wait for automatic deployment
#
# WHAT IT DOES:
#   - Starts PostgreSQL database (port 5433 - different from local-host)
#   - Starts Backend API (port 3001 - different from local-host)
#   - Starts Adminer database UI (port 8081 - different from local-host)
#   - Starts ngrok tunnel to expose backend to internet
#
# ACCESS URLS:
#   Backend (local):   http://localhost:3001
#   Backend (public):  https://xxxx.ngrok.io (shown after script runs)
#   Adminer:           http://localhost:8081
#   Ngrok Dashboard:   http://localhost:4040
#   Vercel Frontend:   https://your-app.vercel.app
#
# TO STOP:
#   1. Press Ctrl+C to stop the script
#   2. Run: docker-compose -f docker-compose.vercel.yml down
#
# TO VIEW LOGS:
#   docker-compose -f docker-compose.vercel.yml logs -f
#
# NOTE: This uses different ports than local-host so both can 
#       technically run at the same time, but it's recommended
#       to only run one at a time.
# =====================================================================

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  BTEC Generator - SEMI HOST (Hybrid Mode)" -ForegroundColor Cyan
Write-Host "  Backend: Local Docker | Frontend: Vercel" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not running"
    }
} catch {
    Write-Host "ERROR: Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Docker is running" -ForegroundColor Green

# Check ngrok
$ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokPath) {
    Write-Host "ERROR: ngrok is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Install ngrok: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "Or run: winget install ngrok.ngrok" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] ngrok is installed" -ForegroundColor Green

# Kill any existing ngrok processes
Write-Host ""
Write-Host "Stopping any existing ngrok processes..." -ForegroundColor Yellow
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force 2>$null

# Stop existing semi-host containers
Write-Host "Stopping any existing semi-host containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.vercel.yml down 2>$null

Write-Host ""
Write-Host "Starting backend services..." -ForegroundColor Green
docker-compose -f docker-compose.vercel.yml up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start backend!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Waiting for backend to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if backend is responding on port 3001
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "[OK] Backend is ready!" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Backend health check failed, but continuing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting ngrok tunnel on port 3001..." -ForegroundColor Green
Write-Host ""

# Start ngrok with config file if exists
$ngrokConfig = Join-Path $PSScriptRoot "ngrok.yml"
if (Test-Path $ngrokConfig) {
    Write-Host "Using ngrok config: $ngrokConfig" -ForegroundColor Gray
    Start-Process ngrok -ArgumentList "start", "--all", "--config", "`"$ngrokConfig`"" -NoNewWindow
} else {
    Write-Host "No ngrok.yml found, using default config..." -ForegroundColor Gray
    Start-Process ngrok -ArgumentList "http", "3001" -NoNewWindow
}

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "  Semi-Host Mode Active!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend running at: http://localhost:3001" -ForegroundColor White
Write-Host "Adminer running at: http://localhost:8081" -ForegroundColor White
Write-Host ""
Write-Host "To get your ngrok URL:" -ForegroundColor Cyan
Write-Host "  1. Open http://localhost:4040 in your browser" -ForegroundColor Gray
Write-Host "  2. Copy the https://xxxxx.ngrok.io URL" -ForegroundColor Gray
Write-Host "  3. Update VITE_API_URL in Vercel environment variables" -ForegroundColor Gray
Write-Host ""
Write-Host "Vercel Frontend: https://www.btecgenerator.page" -ForegroundColor White
Write-Host ""
Write-Host "Commands:" -ForegroundColor Cyan
Write-Host "  View backend logs: docker-compose -f docker-compose.vercel.yml logs -f" -ForegroundColor Gray
Write-Host "  Stop all:          docker-compose -f docker-compose.vercel.yml down" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop, then run:" -ForegroundColor Yellow
Write-Host "  docker-compose -f docker-compose.vercel.yml down" -ForegroundColor Gray
Write-Host ""

# Keep script running to show ngrok output
Write-Host "Ngrok dashboard: http://localhost:4040" -ForegroundColor Cyan
Write-Host ""

# Try to get and display ngrok URL
Start-Sleep -Seconds 2
try {
    $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction SilentlyContinue
    if ($tunnels.tunnels) {
        Write-Host "=====================================================================" -ForegroundColor Green
        Write-Host "  NGROK URL (use this in Vercel VITE_API_URL):" -ForegroundColor Cyan
        foreach ($tunnel in $tunnels.tunnels) {
            if ($tunnel.proto -eq "https") {
                Write-Host "  $($tunnel.public_url)" -ForegroundColor Yellow
            }
        }
        Write-Host "=====================================================================" -ForegroundColor Green
    }
} catch {
    Write-Host "Could not retrieve ngrok URL automatically." -ForegroundColor Yellow
    Write-Host "Check http://localhost:4040 for the URL." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Service Status:" -ForegroundColor Cyan
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
