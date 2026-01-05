#!/bin/bash
# Stop BTEC Generator Backend + Database

echo "🛑 Stopping BTEC Generator Backend + Database..."
docker-compose -f docker-compose.local.yml down

echo ""
echo "✅ Services stopped!"
