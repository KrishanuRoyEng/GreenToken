import { ethers, Wallet, HDNodeWallet, Mnemonic } from 'ethers';
import crypto from 'crypto';
import { logger } from '../utils/logger';

/**
 * WalletService handles custodian and custom wallet management.
 * Uses ethers.js for real HD wallet derivation and signing.
 */
export class WalletService {
    private masterMnemonic: Mnemonic | null = null;
    private masterWallet: HDNodeWallet | null = null;
    private isInitialized = false;

    constructor() {
        this.initializeMasterWallet();
    }

    /**
     * Initialize the master HD wallet from seed phrase
     */
    private initializeMasterWallet() {
        try {
            const seedPhrase = process.env.CUSTODIAN_WALLET_SEED;

            if (!seedPhrase || seedPhrase === 'greentoken-custodian-default-seed-change-in-production') {
                // Generate deterministic mnemonic from a fallback seed for development
                logger.warn('WalletService: Using default seed. Set CUSTODIAN_WALLET_SEED in production!');
                // Create a deterministic 12-word mnemonic from the default seed
                const entropyHex = crypto.createHash('sha256')
                    .update('greentoken-custodian-default-seed-change-in-production')
                    .digest('hex')
                    .substring(0, 32); // 16 bytes = 128 bits = 12 words
                this.masterMnemonic = Mnemonic.fromEntropy('0x' + entropyHex);
            } else {
                // Check if it's already a valid mnemonic phrase
                if (seedPhrase.split(' ').length >= 12) {
                    this.masterMnemonic = Mnemonic.fromPhrase(seedPhrase);
                } else {
                    // Treat as entropy seed and derive mnemonic
                    const entropyHex = crypto.createHash('sha256')
                        .update(seedPhrase)
                        .digest('hex')
                        .substring(0, 32);
                    this.masterMnemonic = Mnemonic.fromEntropy('0x' + entropyHex);
                }
            }

            // Create master HD wallet from mnemonic
            this.masterWallet = HDNodeWallet.fromMnemonic(this.masterMnemonic);
            this.isInitialized = true;

            logger.info(`WalletService: Initialized. Master address: ${this.masterWallet.address}`);

        } catch (error: any) {
            logger.error('WalletService: Failed to initialize:', error.message);
            this.isInitialized = false;
        }
    }

    /**
     * Generate a custodian wallet address for a user based on their index
     * Uses BIP-44 derivation path: m/44'/60'/0'/0/{index}
     */
    generateCustodianWallet(userIndex: number): { address: string; path: string } {
        if (!this.isInitialized || !this.masterWallet) {
            // Fallback to deterministic hash-based address
            const hash = crypto.createHash('sha256')
                .update(`custodian-wallet-${userIndex}`)
                .digest('hex');
            const address = '0x' + hash.substring(24, 64); // Last 20 bytes
            return { address, path: `m/44'/60'/0'/0/${userIndex}` };
        }

        try {
            const derivationPath = `m/44'/60'/0'/0/${userIndex}`;
            const childWallet = this.masterWallet.derivePath(derivationPath);

            logger.info(`Generated custodian wallet for index ${userIndex}: ${childWallet.address}`);

            return {
                address: childWallet.address,
                path: derivationPath
            };
        } catch (error: any) {
            logger.error(`Failed to derive wallet for index ${userIndex}:`, error.message);
            // Fallback
            const hash = crypto.createHash('sha256')
                .update(`custodian-wallet-${userIndex}`)
                .digest('hex');
            return {
                address: '0x' + hash.substring(24, 64),
                path: `m/44'/60'/0'/0/${userIndex}`
            };
        }
    }

    /**
     * Get a signer wallet for a specific user index (for signing transactions)
     */
    getSignerForUserIndex(userIndex: number): Wallet | null {
        if (!this.isInitialized || !this.masterWallet) {
            return null;
        }

        try {
            const derivationPath = `m/44'/60'/0'/0/${userIndex}`;
            const childWallet = this.masterWallet.derivePath(derivationPath);
            return new Wallet(childWallet.privateKey);
        } catch (error: any) {
            logger.error(`Failed to get signer for index ${userIndex}:`, error.message);
            return null;
        }
    }

    /**
     * Create a wallet from a user-provided private key
     */
    walletFromPrivateKey(privateKey: string): Wallet | null {
        try {
            // Ensure private key has 0x prefix
            const formattedKey = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;
            return new Wallet(formattedKey);
        } catch (error: any) {
            logger.error('Invalid private key:', error.message);
            return null;
        }
    }

    /**
     * Validate an Ethereum wallet address format
     */
    validateWalletAddress(address: string): boolean {
        if (!address) return false;
        return ethers.isAddress(address);
    }

    /**
     * Validate a private key format
     */
    validatePrivateKey(privateKey: string): boolean {
        try {
            const formattedKey = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;
            new Wallet(formattedKey);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get the next available wallet index for new users
     */
    async getNextWalletIndex(prisma: any): Promise<number> {
        const result = await prisma.user.aggregate({
            _max: { custodianWalletIndex: true }
        });

        return (result._max.custodianWalletIndex || 0) + 1;
    }

    /**
     * Sign a message using the custodian wallet for a user
     */
    async signMessage(userIndex: number, message: string): Promise<string | null> {
        const signer = this.getSignerForUserIndex(userIndex);
        if (!signer) {
            // Fallback to HMAC signature
            const signature = crypto
                .createHmac('sha256', `custodian-wallet-${userIndex}`)
                .update(message)
                .digest('hex');
            return '0x' + signature;
        }

        try {
            return await signer.signMessage(message);
        } catch (error: any) {
            logger.error('Failed to sign message:', error.message);
            return null;
        }
    }

    /**
     * Verify a message signature
     */
    verifySignature(message: string, signature: string, expectedAddress: string): boolean {
        try {
            const recoveredAddress = ethers.verifyMessage(message, signature);
            return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
        } catch {
            return false;
        }
    }

    /**
     * Get the master wallet address (custodian treasury)
     */
    getMasterAddress(): string {
        return this.masterWallet?.address || '0x0000000000000000000000000000000000000000';
    }
}

export const walletService = new WalletService();
