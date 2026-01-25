import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const BLOCKCHAIN_RPC_URL = process.env.BLOCKCHAIN_RPC_URL || "";
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || "";

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.19",
        settings: {
            viaIR: true,
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        // Local Hardhat network (default)
        hardhat: {
            chainId: 31337,
        },
        // Sepolia Testnet
        sepolia: {
            url: BLOCKCHAIN_RPC_URL,
            accounts: ADMIN_PRIVATE_KEY ? [ADMIN_PRIVATE_KEY] : [],
            chainId: 11155111,
        },
        // Polygon Mumbai Testnet
        mumbai: {
            url: process.env.POLYGON_RPC_URL || "https://rpc-mumbai.maticvigil.com/",
            accounts: ADMIN_PRIVATE_KEY ? [ADMIN_PRIVATE_KEY] : [],
            chainId: 80001,
        },
        // Polygon Mainnet
        polygon: {
            url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com/",
            accounts: ADMIN_PRIVATE_KEY ? [ADMIN_PRIVATE_KEY] : [],
            chainId: 137,
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};

export default config;
