// Express Request type augmentation
// Matches the user object created in middleware/auth.ts

declare global {
    namespace Express {
        interface Request {
            user: {
                id: string;
                email: string;
                name: string;
                role: string;
                organizationName: string | null;
                walletAddress: string | null;
                usesCustodianWallet: boolean;
                isVerified: boolean;
            };
        }
    }
}

export { };
