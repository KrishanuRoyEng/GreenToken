#!/bin/bash

echo "🛑 Stopping Blue Carbon MRV System..."
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Stop Docker containers
print_status "Stopping Docker containers..."
docker-compose down

# Kill any Node.js processes on our ports
print_status "Stopping development servers..."
pkill -f "vite" 2>/dev/null || true
pkill -f "ts-node-dev" 2>/dev/null || true
pkill -f "node.*3000" 2>/dev/null || true
pkill -f "node.*5000" 2>/dev/null || true

print_success "All services stopped"
