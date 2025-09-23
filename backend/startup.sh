#!/bin/bash

# This command ensures that the script will exit immediately if any command fails.
set -e

# 1. Run database migrations
echo "🗃️ Running database migrations..."
npx prisma migrate deploy

# 2. Run the seed script
echo "🌱 Seeding database..."
npx prisma db seed

# 3. Start the application
# We're using `node` instead of `exec node` to ensure error logs are visible
echo "🚀 Starting Node.js server..."
node dist/index.js