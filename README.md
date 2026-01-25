# GreenToken
## A Blue Carbon MRV Platform

A full-stack application for managing blue carbon projects, monitoring carbon credits, and enabling a tokenized marketplace for verified environmental projects.

---

## Quick Start

### Prerequisites

- Node.js v18+
- Docker & Docker Compose
- npm or pnpm

### Setup

```bash
# 1. Clone and enter the repository
git clone <repo-url>
cd greentoken

# 2. Run the setup script
./scripts/setup.sh

# 3. Start development
npm run dev
```

The setup script will:
- Install all dependencies
- Create `.env` file from `.env.example`
- Start PostgreSQL, Redis, and IPFS containers
- Run database migrations and seed data

---

## Development

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend |
| `npm run backend:dev` | Start backend only |
| `npm run frontend:dev` | Start frontend only |
| `./scripts/setup.sh` | Full project setup |
| `./scripts/stop.sh` | Stop all services |
| `./scripts/deploy.sh` | Production deployment |
| `./scripts/clean.sh` | Full cleanup |
| `./scripts/backup.sh` | Backup database and files |

### Services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| IPFS Gateway | http://localhost:8080 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nccr.gov.in | admin123 |
| NGO | ngo@example.org | ngo123 |
| Panchayat | panchayat@village.gov.in | panchayat123 |

---

## Project Structure

```
greentoken/
├── .env.example        # All environment variables (copy to .env)
├── docker-compose.yml  # Container orchestration
├── backend/
│   ├── Dockerfile
│   ├── src/            # Express API, controllers, routes
│   └── prisma/         # Database schema and migrations
├── frontend/
│   ├── Dockerfile
│   └── src/            # React + Vite app
└── scripts/
    ├── setup.sh        # Initial setup
    ├── dev.sh          # Start development
    ├── stop.sh         # Stop services
    ├── deploy.sh       # Production deployment
    ├── clean.sh        # Full cleanup
    └── backup.sh       # Backup utility
```

---

## Environment Configuration

All environment variables are consolidated in a single `.env.example` file at the project root.

```bash
# Copy and configure
cp .env.example .env
```

Key variables:
- `POSTGRES_*` - Database configuration
- `JWT_SECRET` - Authentication secret
- `VITE_*` - Frontend configuration
- `BLOCKCHAIN_RPC_URL` - (Optional) For smart contract integration

---

## Docker

### Development (with hot-reload)

```bash
# Start infrastructure only
docker-compose up -d postgres redis ipfs

# Run apps locally
npm run dev
```

### Full Docker Stack

```bash
# Build and run everything
docker-compose up --build

# Or use deploy script
./scripts/deploy.sh
```

---

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide-react  
**Backend:** Node.js, Express, TypeScript, Prisma ORM, Socket.IO  
**Database:** PostgreSQL, Redis  
**Storage:** IPFS

---

## License

MIT License © 2025
