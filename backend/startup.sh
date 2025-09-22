#!/bin/bash

# This command ensures that the script will exit immediately if any command fails.
set -e

# 1. Run database migrations
# This will apply any pending migrations to the database.
# If the database isn't ready or the migration fails, 'set -e' will stop the script,
# preventing the app from starting with an incorrect schema. This is good practice.
echo "🗃️ Running database migrations..."
npx prisma migrate deploy

# 2. Start the application
# 'exec' replaces the shell process with the Node.js process, which is more efficient.
echo "🚀 Starting Node.js server..."
exec node dist/index.js