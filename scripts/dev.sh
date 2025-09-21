#!/bin/bash

echo "🚀 Starting Blue Carbon MRV Development Environment..."
echo "===================================================="

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

# Check if setup has been run
if [ ! -f "backend/node_modules/.package-lock.json" ] || [ ! -f "frontend/node_modules/.package-lock.json" ]; then
    print_error "Dependencies not installed. Please run setup first:"
    echo "   ./scripts/setup.sh"
    exit 1
fi

# Check if Docker services are running
print_status "Checking Docker services..."
if ! docker-compose ps postgres | grep -q "Up"; then
    print_status "Starting Docker services..."
    docker-compose up -d postgres redis ipfs
    sleep 5
fi

# Start development servers
print_status "Starting development servers..."
print_status "Backend will be available at: http://localhost:5000"
print_status "Frontend will be available at: http://localhost:3000"
print_status "Press Ctrl+C to stop all servers"

# Use npm run dev which starts both servers concurrently
npm run dev

===== /scripts/stop.sh =====
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
