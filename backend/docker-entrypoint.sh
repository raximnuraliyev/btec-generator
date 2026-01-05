#!/bin/sh
# Backend startup script with database migration

echo "🚀 Starting BTEC Generator Backend..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
MAX_ATTEMPTS=30
ATTEMPT=0

until npx prisma db push --skip-generate 2>/dev/null; do
  ATTEMPT=$((ATTEMPT + 1))
  if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
    echo "❌ Failed to connect to database after $MAX_ATTEMPTS attempts"
    exit 1
  fi
  echo "Database is unavailable - sleeping (Attempt $ATTEMPT/$MAX_ATTEMPTS)"
  sleep 2
done

echo "✅ Database is ready!"

# Run Prisma migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy || echo "⚠️ Migrations already up to date"

echo "✅ Migrations complete!"

# Start the server
echo "🚀 Starting Node.js server..."
exec node dist/server.js