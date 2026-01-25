#!/bin/sh
echo "Running database migrations..."
npx prisma migrate deploy
echo "Seeding database..."
npx prisma db seed
echo "Starting Node.js server..."
node dist/index.js