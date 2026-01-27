# 🛠️ Technical Documentation: GreenToken

## 🏗️ System Architecture

The GreenToken platform follows a microservices architecture orchestrated via Docker Compose.

```mermaid
graph TD
    User[User (Web/Mobile)] -->|HTTPS| Frontend[Frontend (React/Vite)]
    Frontend -->|REST/Socket.io| Backend[Backend API (Node.js)]
    Frontend -->|Direct| IPFS[IPFS Gateway]
    Frontend -->|RPC| Blockchain[Polygon Network]
    
    Backend -->|SQL| DB[(PostgreSQL)]
    Backend -->|Store Files| IPFS
    Backend -->|Analyze Images| AIService[AI Analysis Service (Python)]
    Backend -->|Sign Tx| Blockchain
    
    AIService -->|Verify| Backend
```

## 🗄️ Database Schema (Prisma)

The application uses **PostgreSQL** with **Prisma ORM**. Key models include:

### 👤 User
*   **Role**: `NGO`, `PANCHAYAT`, `COMMUNITY`, `RESEARCHER`, `ADMIN`, `VERIFIER`, `PRIVATE_ENTITY`, `COMPANY`.
*   **Wallet**: Supports dual wallet system. `walletAddress` stores the address, `usesCustodianWallet` (boolean) indicates if the platform manages the keys.
*   **Payment**: Stores preferences like `PayoutMethod` (CRYPTO, BANK_TRANSFER, UPI).

### 🌳 Project
*   **Core Data**: `location`, `areaHectares`, `ecosystemType` (MANGROVE, SEAGRASS, etc.).
*   **Status Workflow**: `PENDING` -> `APPROVED` / `REJECTED` -> `ACTIVE` -> `COMPLETED`.
*   **Verification**: `ipfsMetadataHash` stores the full project data on IPFS.
*   **Credits**: `estimatedCredits`, `issuedCredits`.

### 📄 Document & MonitoringData
*   Links files (Images, Drone Data, Reports) to Projects.
*   Stores `ipfsHash` for immutable proofs.

## 🤖 AI Analysis Service

*   **Stack**: Python, FastAPI, GeoPandas.
*   **Endpoint**: `/analyze`.
*   **Process**:
    1.  Backend receives project image/data.
    2.  Sends data to AI Service.
    3.  AI Service calculates vegetation index (NDVI) and carbon stock.
    4.  Returns verification result to Backend.

## 🔗 Blockchain & Smart Contracts

*   **Network**: Polygon (PoS).
*   **Contracts**:
    *   `ProjectRegistry`: Stores verified project IDs and data hashes.
    *   `CarbonCreditToken` (ERC-20): Minted upon verification.
    *   `SoulboundToken` (SBT): Non-transferable tokens for identity/certification.

## ⚙️ Environment Configuration

| Variable | Description | Default/Example |
| :--- | :--- | :--- |
| **Database** | | |
| `DATABASE_URL` | Postgres Connection String | `postgresql://user:pass@localhost:5432/db` |
| **Backend** | | |
| `PORT` | API Port | `5000` |
| `JWT_SECRET` | Secret for Auth Tokens | *Secure Random String* |
| `IPFS_HOST` | IPFS Node Host | `ipfs` |
| **Frontend** | | |
| `VITE_API_URL` | Backend URL for Frontend | `http://localhost:5000` |
| `VITE_APP_NAME` | App Display Name | `GreenToken` |
| **Blockchain** | | |
| `BLOCKCHAIN_RPC_URL` | RPC Interface | `https://polygon-rpc.com` |
| `ADMIN_PRIVATE_KEY` | Deployer Wallet Key | *0x...* |
| `PROJECT_REGISTRY_ADDRESS` | Contract Address | *0x...* |
