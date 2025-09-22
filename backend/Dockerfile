FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache bash curl

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema early
COPY prisma ./prisma/

# Try to generate Prisma client during build (but don't fail)
RUN npx prisma generate || echo "⚠️ Prisma generate failed during build, will retry at runtime"

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Copy startup script and make it executable
COPY startup.sh ./startup.sh
RUN chmod +x ./startup.sh

# Create directories
RUN mkdir -p /app/uploads /app/logs

# Verify build
RUN echo "📋 Build verification:" && \
    ls -la dist/ && \
    ls -la prisma/ && \
    ls -la startup.sh && \
    echo "✅ Build complete"

# Verify Prisma client exists in final image
RUN ls -la node_modules/.prisma/client/ && echo "✅ Prisma client ready!"

EXPOSE 5000

# Use the startup script
CMD ["./startup.sh"]
