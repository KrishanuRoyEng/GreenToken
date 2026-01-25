import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import { authService } from '../services/api';

const Profile: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    organizationName: user?.organizationName || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Wallet state
  const [walletInfo, setWalletInfo] = useState<{
    walletAddress: string | null;
    usesCustodianWallet: boolean;
    walletType: string;
  } | null>(null);
  const [customWalletAddress, setCustomWalletAddress] = useState('');
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [showCustomWalletInput, setShowCustomWalletInput] = useState(false);
  const [copied, setCopied] = useState(false);

  // Payout preferences state
  const [payoutPrefs, setPayoutPrefs] = useState({
    payoutMethod: 'CRYPTO' as 'CRYPTO' | 'BANK_TRANSFER' | 'UPI',
    bankAccountName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    upiId: '',
  });
  const [isPayoutEditing, setIsPayoutEditing] = useState(false);
  const [isPayoutLoading, setIsPayoutLoading] = useState(false);

  // Fetch wallet info on mount
  useEffect(() => {
    const fetchWalletInfo = async () => {
      try {
        const info = await authService.getWalletInfo();
        setWalletInfo(info);
      } catch (error) {
        console.error('Failed to fetch wallet info:', error);
      }
    };
    if (user) {
      fetchWalletInfo();
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePayoutChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPayoutPrefs(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }

    setIsLoading(true);
    try {
      await authService.updateProfile(formData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      if (refreshUser) refreshUser();
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      organizationName: user?.organizationName || '',
    });
    setIsEditing(false);
  };

  const handleSavePayoutPrefs = async () => {
    setIsPayoutLoading(true);
    try {
      // API call to save payout preferences
      const response = await fetch('/api/auth/payout-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payoutPrefs),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success('Payout preferences saved!');
      setIsPayoutEditing(false);
    } catch {
      toast.error('Failed to save payout preferences');
    } finally {
      setIsPayoutLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (walletInfo?.walletAddress) {
      navigator.clipboard.writeText(walletInfo.walletAddress);
      setCopied(true);
      toast.success('Wallet address copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSetCustomWallet = async () => {
    if (!customWalletAddress || !customWalletAddress.startsWith('0x') || customWalletAddress.length !== 42) {
      toast.error('Please enter a valid Ethereum wallet address (0x...)');
      return;
    }

    setIsWalletLoading(true);
    try {
      const result = await authService.setCustomWallet(customWalletAddress);
      setWalletInfo({
        walletAddress: result.user.walletAddress,
        usesCustodianWallet: false,
        walletType: 'custom'
      });
      toast.success('Custom wallet set successfully!');
      setShowCustomWalletInput(false);
      setCustomWalletAddress('');
      if (refreshUser) refreshUser();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to set custom wallet');
    } finally {
      setIsWalletLoading(false);
    }
  };

  const handleSwitchToCustodian = async () => {
    setIsWalletLoading(true);
    try {
      const result = await authService.useCustodianWallet();
      setWalletInfo({
        walletAddress: result.user.walletAddress,
        usesCustodianWallet: true,
        walletType: 'custodian'
      });
      toast.success('Switched to custodian wallet!');
      if (refreshUser) refreshUser();
    } catch {
      toast.error('Failed to switch wallet');
    } finally {
      setIsWalletLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-ocean-500 to-coastal-500 px-6 py-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className="text-ocean-100">{user.email}</p>
                  <div className="flex items-center mt-2">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-sm">{user.role}</span>
                    {user.isVerified && (
                      <span className="ml-2 px-2 py-1 bg-kelp-500 text-xs rounded-full">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!isEditing ? (
                <Button
                  variant="secondary"
                  onClick={() => setIsEditing(true)}
                  className="bg-white bg-opacity-20 border-white border-opacity-30 hover:bg-opacity-30"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button onClick={handleSave} loading={isLoading} className="bg-white text-ocean-600 hover:bg-slate-100">
                    Save
                  </Button>
                  <Button variant="outline" onClick={handleCancel} className="border-white text-white hover:bg-white hover:text-ocean-600">
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <div className="px-6 py-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-lg text-slate-900 dark:text-white">{user.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <p className="text-lg text-slate-600 dark:text-slate-400">{user.email}</p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Organization Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    placeholder="Enter your organization name"
                  />
                ) : (
                  <p className="text-lg text-slate-900 dark:text-white">{user.organizationName || 'Not specified'}</p>
                )}
              </div>

              {/* Payout Preferences Section */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center">
                    <svg className="mr-2 h-5 w-5 text-kelp-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Payout Preferences
                  </h3>
                  {!isPayoutEditing ? (
                    <Button variant="ghost" size="sm" onClick={() => setIsPayoutEditing(true)}>
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSavePayoutPrefs} loading={isPayoutLoading}>Save</Button>
                      <Button variant="ghost" size="sm" onClick={() => setIsPayoutEditing(false)}>Cancel</Button>
                    </div>
                  )}
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Choose how you want to receive payments when selling carbon credits.
                </p>

                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-4">
                  {/* Payout Method Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Preferred Payout Method
                    </label>
                    {isPayoutEditing ? (
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { key: 'CRYPTO', label: 'Crypto Wallet', icon: '🔗' },
                          { key: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦' },
                          { key: 'UPI', label: 'UPI', icon: '📱' },
                        ].map((method) => (
                          <button
                            key={method.key}
                            onClick={() => setPayoutPrefs(p => ({ ...p, payoutMethod: method.key as any }))}
                            className={`p-3 rounded-lg border-2 transition-all text-center ${payoutPrefs.payoutMethod === method.key
                                ? 'border-ocean-500 bg-ocean-50 dark:bg-ocean-900/20'
                                : 'border-slate-200 dark:border-slate-700 hover:border-ocean-300'
                              }`}
                          >
                            <div className="text-xl mb-1">{method.icon}</div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{method.label}</div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-900 dark:text-white capitalize">
                        {payoutPrefs.payoutMethod === 'CRYPTO' ? '🔗 Crypto Wallet' :
                          payoutPrefs.payoutMethod === 'BANK_TRANSFER' ? '🏦 Bank Transfer' : '📱 UPI'}
                      </p>
                    )}
                  </div>

                  {/* Bank Details */}
                  {(payoutPrefs.payoutMethod === 'BANK_TRANSFER' || isPayoutEditing) && (
                    <div className={`space-y-3 ${payoutPrefs.payoutMethod !== 'BANK_TRANSFER' && !isPayoutEditing ? 'hidden' : ''}`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Account Holder Name
                          </label>
                          {isPayoutEditing ? (
                            <input
                              type="text"
                              name="bankAccountName"
                              value={payoutPrefs.bankAccountName}
                              onChange={handlePayoutChange}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white"
                              placeholder="John Doe"
                            />
                          ) : (
                            <p className="text-slate-900 dark:text-white">{payoutPrefs.bankAccountName || '-'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Account Number
                          </label>
                          {isPayoutEditing ? (
                            <input
                              type="text"
                              name="bankAccountNumber"
                              value={payoutPrefs.bankAccountNumber}
                              onChange={handlePayoutChange}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white"
                              placeholder="XXXXXXXXXXXX"
                            />
                          ) : (
                            <p className="text-slate-900 dark:text-white font-mono">{payoutPrefs.bankAccountNumber ? '••••••' + payoutPrefs.bankAccountNumber.slice(-4) : '-'}</p>
                          )}
                        </div>
                      </div>
                      <div className="md:w-1/2">
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          IFSC Code
                        </label>
                        {isPayoutEditing ? (
                          <input
                            type="text"
                            name="bankIfsc"
                            value={payoutPrefs.bankIfsc}
                            onChange={handlePayoutChange}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white uppercase"
                            placeholder="SBIN0000XXX"
                          />
                        ) : (
                          <p className="text-slate-900 dark:text-white font-mono">{payoutPrefs.bankIfsc || '-'}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* UPI ID */}
                  {(payoutPrefs.payoutMethod === 'UPI' || isPayoutEditing) && (
                    <div className={`${payoutPrefs.payoutMethod !== 'UPI' && !isPayoutEditing ? 'hidden' : ''}`}>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        UPI ID
                      </label>
                      {isPayoutEditing ? (
                        <input
                          type="text"
                          name="upiId"
                          value={payoutPrefs.upiId}
                          onChange={handlePayoutChange}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white"
                          placeholder="yourname@upi"
                        />
                      ) : (
                        <p className="text-slate-900 dark:text-white">{payoutPrefs.upiId || '-'}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Wallet Section */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4 flex items-center">
                  <svg className="mr-2 h-5 w-5 text-ocean-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Blockchain Wallet
                </h3>

                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-4">
                  {/* Wallet Type Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Wallet Type</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {walletInfo?.usesCustodianWallet
                          ? 'Using platform-managed custodian wallet'
                          : 'Using your own custom wallet'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${walletInfo?.usesCustodianWallet ? 'text-kelp-600 dark:text-kelp-400 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                        Custodian
                      </span>
                      <button
                        onClick={walletInfo?.usesCustodianWallet ? () => setShowCustomWalletInput(true) : handleSwitchToCustodian}
                        className={`w-12 h-6 rounded-full transition-colors ${walletInfo?.usesCustodianWallet ? 'bg-kelp-500' : 'bg-ocean-500'}`}
                        disabled={isWalletLoading}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transform transition-transform shadow-sm ${walletInfo?.usesCustodianWallet ? 'translate-x-1' : 'translate-x-6'}`} />
                      </button>
                      <span className={`text-sm ${!walletInfo?.usesCustodianWallet ? 'text-ocean-600 dark:text-ocean-400 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                        Custom
                      </span>
                    </div>
                  </div>

                  {/* Current Wallet Address */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Wallet Address
                    </label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 bg-white dark:bg-slate-800 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 font-mono text-sm text-slate-900 dark:text-white overflow-x-auto">
                        {walletInfo?.walletAddress || 'Loading...'}
                      </code>
                      <button
                        onClick={handleCopyAddress}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
                        title="Copy address"
                      >
                        {copied ? (
                          <svg className="h-5 w-5 text-kelp-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Custom Wallet Input */}
                  {showCustomWalletInput && (
                    <div className="bg-white dark:bg-slate-800 rounded-md p-4 border border-ocean-200 dark:border-ocean-700">
                      <h4 className="font-medium text-slate-900 dark:text-white mb-2">Set Custom Wallet</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        Enter your Ethereum-compatible wallet address.
                      </p>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={customWalletAddress}
                          onChange={(e) => setCustomWalletAddress(e.target.value)}
                          placeholder="0x..."
                          className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                        />
                        <Button onClick={handleSetCustomWallet} loading={isWalletLoading} disabled={!customWalletAddress}>
                          Set
                        </Button>
                        <Button variant="ghost" onClick={() => { setShowCustomWalletInput(false); setCustomWalletAddress(''); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Wallet Info Badge */}
                  <div className="flex items-center space-x-2 text-sm">
                    <span className={`px-2 py-1 rounded-full ${walletInfo?.usesCustodianWallet
                      ? 'bg-kelp-100 dark:bg-kelp-900/30 text-kelp-700 dark:text-kelp-400'
                      : 'bg-ocean-100 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-400'
                      }`}>
                      {walletInfo?.usesCustodianWallet ? '🔒 Platform Managed' : '🔑 Self Managed'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Account Type
                    </label>
                    <p className="text-slate-900 dark:text-white">{user.role}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Member Since
                    </label>
                    <p className="text-slate-900 dark:text-white">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Last updated: {new Date().toLocaleDateString()}
              </div>
              <Button variant="danger" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;