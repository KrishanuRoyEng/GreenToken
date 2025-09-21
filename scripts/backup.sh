#!/bin/bash

set -e  # Exit on any error

echo "💾 Creating backup of Blue Carbon MRV System..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found. Please run this script from the project root directory."
    exit 1
fi

# Create backup directory with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

print_status "Creating backup in: $BACKUP_DIR"

# Database backup
print_status "Backing up PostgreSQL database..."
if docker-compose ps postgres | grep -q "Up"; then
    docker-compose exec -T postgres pg_dump -U postgres -d blue_carbon_mrv > "$BACKUP_DIR/database.sql"
    print_success "Database backup completed: $(du -h "$BACKUP_DIR/database.sql" | cut -f1)"
else
    print_error "PostgreSQL container is not running. Starting it..."
    docker-compose up -d postgres
    sleep 5
    docker-compose exec -T postgres pg_dump -U postgres -d blue_carbon_mrv > "$BACKUP_DIR/database.sql"
    print_success "Database backup completed: $(du -h "$BACKUP_DIR/database.sql" | cut -f1)"
fi

# IPFS data backup
print_status "Backing up IPFS data..."
if docker-compose ps ipfs | grep -q "Up"; then
    docker-compose exec -T ipfs tar czf - /data/ipfs 2>/dev/null > "$BACKUP_DIR/ipfs_data.tar.gz"
    print_success "IPFS data backup completed: $(du -h "$BACKUP_DIR/ipfs_data.tar.gz" | cut -f1)"
else
    print_error "IPFS container is not running. Skipping IPFS backup."
fi

# Uploaded files backup
print_status "Backing up uploaded files..."
if [ -d "backend/uploads" ]; then
    tar czf "$BACKUP_DIR/uploads.tar.gz" -C backend uploads/
    print_success "Uploads backup completed: $(du -h "$BACKUP_DIR/uploads.tar.gz" | cut -f1)"
else
    print_status "No uploads directory found, skipping..."
fi

# Environment files backup
print_status "Backing up configuration files..."
CONFIG_FILES=()
[ -f .env ] && CONFIG_FILES+=(.env)
[ -f backend/.env ] && CONFIG_FILES+=(backend/.env)
[ -f frontend/.env ] && CONFIG_FILES+=(frontend/.env)

if [ ${#CONFIG_FILES[@]} -gt 0 ]; then
    tar czf "$BACKUP_DIR/config.tar.gz" "${CONFIG_FILES[@]}"
    print_success "Configuration files backed up: $(du -h "$BACKUP_DIR/config.tar.gz" | cut -f1)"
fi

# Application source code backup (excluding node_modules and build files)
print_status "Backing up application source code..."
tar czf "$BACKUP_DIR/source_code.tar.gz" \
    --exclude=node_modules \
    --exclude=backend/node_modules \
    --exclude=frontend/node_modules \
    --exclude=backend/dist \
    --exclude=frontend/dist \
    --exclude=frontend/build \
    --exclude=backend/uploads \
    --exclude=backups \
    --exclude=.git \
    .
print_success "Source code backup completed: $(du -h "$BACKUP_DIR/source_code.tar.gz" | cut -f1)"

# Create backup manifest
print_status "Creating backup manifest..."
cat > "$BACKUP_DIR/backup_info.txt" << EOF
Blue Carbon MRV System Backup
============================
Backup Date: $(date)
Backup Directory: $BACKUP_DIR

Contents:
- database.sql: PostgreSQL database dump
- ipfs_data.tar.gz: IPFS stored data
- uploads.tar.gz: User uploaded files
- config.tar.gz: Environment configuration files
- source_code.tar.gz: Application source code
- backup_info.txt: This manifest file

Restore Instructions:
1. Database: docker-compose exec -T postgres psql -U postgres -d blue_carbon_mrv < database.sql
2. IPFS: docker-compose exec -T ipfs tar xzf - -C / < ipfs_data.tar.gz
3. Uploads: tar xzf uploads.tar.gz -C backend/
4. Config: tar xzf config.tar.gz
5. Source: tar xzf source_code.tar.gz

System Info:
- Node.js: $(node --version 2>/dev/null || echo "Not available")
- Docker: $(docker --version 2>/dev/null | cut -d ' ' -f 3 | cut -d ',' -f 1 || echo "Not available")
- OS: $(uname -a)
EOF
print_success "Backup manifest created"

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

echo ""
print_success "Backup completed successfully!"
echo "============================="
echo ""
echo "📁 Backup location: $BACKUP_DIR"
echo "📦 Total backup size: $TOTAL_SIZE"
echo ""
echo "📋 Backup contents:"
ls -la "$BACKUP_DIR"
echo ""
echo "🔄 To restore from this backup:"
echo "   1. Stop current services: docker-compose down"
echo "   2. Run restore commands from backup_info.txt"
echo "   3. Restart services: docker-compose up -d"
echo ""
echo "🗂️ To clean old backups:"
echo "   find backups/ -name '20*' -mtime +30 -exec rm -rf {} \;"
echo ""