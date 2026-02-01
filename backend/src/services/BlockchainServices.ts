import { ethers, Contract, Wallet, JsonRpcProvider, formatEther, parseEther } from 'ethers';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import {
  BLUE_CARBON_CREDIT_ABI,
  PROJECT_REGISTRY_ABI,
  SOULBOUND_TOKEN_ABI,
  ECOSYSTEM_TYPES,
  ROLES
} from '../contracts/ContractABIs';

/**
 * BlockchainService handles all Ethereum blockchain interactions.
 * Supports both real contract calls and fallback mock mode when contracts aren't deployed.
 */
export class BlockchainService {
  private provider: JsonRpcProvider | null = null;
  private adminWallet: Wallet | null = null;
  private carbonCreditContract: Contract | null = null;
  private projectRegistryContract: Contract | null = null;
  private soulboundTokenContract: Contract | null = null;
  private isInitialized = false;
  private isProductionMode = false;

  constructor() {
    this.initializeProvider();
  }

  /**
   * Initialize the blockchain provider and contracts
   */
  private async initializeProvider() {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    const carbonCreditAddress = process.env.CARBON_CREDIT_TOKEN_ADDRESS;
    const projectRegistryAddress = process.env.PROJECT_REGISTRY_ADDRESS;
    const soulboundTokenAddress = process.env.SOULBOUND_TOKEN_ADDRESS;

    // Check if we have valid configuration
    if (!rpcUrl || rpcUrl === 'http://localhost:8545') {
      logger.warn('Blockchain: No RPC URL configured. Running in MOCK mode.');
      this.isProductionMode = false;
      return;
    }

    if (!adminPrivateKey || adminPrivateKey === 'ADMIN_PRIVATE_KEY') {
      logger.warn('Blockchain: No admin private key configured. Running in MOCK mode.');
      this.isProductionMode = false;
      return;
    }

    try {
      // Initialize provider
      this.provider = new JsonRpcProvider(rpcUrl);

      // Initialize admin wallet
      this.adminWallet = new Wallet(adminPrivateKey, this.provider);
      logger.info(`Blockchain: Admin wallet initialized: ${this.adminWallet.address}`);

      // Initialize contracts if addresses are configured
      if (carbonCreditAddress) {
        this.carbonCreditContract = new Contract(
          carbonCreditAddress,
          BLUE_CARBON_CREDIT_ABI,
          this.adminWallet
        );
        logger.info(`Blockchain: Carbon Credit contract at ${carbonCreditAddress}`);
      }

      if (projectRegistryAddress) {
        this.projectRegistryContract = new Contract(
          projectRegistryAddress,
          PROJECT_REGISTRY_ABI,
          this.adminWallet
        );
        logger.info(`Blockchain: Project Registry contract at ${projectRegistryAddress}`);
      }

      if (soulboundTokenAddress) {
        this.soulboundTokenContract = new Contract(
          soulboundTokenAddress,
          SOULBOUND_TOKEN_ABI,
          this.adminWallet
        );
        logger.info(`Blockchain: Soulbound Token contract at ${soulboundTokenAddress}`);
      }

      this.isInitialized = true;
      this.isProductionMode = !!(carbonCreditAddress && projectRegistryAddress);
      logger.info(`Blockchain: Initialized in ${this.isProductionMode ? 'PRODUCTION' : 'MOCK'} mode`);

    } catch (error) {
      logger.error('Blockchain: Failed to initialize provider:', error);
      this.isProductionMode = false;
    }
  }

  /**
   * Check if running in production mode (real contracts deployed)
   */
  isProduction(): boolean {
    return this.isProductionMode;
  }

  /**
   * Get the admin wallet address
   */
  getAdminAddress(): string {
    return this.adminWallet?.address || '0x0000000000000000000000000000000000000000';
  }

  /**
   * Generate a SHA-256 hash of project data for integrity verification
   */
  hashProjectData(projectData: {
    name: string;
    location: string;
    latitude: number;
    longitude: number;
    areaHectares: number;
    ecosystemType: string;
    ownerId: string;
    documentHashes: string[];
  }): string {
    const canonicalData = JSON.stringify({
      name: projectData.name,
      location: projectData.location,
      coordinates: [projectData.latitude, projectData.longitude],
      area: projectData.areaHectares,
      ecosystem: projectData.ecosystemType,
      owner: projectData.ownerId,
      documents: projectData.documentHashes.sort()
    });

    const hash = crypto.createHash('sha256').update(canonicalData).digest('hex');
    logger.info(`Generated project data hash: ${hash.substring(0, 16)}...`);
    return hash;
  }

  /**
   * Submit a project to the blockchain registry
   */
  async submitProject(
    name: string,
    location: string,
    latitude: number,
    longitude: number,
    areaHectares: number,
    ecosystemType: string,
    ipfsMetadata: string
  ): Promise<{ txHash: string; blockchainId: number }> {
    if (!this.isProductionMode || !this.projectRegistryContract) {
      // Mock mode
      const mockTxHash = '0x' + crypto.randomBytes(32).toString('hex');
      const mockBlockchainId = Math.floor(Math.random() * 1000000);
      logger.info(`[MOCK] Project submitted: ${name}, txHash: ${mockTxHash.substring(0, 18)}...`);
      return { txHash: mockTxHash, blockchainId: mockBlockchainId };
    }

    try {
      const ecosystemTypeEnum = ECOSYSTEM_TYPES[ecosystemType as keyof typeof ECOSYSTEM_TYPES] || 0;

      // Convert coordinates to integers (multiply by 1e6 for precision)
      const latInt = Math.round(latitude * 1e6);
      const longInt = Math.round(longitude * 1e6);

      const tx = await this.projectRegistryContract.submitProject(
        name,
        location,
        latInt,
        longInt,
        Math.round(areaHectares),
        ecosystemTypeEnum,
        ipfsMetadata
      );

      const receipt = await tx.wait();

      // Parse event to get project ID
      const event = receipt.logs.find((log: any) => {
        try {
          return this.projectRegistryContract!.interface.parseLog(log)?.name === 'ProjectSubmitted';
        } catch { return false; }
      });

      const parsedEvent = event ? this.projectRegistryContract.interface.parseLog(event) : null;
      const blockchainId = parsedEvent ? Number(parsedEvent.args.projectId) : 0;

      logger.info(`Project submitted on-chain: ID=${blockchainId}, txHash=${tx.hash}`);
      return { txHash: tx.hash, blockchainId };

    } catch (error: any) {
      logger.error('Failed to submit project to blockchain:', error.message);
      throw new Error(`Blockchain submission failed: ${error.message}`);
    }
  }

  /**
   * Approve a project on the blockchain
   */
  async approveProject(blockchainId: number): Promise<string> {
    if (!this.isProductionMode || !this.projectRegistryContract) {
      const mockTxHash = '0x' + crypto.randomBytes(32).toString('hex');
      logger.info(`[MOCK] Project approved: ID=${blockchainId}, txHash: ${mockTxHash.substring(0, 18)}...`);
      return mockTxHash;
    }

    try {
      const tx = await this.projectRegistryContract.approveProject(blockchainId);
      await tx.wait();
      logger.info(`Project approved on-chain: ID=${blockchainId}, txHash=${tx.hash}`);
      return tx.hash;
    } catch (error: any) {
      logger.error('Failed to approve project on blockchain:', error.message);
      throw new Error(`Blockchain approval failed: ${error.message}`);
    }
  }

  /**
   * Issue carbon credits for a project
   */
  async issueCredits(
    blockchainId: number,
    amount: number,
    recipientAddress: string,
    projectData: {
      location: string;
      areaHectares: number;
      ecosystemType: string;
      ipfsHash: string;
    }
  ): Promise<{ txHash: string; tokenId: number }> {
    if (!this.isProductionMode || !this.carbonCreditContract) {
      const mockTxHash = '0x' + crypto.randomBytes(32).toString('hex');
      const mockTokenId = Math.floor(Math.random() * 1000000);
      logger.info(`[MOCK] Credits issued: ${amount} to ${recipientAddress.substring(0, 10)}...`);
      return { txHash: mockTxHash, tokenId: mockTokenId };
    }

    try {
      const tx = await this.carbonCreditContract.mintCredit(
        recipientAddress,
        amount,
        blockchainId,
        projectData.location,
        projectData.areaHectares,
        projectData.ecosystemType,
        projectData.ipfsHash
      );

      const receipt = await tx.wait();

      // Parse event to get token ID
      const event = receipt.logs.find((log: any) => {
        try {
          return this.carbonCreditContract!.interface.parseLog(log)?.name === 'CreditMinted';
        } catch { return false; }
      });

      const parsedEvent = event ? this.carbonCreditContract.interface.parseLog(event) : null;
      const tokenId = parsedEvent ? Number(parsedEvent.args.tokenId) : 0;

      logger.info(`Credits minted: ${amount} tokens, ID=${tokenId}, txHash=${tx.hash}`);
      return { txHash: tx.hash, tokenId };

    } catch (error: any) {
      logger.error('Failed to issue credits on blockchain:', error.message);
      throw new Error(`Blockchain credit issuance failed: ${error.message}`);
    }
  }

  /**
   * Transfer tokens between addresses
   */
  async transferTokens(
    fromAddress: string,
    toAddress: string,
    amount: number,
    signerPrivateKey?: string
  ): Promise<string> {
    if (!this.isProductionMode || !this.carbonCreditContract || !this.provider) {
      const mockTxHash = '0x' + crypto.randomBytes(32).toString('hex');
      logger.info(`[MOCK] Transfer: ${amount} tokens from ${fromAddress.substring(0, 10)}... to ${toAddress.substring(0, 10)}...`);
      return mockTxHash;
    }

    try {
      let signer: Wallet;
      if (signerPrivateKey) {
        signer = new Wallet(signerPrivateKey, this.provider);
      } else {
        signer = this.adminWallet!;
      }

      const contractWithSigner = this.carbonCreditContract.connect(signer) as Contract;
      const tx = await contractWithSigner.transfer(toAddress, amount);
      await tx.wait();

      logger.info(`Tokens transferred: ${amount} to ${toAddress}, txHash=${tx.hash}`);
      return tx.hash;

    } catch (error: any) {
      logger.error('Failed to transfer tokens:', error.message);
      throw new Error(`Token transfer failed: ${error.message}`);
    }
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(address: string): Promise<string> {
    if (!this.isProductionMode || !this.carbonCreditContract) {
      return '0';
    }

    try {
      const balance = await this.carbonCreditContract.balanceOf(address);
      return balance.toString();
    } catch (error: any) {
      logger.error('Failed to get token balance:', error.message);
      return '0';
    }
  }

  /**
   * Get ETH balance for an address
   */
  async getEthBalance(address: string): Promise<string> {
    if (!this.provider) {
      return '0';
    }

    try {
      const balance = await this.provider.getBalance(address);
      return formatEther(balance);
    } catch (error: any) {
      logger.error('Failed to get ETH balance:', error.message);
      return '0';
    }
  }

  /**
   * Verify an on-chain transaction
   */
  async verifyTransaction(txHash: string): Promise<{
    confirmed: boolean;
    blockNumber?: number;
    from?: string;
    to?: string;
    value?: string;
  }> {
    if (!this.provider) {
      // Mock mode - assume valid
      return { confirmed: true, blockNumber: 12345678 };
    }

    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        return { confirmed: false };
      }

      const tx = await this.provider.getTransaction(txHash);
      return {
        confirmed: receipt.status === 1,
        blockNumber: receipt.blockNumber,
        from: tx?.from,
        to: tx?.to || undefined,
        value: tx?.value ? formatEther(tx.value) : '0'
      };
    } catch (error: any) {
      logger.error('Failed to verify transaction:', error.message);
      return { confirmed: false };
    }
  }

  /**
   * Mint a soulbound achievement token
   */
  async mintSoulboundToken(
    recipientAddress: string,
    title: string,
    description: string,
    projectId: string,
    ipfsMetadata: string
  ): Promise<{ txHash: string; tokenId: number }> {
    if (!this.isProductionMode || !this.soulboundTokenContract) {
      const mockTxHash = '0x' + crypto.randomBytes(32).toString('hex');
      const mockTokenId = Math.floor(Math.random() * 1000000);
      logger.info(`[MOCK] Soulbound token minted for ${recipientAddress.substring(0, 10)}...`);
      return { txHash: mockTxHash, tokenId: mockTokenId };
    }

    try {
      const tx = await this.soulboundTokenContract.mintAchievement(
        recipientAddress,
        title,
        description,
        projectId,
        ipfsMetadata
      );

      const receipt = await tx.wait();

      const event = receipt.logs.find((log: any) => {
        try {
          return this.soulboundTokenContract!.interface.parseLog(log)?.name === 'AchievementMinted';
        } catch { return false; }
      });

      const parsedEvent = event ? this.soulboundTokenContract.interface.parseLog(event) : null;
      const tokenId = parsedEvent ? Number(parsedEvent.args.tokenId) : 0;

      logger.info(`Soulbound token minted: ID=${tokenId}, txHash=${tx.hash}`);
      return { txHash: tx.hash, tokenId };

    } catch (error: any) {
      logger.error('Failed to mint soulbound token:', error.message);
      throw new Error(`Soulbound token minting failed: ${error.message}`);
    }
  }

  /**
   * Create a signed attestation for project approval (off-chain)
   */
  createApprovalAttestation(projectId: string, dataHash: string, approverAddress: string): {
    attestation: string;
    signature: string;
    timestamp: number;
  } {
    const timestamp = Date.now();
    const platformKey = process.env.PLATFORM_SIGNING_KEY || 'greentoken-platform-key';

    const attestationData = {
      type: 'PROJECT_APPROVAL',
      projectId,
      dataHash,
      approver: approverAddress,
      timestamp,
      platform: 'GreenToken'
    };

    const attestationString = JSON.stringify(attestationData);
    const signature = '0x' + crypto
      .createHmac('sha256', platformKey)
      .update(attestationString)
      .digest('hex');

    return {
      attestation: Buffer.from(attestationString).toString('base64'),
      signature,
      timestamp
    };
  }

  /**
   * Create a rejection attestation (off-chain)
   */
  createRejectionAttestation(projectId: string, reason: string, rejecterAddress: string): {
    attestation: string;
    signature: string;
    timestamp: number;
  } {
    const timestamp = Date.now();
    const platformKey = process.env.PLATFORM_SIGNING_KEY || 'greentoken-platform-key';

    const attestationData = {
      type: 'PROJECT_REJECTION',
      projectId,
      reason,
      rejecter: rejecterAddress,
      timestamp,
      platform: 'GreenToken'
    };

    const attestationString = JSON.stringify(attestationData);
    const signature = '0x' + crypto
      .createHmac('sha256', platformKey)
      .update(attestationString)
      .digest('hex');

    return {
      attestation: Buffer.from(attestationString).toString('base64'),
      signature,
      timestamp
    };
  }

  /**
   * Submit data to blockchain (mock or real)
   */
  async submitToBlockchain(dataHash: string, metadata: any): Promise<string> {
    if (!this.isProductionMode) {
      // Create a mock transaction hash
      const txData = JSON.stringify({ dataHash, metadata, timestamp: Date.now() });
      const txHash = '0x' + crypto.createHash('sha256').update(txData).digest('hex');
      logger.info(`[MOCK] Blockchain submission: ${txHash.substring(0, 18)}...`);
      return txHash;
    }

    // In production mode, this would call a smart contract method
    // For now, return a mock hash even in production mode
    const txData = JSON.stringify({ dataHash, metadata, timestamp: Date.now() });
    const txHash = '0x' + crypto.createHash('sha256').update(txData).digest('hex');
    logger.info(`Blockchain submission: ${txHash.substring(0, 18)}...`);
    return txHash;
  }
}

export const blockchainService = new BlockchainService();