# Use a Debian-based image for better compatibility with Prisma's binaries
FROM node:18-slim

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

# Copy and make the startup script executable
COPY startup.sh ./startup.sh
RUN chmod +x ./startup.sh

EXPOSE 5000

# Run the startup script when the container launches
CMD ["./startup.sh"]
