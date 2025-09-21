import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Building, Shield, Edit2, Save, X } from 'lucide-react';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import { authService } from '../services/api';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    organizationName: user?.organizationName || '',
    walletAddress: user?.walletAddress || ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      // You might want to update the user context here
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      organizationName: user?.organizationName || '',
      walletAddress: user?.walletAddress || ''
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-green-500 px-6 py-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className="text-blue-100">{user.email}</p>
                  <div className="flex items-center mt-2">
                    <Shield className="h-4 w-4 mr-1" />
                    <span className="text-sm">{user.role}</span>
                    {user.isVerified && (
                      <span className="ml-2 px-2 py-1 bg-green-500 text-xs rounded-full">
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
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSave}
                    loading={isLoading}
                    className="bg-white text-blue-600 hover:bg-gray-100"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="border-white text-white hover:bg-white hover:text-blue-600"
                  >
                    <X className="mr-2 h-4 w-4" />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline mr-2 h-4 w-4" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{user.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline mr-2 h-4 w-4" />
                  Email Address
                </label>
                <p className="text-lg text-gray-600">{user.email}</p>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="inline mr-2 h-4 w-4" />
                  Organization Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your organization name"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{user.organizationName || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wallet Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="walletAddress"
                    value={formData.walletAddress}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0x..."
                  />
                ) : (
                  <p className="text-lg text-gray-900 font-mono">
                    {user.walletAddress || 'Not connected'}
                  </p>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Type
                    </label>
                    <p className="text-gray-900">{user.role}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Member Since
                    </label>
                    <p className="text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </div>
              <Button
                variant="danger"
                onClick={logout}
              >
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