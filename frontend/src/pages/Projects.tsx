import React, { useEffect, useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import ProjectCard from '../components/project/ProjectCard';
import ProjectMap from '../components/project/ProjectMap'; // Import Map
import ProjectForm from '../components/project/ProjectForm';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

import ProjectDetailModal from '../components/project/ProjectDetailModal';
import { LayoutGrid, Map as MapIcon } from 'lucide-react'; // Import icons

const Projects: React.FC = () => {
  const { projects, isLoading, loadProjects } = useProjects();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ecosystemFilter, setEcosystemFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid'); // View mode state

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Blue Carbon Projects
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Discover and support coastal ecosystem restoration projects
            </p>
          </div>

          <div className="flex gap-4 mt-4 md:mt-0">
            {/* View Toggle */}
            <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 flex">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-ocean-100 text-ocean-600 dark:bg-ocean-900/30 dark:text-ocean-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                aria-label="Grid view"
              >
                <LayoutGrid size={20} />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-md transition-all ${viewMode === 'map' ? 'bg-ocean-100 text-ocean-600 dark:bg-ocean-900/30 dark:text-ocean-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                aria-label="Map view"
              >
                <MapIcon size={20} />
              </button>
            </div>

            <Button
              onClick={() => setShowProjectForm(true)}
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Project
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-8 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ocean-500"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-ocean-500"
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
              className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-ocean-500"
            >
              <option value="">All Ecosystems</option>
              <option value="MANGROVE">Mangrove</option>
              <option value="SEAGRASS">Seagrass</option>
              <option value="SALT_MARSH">Salt Marsh</option>
              <option value="KELP">Kelp Forest</option>
            </select>
          </div>
        </div>

        {/* Content Area - Switch between Grid and Map */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onViewDetails={() => setSelectedProject(project)}
                showActions={true}
              />
            ))}
          </div>
        ) : (
          <ProjectMap
            projects={filteredProjects}
            onProjectSelect={setSelectedProject}
          />
        )}

        {filteredProjects.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mt-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-ocean-100 dark:bg-ocean-900/30 flex items-center justify-center">
              <svg className="w-10 h-10 text-ocean-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No projects found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
              {searchTerm || statusFilter || ecosystemFilter
                ? 'Try adjusting your filters to see more projects.'
                : 'Be the first to create a blue carbon restoration project.'}
            </p>
            <Button onClick={() => setShowProjectForm(true)}>
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

        {/* Project Detail Modal */}
        {selectedProject && (
          <ProjectDetailModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Projects;