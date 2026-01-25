import React from 'react';
import { StatusBadge, EcosystemBadge } from '../ui';

interface Project {
  id: string;
  name: string;
  description?: string;
  location: string;
  areaHectares: number;
  ecosystemType: string;
  status: string;
  estimatedCredits?: number;
  issuedCredits?: number;
  owner?: {
    name: string;
    organizationName?: string;
  };
}

interface ProjectCardProps {
  project: Project;
  onViewDetails?: () => void;
  showActions?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onViewDetails, showActions }) => {
  const getEcosystemGradient = (type: string) => {
    switch (type) {
      case 'MANGROVE': return 'from-kelp-400 to-kelp-600';
      case 'SEAGRASS': return 'from-ocean-400 to-ocean-600';
      case 'SALT_MARSH': return 'from-coastal-400 to-coastal-600';
      case 'KELP': return 'from-cyan-400 to-cyan-600';
      default: return 'from-slate-400 to-slate-600';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      {/* Gradient header */}
      <div className={`h-3 bg-gradient-to-r ${getEcosystemGradient(project.ecosystemType)}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-1">
            {project.name}
          </h3>
          <StatusBadge status={project.status} />
        </div>

        {/* Location */}
        <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mb-3">
          <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{project.location}</span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Area</div>
            <div className="font-semibold text-slate-900 dark:text-white">{project.areaHectares} ha</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Credits</div>
            <div className="font-semibold text-slate-900 dark:text-white">
              {project.issuedCredits || project.estimatedCredits || 0}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
          <EcosystemBadge ecosystem={project.ecosystemType} />

          {showActions && onViewDetails && (
            <button
              onClick={onViewDetails}
              className="text-sm text-ocean-600 dark:text-ocean-400 hover:text-ocean-700 dark:hover:text-ocean-300 font-medium"
            >
              View Details →
            </button>
          )}
        </div>

        {/* Owner info */}
        {project.owner && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
            By {project.owner.name}
            {project.owner.organizationName && ` • ${project.owner.organizationName}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;