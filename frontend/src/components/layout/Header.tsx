import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Trees, Menu, X, User, LogOut, Home } from 'lucide-react';
import LoginForm from '../auth/LoginForm';
import RegisterForm from '../auth/RegisterForm';
import Button from '../common/Button';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Trees className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">
                GreenToken
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Home className="h-8 w-8 text-green-600 hover:text-blue-600" />
              </Link>
              {user && (
                <>
                  <Link 
                    to="/dashboard" 
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/projects" 
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Projects
                  </Link>
                  <Link 
                    to="/marketplace" 
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Marketplace
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link 
                      to="/admin" 
                      className="text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      Admin
                    </Link>
                  )}
                </>
              )}
            </nav>

            {/* Auth Section */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span>{user.name}</span>
                  </button>                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowLogin(true)}
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => setShowRegister(true)}
                  >
                    Register
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-gray-700 hover:text-blue-600"
              >
                {showMobileMenu ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-3">
                <Link 
                  to="/" 
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Home
                </Link>
                {user ? (
                  <>
                    <Link 
                      to="/dashboard" 
                      className="text-gray-700 hover:text-blue-600 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/projects" 
                      className="text-gray-700 hover:text-blue-600 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Projects
                    </Link>
                    <Link 
                      to="/marketplace" 
                      className="text-gray-700 hover:text-blue-600 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Marketplace
                    </Link>
                    <Link 
                      to="/profile" 
                      className="text-gray-700 hover:text-blue-600 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Profile
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link 
                        to="/admin" 
                        className="text-gray-700 hover:text-blue-600 transition-colors"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMobileMenu(false);
                      }}
                      className="text-left text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowLogin(true);
                        setShowMobileMenu(false);
                      }}
                      className="w-full justify-start"
                    >
                      Login
                    </Button>
                    <Button
                      onClick={() => {
                        setShowRegister(true);
                        setShowMobileMenu(false);
                      }}
                      className="w-full"
                    >
                      Register
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Modals */}
      {showLogin && (
        <LoginForm
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}
      {showRegister && (
        <RegisterForm
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
    </>
  );
};

export default Header;