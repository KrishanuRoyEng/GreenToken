import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Leaf, 
  Shield, 
  Coins, 
  Users, 
  BarChart3, 
  MapPin,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import Button from '../components/common/Button';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      setShowRegister(true);
    }
  };

  const features = [
    {
      icon: <Shield className="h-8 w-8 text-blue-600" />,
      title: 'Blockchain Verified',
      description: 'Immutable storage of restoration data using distributed ledger technology'
    },
    {
      icon: <Coins className="h-8 w-8 text-green-600" />,
      title: 'Tokenized Credits',
      description: 'Smart contracts automatically generate and manage carbon credit tokens'
    },
    {
      icon: <MapPin className="h-8 w-8 text-purple-600" />,
      title: 'GPS Tracking',
      description: 'Precise location tracking and monitoring of restoration projects'
    },
    {
      icon: <Users className="h-8 w-8 text-orange-600" />,
      title: 'Community Driven',
      description: 'Collaborative platform for NGOs, panchayats, and coastal communities'
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-indigo-600" />,
      title: 'Real-time Analytics',
      description: 'Comprehensive monitoring and reporting dashboard'
    },
    {
      icon: <Leaf className="h-8 w-8 text-teal-600" />,
      title: 'Impact Verified',
      description: 'Scientific verification of carbon sequestration and biodiversity impact'
    }
  ];

  const ecosystems = [
    { name: 'Mangroves', area: '2,500 hectares', credits: '25,000 tokens', color: 'bg-green-500' },
    { name: 'Seagrass', area: '1,800 hectares', credits: '14,400 tokens', color: 'bg-blue-500' },
    { name: 'Salt Marshes', area: '1,200 hectares', credits: '7,200 tokens', color: 'bg-purple-500' },
    { name: 'Kelp Forests', area: '800 hectares', credits: '4,000 tokens', color: 'bg-teal-500' }
  ];

  return (
    <>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-50 via-white to-green-50 py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-green-600/10" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                GreenToken
                <span className="text-green-600"> MRV System</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Blockchain-powered Monitoring, Reporting, and Verification for 
                coastal ecosystem restoration projects in India
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="px-8 py-3 text-lg"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                {!user && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShowLogin(true)}
                    className="px-8 py-3 text-lg"
                  >
                    Login
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">156</div>
                <div className="text-gray-600">Active Projects</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">6,300</div>
                <div className="text-gray-600">Hectares Restored</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">50,600</div>
                <div className="text-gray-600">Carbon Credits</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">89</div>
                <div className="text-gray-600">Organizations</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose GreenToken ?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our platform combines cutting-edge blockchain technology with 
                scientific rigor to ensure on ground work is transparent and verifiable carbon credits.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ecosystem Types */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Supported Ecosystems
              </h2>
              <p className="text-xl text-gray-600">
                Restoration and monitoring across diverse blue carbon ecosystems
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {ecosystems.map((ecosystem, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200"
                >
                  <div className={`w-12 h-12 ${ecosystem.color} rounded-lg mb-4 flex items-center justify-center`}>
                    <Leaf className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {ecosystem.name}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {ecosystem.area}
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                      {ecosystem.credits}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-blue-600 to-green-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Make an Impact?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join the movement to restore coastal ecosystems and fight climate change 
              with transparent, verifiable carbon credits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={handleGetStarted}
                className="px-8 py-3 text-lg bg-black text-blue-600 hover:bg-black-100"
              >
                Start Your Project
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-3 text-lg bg-grey text-blue-600 hover:bg-grey hover:text-blue-600"
                onClick={() => setShowLogin(true)}
              >
                Learn More
              </Button>
            </div>
          </div>
        </section>
      </div>

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

export default Home;