# Stop BTEC Generator Backend + Database (Windows)

Write-Host "🛑 Stopping BTEC Generator Backend + Database..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml down

Write-Host ""
Write-Host "✅ Services stopped!" -ForegroundColor Green
