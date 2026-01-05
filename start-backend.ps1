# Start BTEC Generator Backend + Database (Windows)

Write-Host "🚀 Starting BTEC Generator Backend + Database..." -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml up -d --build

Write-Host ""
Write-Host "✅ Services started!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Backend:       http://localhost:3000" -ForegroundColor Yellow
Write-Host "🗄️  Database Admin: http://localhost:8080" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 View logs:     docker-compose -f docker-compose.local.yml logs -f" -ForegroundColor Gray
Write-Host "🛑 Stop services: docker-compose -f docker-compose.local.yml down" -ForegroundColor Gray
