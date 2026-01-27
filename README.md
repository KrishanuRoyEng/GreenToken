# 🌿 GreenToken: Blue Carbon MRV Platform

**GreenToken** is a decentralized platform dedicated to the **Monitoring, Reporting, and Verification (MRV)** of Blue Carbon projects (mangroves, seagrass, etc.). It leverages AI for automated verification and Blockchain for transparent, tradeable carbon credits.

## 🚀 Key Features

*   **🌍 Project Registration**: Developers can register blue carbon projects with geospatial data.
*   **🤖 AI Verification**: Automated analysis of satellite/drone imagery to verify carbon sequestration claims.
*   **⛓️ Tokenization**: Validated projects receive Carbon Credit Tokens (ERC-20) and Soulbound Tokens for identity.
*   **💼 Dual Wallet System**:
    *   **Custodian Wallet**: For traditional users (managed by platform).
    *   **Custom Wallet**: Metamask integration for web3 natives.
*   **📦 IPFS Storage**: Immutable storage for project reports and raw data.
*   **📊 Marketplace**: Buy and sell carbon credits directly on the platform.

## 🛠️ Tech Stack

### Frontend
*   **Framework**: React (Vite)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Maps**: Leaflet (`react-leaflet`)
*   **State**: Zustand, React Query

### Backend
*   **Runtime**: Node.js
*   **Framework**: Express via TS
*   **Database**: PostgreSQL (Prisma ORM)
*   **Storage**: IPFS (`helia`)
*   **Security**: JWT, Bcrypt

### AI Service
*   **Language**: Python
*   **Framework**: FastAPI
*   **Libraries**: GeoPandas, Shapely, Scikit-Learn

### Blockchain
*   **Network**: Polygon
*   **Framework**: Hardhat
*   **Contracts**: Solidity (ERC-20, Custom Registries)

## 🏃‍♂️ Getting Started

### Prerequisites
*   Docker & Docker Compose
*   Node.js (v18+)
*   Git

### Installation
1.  **Clone the repository**
    ```bash
    git clone https://github.com/KrishanuRoyEng/GreenToken.git
    cd GreenToken
    ```

2.  **Environment Setup**
    *   Copy `.env.example` to `.env` in the root.
    *   Fill in the required variables (DATABASE_URL, JWT_SECRET, etc.).

3.  **Run with Docker (Recommended)**
    This will start Backend, Frontend, Postgres, IPFS, and the AI Service.
    ```bash
    docker-compose up --build
    ```

4.  **Access the App**
    *   Frontend: `http://localhost:3000`
    *   Backend API: `http://localhost:5000`
    *   AI Service: `http://localhost:8000`

## 📂 Project Structure

*   `frontend/`: React application.
*   `backend/`: Node.js Express API.
*   `ai-service/`: Python verification service.
*   `contracts/`: Solidity smart contracts (found in root or separate repo if not present here - *Note: based on inference*).

## 📄 Documentation
For detailed technical documentation, please refer to [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md).
