#!/bin/bash
# Start BTEC Generator Backend + Database

echo "🚀 Starting BTEC Generator Backend + Database..."
docker-compose -f docker-compose.local.yml up -d --build

echo ""
echo "✅ Services started!"
echo ""
echo "📊 Backend:       http://localhost:3000"
echo "🗄️  Database Admin: http://localhost:8080"
echo ""
echo "📝 View logs:     docker-compose -f docker-compose.local.yml logs -f"
echo "🛑 Stop services: docker-compose -f docker-compose.local.yml down"
