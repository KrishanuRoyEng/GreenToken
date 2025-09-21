===== COMPLETE SCRIPTS AND DOCKER SETUP =====

===== /scripts/setup.sh =====
#!/bin/bash

set -e  # Exit on any error

echo "🌊 Setting up Blue Carbon MRV System..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check for Node.js
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    echo "Download from: https://nodejs.org/"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node --version)"
    echo "Please update Node.js from: https://nodejs.org/"
    exit 1
fi
print_success "Node.js $(node --version) detected"

# Check for npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi
print_success "npm $(npm --version) detected"

# Check for Docker
print_status "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "Download from: https://www.docker.com/get-started"
    exit 1
fi
print_success "Docker $(docker --version | cut -d ' ' -f 3 | cut -d ',' -f 1) detected"

# Check for Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    echo "Installation guide: https://docs.docker.com/compose/install/"
    exit 1
fi
print_success "Docker Compose $(docker-compose --version | cut -d ' ' -f 3 | cut -d ',' -f 1) detected"

# Check if Docker is running
print_status "Checking if Docker daemon is running..."
if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running. Please start Docker first."
    exit 1
fi
print_success "Docker daemon is running"

echo ""
echo "🔧 Starting installation process..."
echo "=================================="

# Install root dependencies
print_status "Installing root workspace dependencies..."
npm install
print_success "Root dependencies installed"

# Setup backend
print_status "Setting up backend..."
if [ ! -d "backend" ]; then
    print_error "Backend directory not found!"
    exit 1
fi

cd backend
print_status "Installing backend dependencies..."
npm install
print_success "Backend dependencies installed"

print_status "Generating Prisma client..."
npx prisma generate
print_success "Prisma client generated"

cd ..

# Setup frontend
print_status "Setting up frontend..."
if [ ! -d "frontend" ]; then
    print_error "Frontend directory not found!"
    exit 1
fi

cd frontend
print_status "Installing frontend dependencies..."
npm install
print_success "Frontend dependencies installed"

cd ..

# Create environment files
print_status "Setting up environment files..."

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success "Created root .env file"
    else
        print_warning ".env.example not found, creating basic .env"
        cat > .env << EOF
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password123@localhost:5432/blue_carbon_mrv
EOF
    fi
else
    print_warning "Root .env file already exists"
fi

if [ ! -f backend/.env ]; then
    if [ -f backend/.env.example ]; then
        cp backend/.env.example backend/.env
        print_success "Created backend .env file"
    else
        print_warning "backend/.env.example not found, creating basic backend/.env"
        cat > backend/.env << EOF
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:password123@localhost:5432/blue_carbon_mrv
REDIS_URL=redis://localhost:6379
JWT_SECRET=blue-carbon-jwt-secret-dev-only
FRONTEND_URL=http://localhost:3000
IPFS_HOST=localhost
IPFS_PORT=5001
IPFS_PROTOCOL=http
EOF
    fi
else
    print_warning "Backend .env file already exists"
fi

if [ ! -f frontend/.env ]; then
    if [ -f frontend/.env.example ]; then
        cp frontend/.env.example frontend/.env
        print_success "Created frontend .env file"
    else
        print_warning "frontend/.env.example not found, creating basic frontend/.env"
        cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:5000
REACT_APP_IPFS_GATEWAY=http://localhost:8080/ipfs
EOF
    fi
else
    print_warning "Frontend .env file already exists"
fi

# Create uploads directory
print_status "Creating uploads directory..."
mkdir -p backend/uploads
touch backend/uploads/.gitkeep
print_success "Uploads directory created"

# Create logs directory
print_status "Creating logs directory..."
mkdir -p backend/logs
print_success "Logs directory created"

echo ""
echo "🐳 Starting Docker services..."
echo "=============================="

# Stop any existing containers
print_status "Stopping any existing containers..."
docker-compose down 2>/dev/null || true

# Start Docker services
print_status "Starting PostgreSQL, Redis, and IPFS..."
docker-compose up -d postgres redis ipfs

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 5

# Check if PostgreSQL is ready
print_status "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
        print_success "PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "PostgreSQL failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

# Check if Redis is ready
print_status "Waiting for Redis to be ready..."
for i in {1..30}; do
    if docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
        print_success "Redis is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Redis failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

print_success "All Docker services are running"

echo ""
echo "🗃️ Setting up database..."
echo "========================="

cd backend

# Run database migrations
print_status "Running database migrations..."
npx prisma migrate dev --name init --skip-generate
print_success "Database migrations completed"

# Seed the database
print_status "Seeding database with initial data..."
npx prisma db seed
print_success "Database seeded successfully"

cd ..

echo ""
echo "✅ Setup completed successfully!"
echo "==============================="
echo ""
echo "🚀 To start development:"
echo "   npm run dev"
echo ""
echo "📊 Services are running on:"
echo "   Frontend:    http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   Health Check: http://localhost:5000/health"
echo "   IPFS Gateway: http://localhost:8080"
echo "   IPFS API:    http://localhost:5001"
echo ""
echo "🗄️ Database:"
echo "   PostgreSQL:  localhost:5432"
echo "   Redis:       localhost:6379"
echo ""
echo "👤 Default login credentials:"
echo "   Admin:     admin@nccr.gov.in / admin123"
echo "   NGO:       ngo@example.org / ngo123"
echo "   Panchayat: panchayat@village.gov.in / panchayat123"
echo ""
echo "🛠️ Useful commands:"
echo "   npm run dev              - Start both frontend and backend"
echo "   npm run backend:dev      - Start backend only"
echo "   npm run frontend:dev     - Start frontend only"
echo "   docker-compose logs      - View service logs"
echo "   cd backend && npx prisma studio - Open database GUI"
echo ""
echo "📚 Check the README.md for more information"
echo ""
print_success "Blue Carbon MRV System is ready to use!"

===== /scripts/deploy.sh =====
#!/bin/bash

set -e  # Exit on any error

echo "🚀 Deploying Blue Carbon MRV System..."
echo "======================================"

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
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Set environment to production
export NODE_ENV=production

print_status "Building application for production..."

# Build backend
print_status "Building backend..."
cd backend
if [ ! -d "node_modules" ]; then
    print_status "Installing backend dependencies..."
    npm ci --production
fi
npm run build
print_success "Backend built successfully"
cd ..

# Build frontend
print_status "Building frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm ci
fi
npm run build
print_success "Frontend built successfully"
cd ..

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
echo "   docker-compose down"
echo ""