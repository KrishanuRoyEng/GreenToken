FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl bash

# Copy package files first (for better Docker caching)
COPY package*.json ./

# Install OpenSSL 3 + glibc compatibility
RUN apk add --no-cache openssl libc6-compat

# Use npm install
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma client BEFORE copying source code
RUN npx prisma generate

# Verify Prisma client was generated
RUN ls -la node_modules/.prisma/client/ || echo "Prisma client not found!"

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Verify the build output
RUN ls -la dist/ || echo "Build output not found!"

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs

# Generate Prisma client again to be extra sure
RUN npx prisma generate

# Verify Prisma client exists in final image
RUN ls -la node_modules/.prisma/client/ && echo "✅ Prisma client ready!"

EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start command with better error handling
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/index.js"]
