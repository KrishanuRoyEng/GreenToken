import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import Button from '../common/Button';
import toast from 'react-hot-toast';
import { useProjects } from '../../hooks/useProjects';
import { CreateProjectData } from '../../types';

interface ProjectFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onClose, onSuccess }) => {
  const { createProject, isLoading } = useProjects();

  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    description: '',
    location: '',
    latitude: 0,
    longitude: 0,
    areaHectares: 0,
    ecosystemType: 'MANGROVE',
  });

  const [detectingLocation, setDetectingLocation] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'latitude' || name === 'longitude' || name === 'areaHectares'
          ? parseFloat(value)
          : value,
    }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(position.coords.latitude.toFixed(6)),
          longitude: parseFloat(position.coords.longitude.toFixed(6)),
        }));
        setDetectingLocation(false);
        toast.success('Location detected successfully!');
      },
      () => {
        setDetectingLocation(false);
        toast.error('Unable to detect location. Please enter manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location || !formData.latitude || !formData.longitude || !formData.areaHectares) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createProject(formData);
      toast.success('Project created successfully! It will be reviewed for approval.');
      onSuccess();
    } catch {
      toast.error('Failed to create project. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Mangrove Restoration Project"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  placeholder="Describe your restoration project..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Location */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Sundarbans, West Bengal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Latitude */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude *</label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="22.4041"
                  step="0.000001"
                  min="-90"
                  max="90"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude *</label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="88.9775"
                  step="0.000001"
                  min="-180"
                  max="180"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Auto-detect button */}
              <div className="md:col-span-2">
                <Button type="button" variant="outline" onClick={detectLocation} loading={detectingLocation} className="w-full sm:w-auto">
                  <MapPin className="mr-2 h-4 w-4" />
                  {detectingLocation ? 'Detecting Location...' : 'Auto-detect Location'}
                </Button>
              </div>

              {/* Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area (hectares) *</label>
                <input
                  type="number"
                  name="areaHectares"
                  value={formData.areaHectares}
                  onChange={handleChange}
                  placeholder="10.5"
                  step="0.1"
                  min="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Ecosystem Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ecosystem Type *</label>
                <select
                  name="ecosystemType"
                  value={formData.ecosystemType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="MANGROVE">Mangrove</option>
                  <option value="SEAGRASS">Seagrass</option>
                  <option value="SALT_MARSH">Salt Marsh</option>
                  <option value="KELP">Kelp Forest</option>
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                Create Project
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;
