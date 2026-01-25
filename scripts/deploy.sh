#!/bin/bash

set -e  # Exit on any error

echo "🚀 Deploying Blue Carbon MRV System..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Copy .env.example to .env and configure it first."
    exit 1
fi

# Set environment to production
export NODE_ENV=production

print_status "Building application for production..."

# Build Docker images
print_status "Building Docker images..."
docker-compose build --no-cache
print_success "Docker images built successfully"

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down

# Start production services
print_status "Starting production services..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 10

# Check service health
print_status "Checking service health..."

# Check backend health
for i in {1..30}; do
    if curl -f http://localhost:5000/health >/dev/null 2>&1; then
        print_success "Backend is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Backend health check failed"
        docker-compose logs backend
        exit 1
    fi
    sleep 2
done

# Check frontend availability
for i in {1..30}; do
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        print_success "Frontend is available"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Frontend availability check failed"
        docker-compose logs frontend
        exit 1
    fi
    sleep 2
done

echo ""
print_success "Deployment completed successfully!"
echo "================================="
echo ""
echo "🌐 Application is running on:"
echo "   Frontend:    http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   Health Check: http://localhost:5000/health"
echo ""
echo "📊 Monitor your deployment:"
echo "   docker-compose ps        - View running containers"
echo "   docker-compose logs      - View all logs"
echo "   docker-compose logs -f   - Follow logs in real-time"
echo ""
echo "🛑 To stop the application:"
echo "   ./scripts/stop.sh"
echo ""