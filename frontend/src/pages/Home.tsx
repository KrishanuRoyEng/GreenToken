import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Blockchain Verified',
      description: 'Immutable storage of restoration data using distributed ledger technology',
      color: 'text-ocean-500',
      bg: 'bg-ocean-50 dark:bg-ocean-900/20',
    },
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      title: 'Real-time Tracking',
      description: 'Monitor project progress with GPS tracking and live updates',
      color: 'text-coastal-500',
      bg: 'bg-coastal-50 dark:bg-coastal-900/20',
    },
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Carbon Credits',
      description: 'Smart contracts automatically generate and manage tokenized credits',
      color: 'text-kelp-500',
      bg: 'bg-kelp-50 dark:bg-kelp-900/20',
    },
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Community Driven',
      description: 'Collaborative platform for NGOs, panchayats, and coastal communities',
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
  ];

  const ecosystems = [
    { name: 'Mangroves', area: '2,500 ha', credits: '25,000', gradient: 'from-kelp-400 to-kelp-600' },
    { name: 'Seagrass', area: '1,800 ha', credits: '14,400', gradient: 'from-ocean-400 to-ocean-600' },
    { name: 'Salt Marshes', area: '1,200 ha', credits: '7,200', gradient: 'from-coastal-400 to-coastal-600' },
    { name: 'Kelp Forests', area: '800 ha', credits: '4,000', gradient: 'from-cyan-400 to-cyan-600' },
  ];

  return (
    <>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-ocean-50 via-white to-coastal-50 dark:from-slate-900 dark:via-slate-900 dark:to-ocean-950" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-ocean-300 dark:via-ocean-700 to-transparent" />

          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-ocean-200/30 dark:bg-ocean-800/20 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-coastal-200/30 dark:bg-coastal-800/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ocean-100 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-300 text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-kelp-500 rounded-full animate-pulse" />
                Powered by Blockchain & IPFS
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white mb-6">
                <span className="gradient-text">GreenToken</span>
                <br />
                <span className="text-slate-700 dark:text-slate-300">MRV System</span>
              </h1>

              <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
                Blockchain-powered Monitoring, Reporting, and Verification for
                coastal ecosystem restoration projects in India
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="px-8 py-4 text-lg"
                >
                  Get Started
                  <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
                {!user && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShowLogin(true)}
                    className="px-8 py-4 text-lg"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '156', label: 'Active Projects', color: 'text-ocean-500' },
                { value: '6,300', label: 'Hectares Restored', color: 'text-kelp-500' },
                { value: '50,600', label: 'Carbon Credits', color: 'text-coastal-500' },
                { value: '89', label: 'Organizations', color: 'text-amber-500' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                  <div className="text-slate-600 dark:text-slate-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Why Choose GreenToken?
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Combining cutting-edge technology with scientific rigor for transparent, verifiable carbon credits
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center mb-5`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ecosystems Section */}
        <section className="py-20 bg-white dark:bg-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Supported Ecosystems
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                Restoration across diverse blue carbon ecosystems
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {ecosystems.map((eco, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${eco.gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative p-6 text-white">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-4">{eco.name}</h3>
                    <div className="space-y-2 text-white/90 text-sm">
                      <div className="flex justify-between">
                        <span>Area Restored</span>
                        <span className="font-medium">{eco.area}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Credits Issued</span>
                        <span className="font-medium">{eco.credits}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-ocean-600 via-ocean-700 to-coastal-700 dark:from-ocean-900 dark:via-ocean-950 dark:to-coastal-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Make an Impact?
            </h2>
            <p className="text-xl text-ocean-100 mb-10 max-w-2xl mx-auto">
              Join the movement to restore coastal ecosystems and fight climate change
              with transparent, verifiable carbon credits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={handleGetStarted}
                className="px-8 py-4 text-lg bg-white text-ocean-700 hover:bg-ocean-50"
              >
                Start Your Project
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