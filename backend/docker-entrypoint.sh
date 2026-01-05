#!/bin/sh
# Backend startup script with database migration

echo "🚀 Starting BTEC Generator Backend..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
until npx prisma db push --skip-generate; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

# Run Prisma migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "✅ Migrations complete!"

# Generate Prisma client (in case it's not generated)
echo "🔄 Generating Prisma client..."
npx prisma generate

# Start the server
echo "🎯 Starting server..."
exec node dist/server.js
