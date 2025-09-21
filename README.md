# Blue Carbon MRV Platform

A full-stack application for managing blue carbon projects, monitoring carbon credits, and enabling a tokenized marketplace for verified environmental projects. This platform allows users, NGOs, researchers, and verifiers to collaborate and track environmental impact while facilitating carbon credit issuance and trading.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## Features

### User Roles

- **Admin**: Manage users, approve/reject projects, issue carbon credits.
- **Verifier**: Review pending projects and validate submissions.
- **NGO / Community / Researcher**: Submit projects, view token balances, participate in marketplace.

### Core Functionalities

- Project creation, viewing, and management
- Carbon credit issuance and tracking
- Token marketplace for carbon credits
- Dashboard with system overview and user stats
- Admin panel with project approval workflow and user management
- Real-time notifications via WebSockets

---

## Tech Stack

**Frontend:**

- React + TypeScript
- Vite
- Tailwind CSS
- Lucide-react for icons
- React Hot Toast for notifications

**Backend:**

- Node.js + Express
- TypeScript
- Prisma ORM + PostgreSQL
- JWT-based authentication
- Socket.IO for real-time notifications

**Other:**

- Axios for API requests
- Form validation using custom utilities
- File uploads (project images/documents)

---

## Setup Instructions

### Prerequisites

- Node.js v18+
- PostgreSQL or any relational DB
- pnpm or npm

### Backend Setup

1. Clone the repository:

```bash
git clone <repo-url>
cd blue-carbon-mrv/backend
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure enviroment variables `.env`
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/bluecarbon
JWT_SECRET=your_jwt_secret
PORT=5000
```

4. Run Prisma Migration
```bash
npx prisma migrate dev --name init
```

5. Start the backend
```bash
pnpm run dev
```

### Frontend Setup

1. Go to frontend folder
```bash
cd ../frontend
```

2. Install dependencies
pnpm install

3. Create `.env` in frontend:
```bash
VITE_REACT_APP_API_URL = http://localhost:5000/api
```

4. Start the frontend
```bash
pnpm dev
```

### Project Structure
```bash
backend/
├─ controllers/       # API controllers (AdminController, ProjectController)
├─ middleware/        # Auth, error handling, validation
├─ routes/            # Express routes
├─ prisma/            # Prisma client & schema
├─ utils/             # Logging, validation utilities
frontend/
├─ src/
│  ├─ components/    # React components (common, project, token)
│  ├─ contexts/      # AuthContext
│  ├─ hooks/         # useProjects, useTokens
│  ├─ pages/         # Dashboard, Admin
│  ├─ services/      # api.ts service layer
│  └─ App.tsx
```

### API Endpoints

## Admin

## Projects

## Tokens/Marketplace


###  Future Improvements

-Add full CRUD for projects from admin panel
-Implement advanced marketplace filtering
-Add notifications for token transactions
-Integration with smart contracts(payment gateway) for real carbon token issuance
-Improved analytics dashboard
-Allow custom wallets for seller/buyer


### License
MIT License © 2025