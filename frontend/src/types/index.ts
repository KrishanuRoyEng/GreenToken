export interface User {
  id: string;
  email: string;
  name: string;
  organizationName?: string;
  role: UserRole;
  walletAddress?: string;
  isVerified: boolean;
  createdAt: string;
}

export type UserRole = 'ADMIN' | 'VERIFIER' | 'NGO' | 'PANCHAYAT' | 'COMMUNITY' | 'RESEARCHER';

export interface Project {
  id: string;
  name: string;
  description?: string;
  location: string;
  latitude: number;
  longitude: number;
  areaHectares: number;
  ecosystemType: EcosystemType;
  status: ProjectStatus;
  estimatedCredits?: number;
  issuedCredits: number;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  owner?: {
    id: string;
    name: string;
    organizationName?: string;
  };
}

export type EcosystemType = 'MANGROVE' | 'SEAGRASS' | 'SALT_MARSH' | 'KELP';
export type ProjectStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED';

export interface CreateProjectData {
  name: string;
  description?: string;
  location: string;
  latitude: number;
  longitude: number;
  areaHectares: number;
  ecosystemType: EcosystemType;
}

export interface Transaction {
  id: string;
  type: 'mint' | 'buy' | 'sell' | 'burn';
  amount: number;
  pricePerToken?: number;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  project?: {
    id: string;
    name: string;
  };
}

export interface TokenBalance {
  total: number;
  sold: number;
  acquired: number;
}

export interface MarketplaceOrder {
  id: string;
  seller: string;
  amount: number;
  pricePerToken: number;
  totalPrice: number;
  listedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}
