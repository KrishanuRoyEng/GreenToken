# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code
COPY . .

# Generate Prisma client BEFORE building TypeScript
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
