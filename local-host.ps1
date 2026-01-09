# =====================================================================
# BTEC Generator - LOCAL HOST
# =====================================================================
# Full local development environment with Docker
# All services run locally in containers
#
# =====================================================================
# HOW TO USE:
# =====================================================================
#   1. Make sure Docker Desktop is running
#   2. Open PowerShell in this directory
#   3. Run: .\local-host.ps1
#   4. Wait for all containers to start
#   5. Open http://localhost in your browser
#
# WHAT IT DOES:
#   - Starts PostgreSQL database (port 5432)
#   - Starts Backend API (port 3000)
#   - Starts Frontend with Nginx (port 80)
#   - Starts Adminer database UI (port 8080)
#
# ACCESS URLS:
#   Frontend:  http://localhost
#   Backend:   http://localhost:3000
#   Adminer:   http://localhost:8080
#
# TO STOP:
#   docker-compose -f docker-compose.local.yml down
#
# TO VIEW LOGS:
#   docker-compose -f docker-compose.local.yml logs -f
#
# NOTE: This will stop semi-host containers if they are running
#       to avoid port conflicts.
# =====================================================================

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  BTEC Generator - LOCAL HOST" -ForegroundColor Cyan
Write-Host "  Full local Docker environment" -ForegroundColor Cyan
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

# Stop semi-host containers first to avoid port conflicts
Write-Host ""
Write-Host "Stopping any semi-host containers (to avoid port conflicts)..." -ForegroundColor Yellow
docker-compose -f docker-compose.vercel.yml down 2>$null

# Kill any ngrok processes
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force 2>$null

# Stop any existing local containers
Write-Host "Stopping any existing local containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml down 2>$null

Write-Host ""
Write-Host "Building and starting all services..." -ForegroundColor Green
Write-Host "(This may take a few minutes on first run)" -ForegroundColor Gray
Write-Host ""

# Build and start
docker-compose -f docker-compose.local.yml up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=====================================================================" -ForegroundColor Green
    Write-Host "  All Services Started Successfully!" -ForegroundColor Green
    Write-Host "=====================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access your services:" -ForegroundColor Cyan
    Write-Host "  Frontend:  http://localhost" -ForegroundColor White
    Write-Host "  Backend:   http://localhost:3000" -ForegroundColor White
    Write-Host "  Adminer:   http://localhost:8080" -ForegroundColor White
    Write-Host ""
    Write-Host "Database credentials (for Adminer):" -ForegroundColor Cyan
    Write-Host "  System:   PostgreSQL" -ForegroundColor White
    Write-Host "  Server:   postgres" -ForegroundColor White
    Write-Host "  Username: btec" -ForegroundColor White
    Write-Host "  Password: btec_dev_password" -ForegroundColor White
    Write-Host "  Database: btec_generator" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Cyan
    Write-Host "  View logs:  docker-compose -f docker-compose.local.yml logs -f" -ForegroundColor Gray
    Write-Host "  Stop:       docker-compose -f docker-compose.local.yml down" -ForegroundColor Gray
    Write-Host ""
    
    # Wait for services and show status
    Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host ""
    Write-Host "Service Status:" -ForegroundColor Cyan
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to start services!" -ForegroundColor Red
    Write-Host "Check the logs: docker-compose -f docker-compose.local.yml logs" -ForegroundColor Yellow
    exit 1
}
