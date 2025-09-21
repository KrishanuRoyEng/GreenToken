import { useState, useCallback } from 'react';
import { tokenService } from '../services/api';
import { TokenBalance, Transaction, MarketplaceOrder } from '../types';

export const useTokens = () => {
  const [balance, setBalance] = useState<TokenBalance>({ total: 0, sold: 0, acquired: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [marketplaceOrders, setMarketplaceOrders] = useState<MarketplaceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserTokens = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await tokenService.getUserTokens();
      setBalance(data.balance);
      setTransactions(data.transactions);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load token data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const buyTokens = useCallback(async (amount: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await tokenService.buyTokens(amount);
      // Refresh balance after purchase
      await loadUserTokens();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to buy tokens');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadUserTokens]);

  const sellTokens = useCallback(async (amount: number, pricePerToken: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await tokenService.sellTokens(amount, pricePerToken);
      // Refresh balance after listing
      await loadUserTokens();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sell tokens');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadUserTokens]);

  const loadMarketplace = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await tokenService.getMarketplace();
      setMarketplaceOrders(data.orders || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load marketplace');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const purchaseFromMarketplace = useCallback(async (orderId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await tokenService.purchaseFromMarketplace(orderId);
      // Refresh marketplace and user tokens
      await Promise.all([loadMarketplace(), loadUserTokens()]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to purchase tokens');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadMarketplace, loadUserTokens]);

  return {
    balance,
    transactions,
    marketplaceOrders,
    isLoading,
    error,
    loadUserTokens,
    buyTokens,
    sellTokens,
    loadMarketplace,
    purchaseFromMarketplace,
  };
};