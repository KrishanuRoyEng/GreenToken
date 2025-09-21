import React, { useState, useEffect } from 'react';
import { useTokens } from '../../hooks/useTokens';
import { useAuth } from '../../contexts/AuthContext';
import { Coins, TrendingUp, TrendingDown, RefreshCw, ShoppingCart } from 'lucide-react';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const TokenMarketplace: React.FC = () => {
  const { user } = useAuth();
  const { 
    balance,
    marketplaceOrders,
    isLoading,
    loadUserTokens,
    loadMarketplace,
    buyTokens,
    sellTokens,
    purchaseFromMarketplace
  } = useTokens();

  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'marketplace'>('buy');

  useEffect(() => {
    if (user) {
      loadUserTokens();
      loadMarketplace();
    }
  }, [user, loadUserTokens, loadMarketplace]);

  const handleBuyTokens = async () => {
    if (!buyAmount || parseInt(buyAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await buyTokens(parseInt(buyAmount));
      setBuyAmount('');
      toast.success(`Successfully purchased ${buyAmount} tokens!`);
    } catch (error) {
      toast.error('Failed to purchase tokens');
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
    } catch (error) {
      toast.error('Failed to list tokens for sale');
    }
  };

  const handlePurchaseFromMarketplace = async (orderId: string) => {
    try {
      await purchaseFromMarketplace(orderId);
      toast.success('Tokens purchased successfully!');
    } catch (error) {
      toast.error('Failed to purchase tokens');
    }
  };

  const refreshData = () => {
    loadUserTokens();
    loadMarketplace();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Coins className="mr-3 h-8 w-8 text-blue-600" />
            Token Marketplace
          </h2>
          <p className="text-gray-600 mt-1">Buy, sell, and trade verified carbon credits</p>
        </div>
        <Button
          variant="outline"
          onClick={refreshData}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* User Balance */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{balance.total.toLocaleString()}</div>
            <div className="text-blue-100">Total Balance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold">{balance.sold.toLocaleString()}</div>
            <div className="text-blue-100">Tokens Sold</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold">{balance.acquired.toLocaleString()}</div>
            <div className="text-blue-100">Tokens Acquired</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg p-1 shadow-sm">
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => setActiveTab('buy')}
            className={`py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'buy'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp className="inline mr-2 h-4 w-4" />
            Buy Tokens
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'sell'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingDown className="inline mr-2 h-4 w-4" />
            Sell Tokens
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'marketplace'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShoppingCart className="inline mr-2 h-4 w-4" />
            Marketplace
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {/* Buy Tab */}
        {activeTab === 'buy' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Buy Carbon Tokens</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Tokens
                </label>
                <input
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Current Price</div>
                <div className="text-2xl font-bold text-green-600">₹50 per token</div>
                {buyAmount && (
                  <div className="text-sm text-gray-500 mt-2">
                    Total: ₹{(parseInt(buyAmount || '0') * 50).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleBuyTokens}
              disabled={!buyAmount || isLoading}
              loading={isLoading}
              className="w-full md:w-auto"
            >
              Buy Tokens
            </Button>
          </div>
        )}

        {/* Sell Tab */}
        {activeTab === 'sell' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Sell Carbon Tokens</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Tokens
                </label>
                <input
                  type="number"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max={balance.total}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Available: {balance.total} tokens
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per Token (₹)
                </label>
                <input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  placeholder="Set your price"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  step="0.01"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Value</div>
                <div className="text-xl font-bold text-blue-600">
                  ₹{((parseInt(sellAmount || '0') * parseFloat(sellPrice || '0')) || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <Button
              onClick={handleSellTokens}
              disabled={!sellAmount || !sellPrice || isLoading}
              loading={isLoading}
              variant="secondary"
              className="w-full md:w-auto"
            >
              List for Sale
            </Button>
          </div>
        )}

        {/* Marketplace Tab */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Active Marketplace Orders</h3>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="large" />
              </div>
            ) : marketplaceOrders.length > 0 ? (
              <div className="space-y-4">
                {marketplaceOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {order.amount} tokens
                      </div>
                      <div className="text-sm text-gray-500">
                        Seller: {order.seller}
                      </div>
                      <div className="text-xs text-gray-400">
                        Listed: {new Date(order.listedAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="text-right mr-4">
                      <div className="text-lg font-bold text-green-600">
                        ₹{order.pricePerToken}
                      </div>
                      <div className="text-sm text-gray-500">per token</div>
                      <div className="text-xs text-gray-400">
                        Total: ₹{order.totalPrice.toLocaleString()}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handlePurchaseFromMarketplace(order.id)}
                      disabled={isLoading}
                    >
                      <ShoppingCart className="mr-1 h-4 w-4" />
                      Buy
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No active orders
                </h3>
                <p className="text-gray-500">
                  There are currently no tokens available for purchase in the marketplace.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenMarketplace;