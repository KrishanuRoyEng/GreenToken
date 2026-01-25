import { useState, useCallback, useEffect } from 'react';

declare global {
    interface Window {
        ethereum?: {
            isMetaMask?: boolean;
            request: (args: { method: string; params?: any[] }) => Promise<any>;
            on: (event: string, callback: (...args: any[]) => void) => void;
            removeListener: (event: string, callback: (...args: any[]) => void) => void;
        };
    }
}

interface Web3State {
    account: string | null;
    chainId: number | null;
    isConnected: boolean;
    isMetaMask: boolean;
    isConnecting: boolean;
    error: string | null;
}

interface UseWeb3Return extends Web3State {
    connectWallet: () => Promise<string | null>;
    disconnectWallet: () => void;
    switchNetwork: (chainId: number) => Promise<boolean>;
    sendTransaction: (to: string, valueInEth: string) => Promise<string | null>;
    signMessage: (message: string) => Promise<string | null>;
}

// Chain configurations
const CHAINS: Record<number, { name: string; rpcUrl: string; symbol: string; explorer: string }> = {
    1: { name: 'Ethereum Mainnet', rpcUrl: 'https://mainnet.infura.io/v3/', symbol: 'ETH', explorer: 'https://etherscan.io' },
    11155111: { name: 'Sepolia Testnet', rpcUrl: 'https://sepolia.infura.io/v3/', symbol: 'ETH', explorer: 'https://sepolia.etherscan.io' },
    137: { name: 'Polygon Mainnet', rpcUrl: 'https://polygon-rpc.com/', symbol: 'MATIC', explorer: 'https://polygonscan.com' },
    80001: { name: 'Mumbai Testnet', rpcUrl: 'https://rpc-mumbai.maticvigil.com/', symbol: 'MATIC', explorer: 'https://mumbai.polygonscan.com' },
};

export function useWeb3(): UseWeb3Return {
    const [state, setState] = useState<Web3State>({
        account: null,
        chainId: null,
        isConnected: false,
        isMetaMask: false,
        isConnecting: false,
        error: null,
    });

    // Check if MetaMask is installed
    const checkMetaMask = useCallback(() => {
        return typeof window !== 'undefined' && window.ethereum?.isMetaMask === true;
    }, []);

    // Handle account changes
    const handleAccountsChanged = useCallback((accounts: string[]) => {
        if (accounts.length === 0) {
            setState(prev => ({
                ...prev,
                account: null,
                isConnected: false,
            }));
        } else {
            setState(prev => ({
                ...prev,
                account: accounts[0],
                isConnected: true,
            }));
        }
    }, []);

    // Handle chain changes
    const handleChainChanged = useCallback((chainIdHex: string) => {
        const chainId = parseInt(chainIdHex, 16);
        setState(prev => ({
            ...prev,
            chainId,
        }));
    }, []);

    // Setup listeners on mount
    useEffect(() => {
        const isMetaMask = checkMetaMask();
        setState(prev => ({ ...prev, isMetaMask }));

        if (isMetaMask && window.ethereum) {
            // Check if already connected
            window.ethereum.request({ method: 'eth_accounts' })
                .then((accounts: string[]) => {
                    if (accounts.length > 0) {
                        handleAccountsChanged(accounts);
                    }
                })
                .catch(console.error);

            // Get current chain
            window.ethereum.request({ method: 'eth_chainId' })
                .then((chainIdHex: string) => {
                    handleChainChanged(chainIdHex);
                })
                .catch(console.error);

            // Setup listeners
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            return () => {
                window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum?.removeListener('chainChanged', handleChainChanged);
            };
        }
    }, [checkMetaMask, handleAccountsChanged, handleChainChanged]);

    // Connect wallet
    const connectWallet = useCallback(async (): Promise<string | null> => {
        if (!window.ethereum) {
            setState(prev => ({ ...prev, error: 'MetaMask is not installed' }));
            return null;
        }

        setState(prev => ({ ...prev, isConnecting: true, error: null }));

        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });

            if (accounts.length > 0) {
                const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
                const chainId = parseInt(chainIdHex, 16);

                setState(prev => ({
                    ...prev,
                    account: accounts[0],
                    chainId,
                    isConnected: true,
                    isConnecting: false,
                }));

                return accounts[0];
            }

            setState(prev => ({ ...prev, isConnecting: false }));
            return null;

        } catch (error: any) {
            setState(prev => ({
                ...prev,
                error: error.message || 'Failed to connect wallet',
                isConnecting: false,
            }));
            return null;
        }
    }, []);

    // Disconnect wallet (clear local state)
    const disconnectWallet = useCallback(() => {
        setState(prev => ({
            ...prev,
            account: null,
            isConnected: false,
        }));
    }, []);

    // Switch network
    const switchNetwork = useCallback(async (targetChainId: number): Promise<boolean> => {
        if (!window.ethereum) {
            setState(prev => ({ ...prev, error: 'MetaMask is not installed' }));
            return false;
        }

        const chainIdHex = '0x' + targetChainId.toString(16);

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainIdHex }],
            });
            return true;
        } catch (error: any) {
            // Chain not added, try to add it
            if (error.code === 4902 && CHAINS[targetChainId]) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: chainIdHex,
                            chainName: CHAINS[targetChainId].name,
                            rpcUrls: [CHAINS[targetChainId].rpcUrl],
                            nativeCurrency: {
                                name: CHAINS[targetChainId].symbol,
                                symbol: CHAINS[targetChainId].symbol,
                                decimals: 18,
                            },
                            blockExplorerUrls: [CHAINS[targetChainId].explorer],
                        }],
                    });
                    return true;
                } catch (addError: any) {
                    setState(prev => ({ ...prev, error: addError.message }));
                    return false;
                }
            }
            setState(prev => ({ ...prev, error: error.message }));
            return false;
        }
    }, []);

    // Send transaction
    const sendTransaction = useCallback(async (to: string, valueInEth: string): Promise<string | null> => {
        if (!window.ethereum || !state.account) {
            setState(prev => ({ ...prev, error: 'Wallet not connected' }));
            return null;
        }

        try {
            // Convert ETH to wei (hex)
            const valueWei = BigInt(Math.floor(parseFloat(valueInEth) * 1e18));
            const valueHex = '0x' + valueWei.toString(16);

            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: state.account,
                    to,
                    value: valueHex,
                }],
            });

            return txHash;

        } catch (error: any) {
            setState(prev => ({ ...prev, error: error.message }));
            return null;
        }
    }, [state.account]);

    // Sign a message
    const signMessage = useCallback(async (message: string): Promise<string | null> => {
        if (!window.ethereum || !state.account) {
            setState(prev => ({ ...prev, error: 'Wallet not connected' }));
            return null;
        }

        try {
            const signature = await window.ethereum.request({
                method: 'personal_sign',
                params: [message, state.account],
            });

            return signature;

        } catch (error: any) {
            setState(prev => ({ ...prev, error: error.message }));
            return null;
        }
    }, [state.account]);

    return {
        ...state,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        sendTransaction,
        signMessage,
    };
}

export { CHAINS };
export default useWeb3;
