#!/bin/bash

echo "🧹 Cleaning Blue Carbon MRV System..."
echo "===================================="

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Ask for confirmation
echo "This will remove:"
echo "  - All node_modules directories"
echo "  - All build/dist directories"
echo "  - Docker containers and volumes"
echo "  - Generated files"
echo ""
read -p "Are you sure? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

# Stop all services first
print_status "Stopping all services..."
./scripts/stop.sh 2>/dev/null || true

# Remove node_modules
print_status "Removing node_modules directories..."
rm -rf node_modules
rm -rf backend/node_modules
rm -rf frontend/node_modules
print_success "node_modules directories removed"

# Remove build directories
print_status "Removing build directories..."
rm -rf backend/dist
rm -rf frontend/dist
rm -rf frontend/build
print_success "Build directories removed"

# Remove generated files
print_status "Removing generated files..."
rm -rf backend/logs
rm -f backend/uploads/*
print_success "Generated files removed"

# Clean Docker
print_status "Cleaning Docker resources..."
docker-compose down --volumes --remove-orphans 2>/dev/null || true
docker system prune -f 2>/dev/null || true
print_success "Docker resources cleaned"

# Remove package-lock files (optional, uncomment if needed)
# print_status "Removing package-lock files..."
# rm -f package-lock.json
# rm -f backend/package-lock.json
# rm -f frontend/package-lock.json
# print_success "Package-lock files removed"

print_success "Cleanup completed!"
echo ""
echo "To reinstall everything:"
echo "  ./scripts/setup.sh" 