import React, { useEffect, useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { Plus, Search } from 'lucide-react';
import ProjectCard from '../components/project/ProjectCard';
import ProjectForm from '../components/project/ProjectForm';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Projects: React.FC = () => {
  const { projects, isLoading, loadProjects } = useProjects();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ecosystemFilter, setEcosystemFilter] = useState('');

  useEffect(() => {
    const filters: any = {};
    if (statusFilter) filters.status = statusFilter;
    if (ecosystemFilter) filters.ecosystemType = ecosystemFilter;
    
    loadProjects(filters);
  }, [loadProjects, statusFilter, ecosystemFilter]);

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProjectCreated = () => {
    setShowProjectForm(false);
    loadProjects();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Blue Carbon Projects
            </h1>
            <p className="text-gray-600">
              Discover and support coastal ecosystem restoration projects across India
            </p>
          </div>
          
          <Button
            onClick={() => setShowProjectForm(true)}
            className="mt-4 md:mt-0"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Project
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>
            
            <select
              value={ecosystemFilter}
              onChange={(e) => setEcosystemFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Ecosystems</option>
              <option value="MANGROVE">Mangrove</option>
              <option value="SEAGRASS">Seagrass</option>
              <option value="SALT_MARSH">Salt Marsh</option>
              <option value="KELP">Kelp Forest</option>
            </select>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onViewDetails={() => {}}
              showActions={true}
            />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🌊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No projects found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter || ecosystemFilter
                ? 'Try adjusting your filters to see more projects.'
                : 'Be the first to create a blue carbon restoration project.'}
            </p>
            <Button onClick={() => setShowProjectForm(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Create Project
            </Button>
          </div>
        )}

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

export default Projects;