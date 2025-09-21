import React from 'react';
import { MapPin, Calendar, Leaf, TrendingUp } from 'lucide-react';
import { Project } from '../../types';
import Button from '../common/Button';

interface ProjectCardProps {
  project: Project;
  onViewDetails: (project: Project) => void;
  onGenerateCredits?: (project: Project) => void;
  showActions?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onViewDetails,
  onGenerateCredits,
  showActions = false
}) => {
  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      ACTIVE: 'bg-blue-100 text-blue-800 border-blue-200',
      COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status as keyof typeof colors] || colors.PENDING;
  };

  const getEcosystemIcon = (type: string) => {
    const icons = {
      MANGROVE: '🌳',
      SEAGRASS: '🌾',
      SALT_MARSH: '🌿',
      KELP: '🌊'
    };
    return icons[type as keyof typeof icons] || '🌱';
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
            {project.name}
          </h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
            {project.status.charAt(0) + project.status.slice(1).toLowerCase()}
          </span>
        </div>
        <div className="text-3xl ml-4">
          {getEcosystemIcon(project.ecosystemType)}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center text-gray-600">
          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-sm">
            {project.latitude.toFixed(4)}°N, {project.longitude.toFixed(4)}°E
          </span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <Leaf className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-sm">{project.areaHectares} hectares</span>
        </div>

        <div className="flex items-center text-gray-600">
          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-sm">
            {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {project.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {project.estimatedCredits || 0}
          </div>
          <div className="text-xs text-gray-500">Est. Credits</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {project.issuedCredits || 0}
          </div>
          <div className="text-xs text-gray-500">Issued</div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(project)}
          className="flex-1"
        >
          View Details
        </Button>
        
        {showActions && project.status === 'APPROVED' && onGenerateCredits && (
          <Button
            size="sm"
            onClick={() => onGenerateCredits(project)}
            className="flex-1"
          >
            <TrendingUp className="mr-1 h-4 w-4" />
            Generate
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;