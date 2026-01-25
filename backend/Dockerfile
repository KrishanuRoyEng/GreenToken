# Use a Debian-based image for better compatibility with Prisma's binaries
FROM node:22-slim

# Set the working directory
WORKDIR /app

# Install necessary system dependencies, including OpenSSL
RUN apt-get update && apt-get install -y openssl bash curl

# Copy package files for dependency caching
COPY package*.json ./

# Install npm dependencies
RUN npm install --include=dev

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma Client. The build will now fail if this step fails.
RUN npx prisma generate

# Copy the rest of your application code
COPY . .

# Build your TypeScript project
RUN npm run build

EXPOSE 5000

# Run migrations and start the server
CMD npx prisma migrate deploy && npx prisma db seed && node dist/index.js
