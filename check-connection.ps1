# VERCEL CONNECTION DIAGNOSTIC & SETUP
# Run this to check if Vercel can connect to your localhost

Write-Host ""
Write-Host "[VERCEL CONNECTION DIAGNOSTIC]" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check 1: Backend
Write-Host "[1/5] Checking Backend..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "   OK - Backend is running on localhost:3000" -ForegroundColor Green
    $backendOk = $true
} catch {
    Write-Host "   FAIL - Backend is NOT accessible" -ForegroundColor Red
    Write-Host "   Fix: docker-compose -f docker-compose.local.yml up -d" -ForegroundColor Yellow
    $backendOk = $false
}

# Check 2: ngrok Process
Write-Host ""
Write-Host "[2/5] Checking ngrok..." -ForegroundColor Yellow
$ngrokProcess = Get-Process ngrok -ErrorAction SilentlyContinue
if ($ngrokProcess) {
    Write-Host "   OK - ngrok process is running (PID: $($ngrokProcess.Id))" -ForegroundColor Green
    $ngrokRunning = $true
} else {
    Write-Host "   FAIL - ngrok is NOT running" -ForegroundColor Red
    $ngrokRunning = $false
}

# Check 3: ngrok Tunnel
Write-Host ""
Write-Host "[3/5] Checking ngrok tunnel..." -ForegroundColor Yellow
if ($ngrokRunning) {
    try {
        Start-Sleep -Seconds 2
        $tunnels = (Invoke-WebRequest -Uri "http://localhost:4040/api/tunnels" -UseBasicParsing -TimeoutSec 5 | ConvertFrom-Json).tunnels
        $httpsTunnel = $tunnels | Where-Object {$_.proto -eq 'https'}
        
        if ($httpsTunnel) {
            $ngrokUrl = $httpsTunnel.public_url
            Write-Host "   OK - ngrok tunnel active" -ForegroundColor Green
            Write-Host "   URL: $ngrokUrl" -ForegroundColor Cyan
            $tunnelOk = $true
        } else {
            Write-Host "   WARN - ngrok running but no HTTPS tunnel found" -ForegroundColor Yellow
            $tunnelOk = $false
        }
    } catch {
        Write-Host "   WARN - Cannot connect to ngrok API (port 4040)" -ForegroundColor Yellow
        Write-Host "   ngrok might be starting up, wait a moment" -ForegroundColor Gray
        $tunnelOk = $false
    }
} else {
    Write-Host "   SKIP - ngrok not running" -ForegroundColor Gray
    $tunnelOk = $false
}

# Check 4: CORS Configuration
Write-Host ""
Write-Host "[4/5] Checking CORS configuration..." -ForegroundColor Yellow
$corsOrigin = docker exec btec-backend printenv CORS_ORIGIN 2>$null
if ($corsOrigin) {
    Write-Host "   Current CORS_ORIGIN:" -ForegroundColor Gray
    $origins = $corsOrigin -split ','
    foreach ($origin in $origins) {
        if ($origin -match 'ngrok') {
            Write-Host "      NGROK: $origin" -ForegroundColor Cyan
        } else {
            Write-Host "      - $origin" -ForegroundColor Gray
        }
    }
    
    if ($tunnelOk -and $corsOrigin -notmatch [regex]::Escape($ngrokUrl)) {
        Write-Host "   WARN - Current ngrok URL is NOT in CORS!" -ForegroundColor Yellow
        $corsNeedsUpdate = $true
    } else {
        $corsNeedsUpdate = $false
    }
} else {
    Write-Host "   WARN - Could not read CORS configuration" -ForegroundColor Yellow
    $corsNeedsUpdate = $false
}

# Check 5: Test ngrok endpoint
Write-Host ""
Write-Host "[5/5] Testing ngrok endpoint..." -ForegroundColor Yellow
if ($tunnelOk) {
    try {
        $response = Invoke-WebRequest -Uri "$ngrokUrl/health" -UseBasicParsing -TimeoutSec 10
        Write-Host "   OK - ngrok tunnel is working!" -ForegroundColor Green
        Write-Host "   Backend is accessible via: $ngrokUrl" -ForegroundColor Cyan
        $endpointOk = $true
    } catch {
        Write-Host "   FAIL - Cannot reach backend through ngrok" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
        $endpointOk = $false
    }
} else {
    Write-Host "   SKIP - no active tunnel" -ForegroundColor Gray
    $endpointOk = $false
}

# Summary
Write-Host ""
Write-Host "===============================================" -ForegroundColor Gray
Write-Host ""
Write-Host "[SUMMARY]" -ForegroundColor Cyan
Write-Host ""

if ($backendOk -and $ngrokRunning -and $tunnelOk -and $endpointOk) {
    Write-Host "SUCCESS - Everything is working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "[NEXT STEPS FOR VERCEL]" -ForegroundColor Cyan
    Write-Host ""
    
    if ($corsNeedsUpdate) {
        Write-Host "1. Update CORS - Add this ngrok URL to .env:" -ForegroundColor Yellow
        Write-Host "   $ngrokUrl" -ForegroundColor Cyan
        Write-Host "   Then restart: docker-compose -f docker-compose.local.yml restart backend" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "2. Configure Vercel Environment Variable:" -ForegroundColor Yellow
    Write-Host "   Go to: https://vercel.com/raximnuraliyevs-projects/btec-generator/settings/environment-variables" -ForegroundColor Gray
    Write-Host "   Add/Edit: VITE_API_URL = $ngrokUrl" -ForegroundColor Cyan
    Write-Host "   Select all environments (Production, Preview, Development)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Redeploy Vercel:" -ForegroundColor Yellow
    Write-Host "   Go to Deployments tab and click Redeploy" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "ISSUES FOUND - Fix these:" -ForegroundColor Yellow
    Write-Host ""
    
    if (-not $backendOk) {
        Write-Host "X Backend is not running" -ForegroundColor Red
        Write-Host "  Fix: docker-compose -f docker-compose.local.yml up -d" -ForegroundColor Yellow
        Write-Host ""
    }
    
    if (-not $ngrokRunning) {
        Write-Host "X ngrok is not running" -ForegroundColor Red
        Write-Host "  Fix: Run in a separate terminal: ngrok http 3000" -ForegroundColor Yellow
        Write-Host ""
    }
    
    if ($ngrokRunning -and -not $tunnelOk) {
        Write-Host "! ngrok is running but tunnel not detected" -ForegroundColor Yellow
        Write-Host "  Wait a few seconds and run this script again" -ForegroundColor Yellow
        Write-Host ""
    }
    
    if ($tunnelOk -and -not $endpointOk) {
        Write-Host "X ngrok tunnel exists but backend not accessible" -ForegroundColor Red
        Write-Host "  This might be a firewall or ngrok configuration issue" -ForegroundColor Yellow
        Write-Host ""
    }
}

Write-Host "===============================================" -ForegroundColor Gray
Write-Host ""
Write-Host "Tip: Run this script anytime to check connection status" -ForegroundColor Gray
Write-Host ""
