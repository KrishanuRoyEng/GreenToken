import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { useTokens } from '../hooks/useTokens';
import { 
  BarChart3, 
  Coins, 
  MapPin, 
  Leaf, 
  TrendingUp,
  Plus,
  ArrowRight
} from 'lucide-react';
import ProjectCard  from '../components/project/ProjectCard';
import TokenMarketplace  from '../components/token/TokenMarketplace';
import ProjectForm from '../components/project/ProjectForm';
import StatsCard from '../components/common/StatsCard';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, isLoading: projectsLoading, loadUserProjects } = useProjects();
  const { balance, loadUserTokens } = useTokens();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'marketplace'>('overview');

  useEffect(() => {
    if (user) {
      loadUserProjects();
      loadUserTokens();
    }
  }, [user, loadUserProjects, loadUserTokens]);

  const stats = {
    totalProjects: projects.length,
    approvedProjects: projects.filter(p => p.status === 'APPROVED').length,
    pendingProjects: projects.filter(p => p.status === 'PENDING').length,
    carbonTokens: balance.total,
    soulboundTokens: projects.filter(p => p.status === 'APPROVED').length
  };

  const handleProjectCreated = () => {
    setShowProjectForm(false);
    loadUserProjects();
  };

  if (projectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}
          </h1>
          <p className="text-gray-600">
            Manage your GreenToken projects and track your environmental impact
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg mb-8 shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="inline mr-2 h-4 w-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'projects'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapPin className="inline mr-2 h-4 w-4" />
            Projects
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'marketplace'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Coins className="inline mr-2 h-4 w-4" />
            Marketplace
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatsCard
                title="Total Projects"
                value={stats.totalProjects}
                icon={<MapPin className="h-8 w-8 text-blue-600" />}
              />
              <StatsCard
                title="Approved Projects"
                value={stats.approvedProjects}
                icon={<Leaf className="h-8 w-8 text-green-600" />}
              />
              <StatsCard
                title="Pending Approval"
                value={stats.pendingProjects}
                icon={<TrendingUp className="h-8 w-8 text-yellow-600" />}
              />
              <StatsCard
                title="Carbon Tokens"
                value={stats.carbonTokens}
                icon={<Coins className="h-8 w-8 text-green-600" />}
                subtitle={`${balance.sold} sold | ${balance.acquired} acquired`}
              />
              <StatsCard
                title="Soulbound Tokens"
                value={stats.soulboundTokens}
                icon={<Leaf className="h-8 w-8 text-purple-600" />}
                subtitle="Achievement tokens"
              />
            </div>

            {/* Recent Projects */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Projects
                </h2>
                <button
                  onClick={() => setActiveTab('projects')}
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                >
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </button>
              </div>
              
              {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.slice(0, 3).map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onViewDetails={() => {}}
                      showActions={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Leaf className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No projects yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Start your green token journey by creating your first project
                  </p>
                  <Button
                    onClick={() => setShowProjectForm(true)}
                    className="inline-flex items-center"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Create Your First Project
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Your Projects
                </h2>
                {projects.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {projects.length} total
                  </span>
                )}
              </div>
              
              <Button
                onClick={() => setShowProjectForm(true)}
                className="inline-flex items-center"
              >
                <Plus className="mr-2 h-5 w-5" />
                New Project
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onViewDetails={() => {}}
                  showActions={true}
                />
              ))}
            </div>

            {projects.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <MapPin className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No projects found
                </h3>
                <p className="text-gray-500 mb-6">
                  Create your first green token restoration project
                </p>
                <Button
                  onClick={() => setShowProjectForm(true)}
                  className="inline-flex items-center"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Create Project
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Marketplace Tab */}
        {activeTab === 'marketplace' && <TokenMarketplace />}

        {/* Project Form Modal */}
        {showProjectForm && (
          <ProjectForm
            onClose={() => setShowProjectForm(false)}
            onSuccess={handleProjectCreated}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;