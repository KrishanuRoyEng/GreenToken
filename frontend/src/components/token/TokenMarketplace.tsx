import React, { useState, useEffect } from 'react';
import { useTokens } from '../../hooks/useTokens';
import { useAuth } from '../../contexts/AuthContext';
import { tokenService } from '../../services/api';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const TokenMarketplace: React.FC = () => {
  const { user } = useAuth();
  const {
    balance,
    transactions,
    isLoading,
    loadUserTokens,
    sellTokens,
  } = useTokens();

  const [sellAmount, setSellAmount] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [activeTab, setActiveTab] = useState<'listings' | 'sell' | 'history'>('listings');
  const [userListings, setUserListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserTokens();
      loadUserListings();
    }
  }, [user, loadUserTokens]);

  const loadUserListings = async () => {
    setLoadingListings(true);
    try {
      const data = await tokenService.getUserListings();
      setUserListings(data.listings || []);
    } catch {
      console.error('Failed to load user listings');
    } finally {
      setLoadingListings(false);
    }
  };

  const handleSellTokens = async () => {
    if (!sellAmount || !sellPrice || parseInt(sellAmount) <= 0 || parseFloat(sellPrice) <= 0) {
      toast.error('Please enter valid amount and price');
      return;
    }

    if (parseInt(sellAmount) > balance.total) {
      toast.error('Insufficient token balance');
      return;
    }

    try {
      await sellTokens(parseInt(sellAmount), parseFloat(sellPrice));
      setSellAmount('');
      setSellPrice('');
      toast.success('Tokens listed for sale successfully!');
      loadUserListings();
    } catch {
      toast.error('Failed to list tokens for sale');
    }
  };

  const refreshData = () => {
    loadUserTokens();
    loadUserListings();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
            <svg className="mr-3 h-8 w-8 text-ocean-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Token Management
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your carbon credit tokens</p>
        </div>
        <Button variant="outline" onClick={refreshData} disabled={isLoading}>
          <svg className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* User Balance */}
      <div className="bg-gradient-to-r from-ocean-500 to-kelp-500 text-white p-6 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{balance.total.toLocaleString()}</div>
            <div className="text-ocean-100">Available Balance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold">{userListings.length}</div>
            <div className="text-ocean-100">Active Listings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold">{balance.sold.toLocaleString()}</div>
            <div className="text-ocean-100">Tokens Sold</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-1.5 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-3 gap-1">
          {[
            { key: 'listings', label: 'My Listings', icon: '📋' },
            { key: 'sell', label: 'List New Tokens', icon: '📉' },
            { key: 'history', label: 'Transaction History', icon: '📜' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-3 px-4 rounded-lg font-medium transition-all ${activeTab === tab.key
                ? 'bg-ocean-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6">
        {/* My Listings Tab */}
        {activeTab === 'listings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Your Active Listings</h3>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {userListings.length} listing{userListings.length !== 1 ? 's' : ''}
              </span>
            </div>

            {loadingListings ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="large" />
              </div>
            ) : userListings.length > 0 ? (
              <div className="space-y-4">
                {userListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-semibold text-slate-900 dark:text-white">
                          {listing.amount} tokens
                        </span>
                        {listing.ecosystemType && (
                          <span className="px-2 py-0.5 bg-kelp-100 dark:bg-kelp-900/30 text-kelp-700 dark:text-kelp-400 text-xs rounded-full">
                            {listing.ecosystemType}
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full">
                          Active
                        </span>
                      </div>
                      {listing.projectName && (
                        <p className="text-sm font-medium text-ocean-600 dark:text-ocean-400 mb-1">
                          {listing.projectName}
                        </p>
                      )}
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        Listed: {new Date(listing.listedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <div className="text-2xl font-bold text-kelp-600 dark:text-kelp-400">
                        ₹{listing.pricePerToken}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">per token</div>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Total: ₹{listing.totalPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-ocean-100 dark:bg-ocean-900/30 flex items-center justify-center">
                  <svg className="h-8 w-8 text-ocean-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No active listings
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  You haven't listed any tokens for sale yet.
                </p>
                <Button onClick={() => setActiveTab('sell')}>
                  List Tokens for Sale
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Sell Tab */}
        {activeTab === 'sell' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">List Your Tokens for Sale</h3>
            <p className="text-slate-600 dark:text-slate-400">
              You have <span className="font-bold text-kelp-600 dark:text-kelp-400">{balance.total}</span> tokens available from your approved projects.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Number of Tokens to Sell
                </label>
                <input
                  type="number"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent text-slate-900 dark:text-white"
                  min="1"
                  max={balance.total}
                />
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Available: {balance.total} tokens
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Price per Token (₹)
                </label>
                <input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  placeholder="Set your price"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent text-slate-900 dark:text-white"
                  min="1"
                  step="0.01"
                />
              </div>

              <div className="bg-ocean-50 dark:bg-ocean-900/20 p-4 rounded-lg border border-ocean-200 dark:border-ocean-800">
                <div className="text-sm text-slate-600 dark:text-slate-400">Total Value</div>
                <div className="text-xl font-bold text-ocean-600 dark:text-ocean-400">
                  ₹{((parseInt(sellAmount || '0') * parseFloat(sellPrice || '0')) || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <Button
              onClick={handleSellTokens}
              disabled={!sellAmount || !sellPrice || isLoading}
              loading={isLoading}
              className="w-full md:w-auto"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              List for Sale
            </Button>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Your Transaction History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {transactions && transactions.length > 0 ? (
                    transactions.map((tx: any) => (
                      <tr key={tx.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${tx.type === 'buy' || tx.type === 'mint' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              tx.type === 'sell' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                                'bg-slate-100 text-slate-800'}`}>
                            {tx.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                          {tx.type === 'sell' || tx.type === 'burn' ? '-' : '+'}{tx.amount} Tokens
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {tx.status}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenMarketplace;