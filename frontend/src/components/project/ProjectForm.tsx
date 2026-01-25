import React, { useState } from 'react';
import { Modal, ModalFooter } from '../ui';
import Button from '../common/Button';
import { Input, Textarea, Select } from '../ui/Input';
import toast from 'react-hot-toast';
import { useProjects } from '../../hooks/useProjects';
import { uploadService, projectService } from '../../services/api';
import { CreateProjectData } from '../../types';

interface ProjectFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'info' | 'uploads' | 'review';

interface UploadedFile {
  id: string;
  file: File;
  preview?: string; // Only for images
  type: 'IMAGE' | 'DRONE_DATA' | 'REPORT';
  status: 'pending' | 'uploading' | 'success' | 'error';
  ipfsHash?: string;
}

const ecosystemOptions = [
  { value: 'MANGROVE', label: 'Mangrove' },
  { value: 'SEAGRASS', label: 'Seagrass' },
  { value: 'SALT_MARSH', label: 'Salt Marsh' },
  { value: 'KELP', label: 'Kelp Forest' },
];

const ProjectForm: React.FC<ProjectFormProps> = ({ onClose, onSuccess }) => {
  const { createProject, isLoading } = useProjects();
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    description: '',
    location: '',
    latitude: 0,
    longitude: 0,
    areaHectares: 0,
    ecosystemType: 'MANGROVE',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'latitude' || name === 'longitude' || name === 'areaHectares'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
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
        toast.success('Location detected!');
      },
      () => {
        setDetectingLocation(false);
        toast.error('Unable to detect location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleNextStep = async () => {
    if (currentStep === 'info') {
      if (!formData.name || !formData.location || !formData.latitude || !formData.longitude || !formData.areaHectares) {
        toast.error('Please fill in all required fields');
        return;
      }

      try {
        const result = await createProject(formData);
        setProjectId(result.id);
        setCurrentStep('uploads');
      } catch {
        toast.error('Failed to create project');
      }
    } else if (currentStep === 'uploads') {
      if (files.filter(f => f.type === 'IMAGE' && f.status === 'success').length < 1) {
        toast.error('Please upload at least 1 image');
        return;
      }
      setCurrentStep('review');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'uploads') {
      setCurrentStep('info');
    } else if (currentStep === 'review') {
      setCurrentStep('uploads');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'IMAGE' | 'DRONE_DATA' | 'REPORT') => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles, type);
    }
  };

  const addFiles = (selectedFiles: File[], type: 'IMAGE' | 'DRONE_DATA' | 'REPORT') => {
    const newFiles: UploadedFile[] = selectedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: type === 'IMAGE' ? URL.createObjectURL(file) : undefined,
      type,
      status: 'pending' as const,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent, type: 'IMAGE' | 'DRONE_DATA' | 'REPORT') => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    // basic validation
    const validFiles = droppedFiles.filter(f => {
      if (type === 'IMAGE') return f.type.startsWith('image/');
      if (type === 'REPORT') return f.type === 'application/pdf';
      return true; // Drone data can be anything (zip, las, etc)
    });
    addFiles(validFiles, type);
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file && file.preview) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== id);
    });
  };

  const uploadFiles = async () => {
    if (!projectId) return;
    setIsUploading(true);

    for (const fileItem of files) {
      if (fileItem.status === 'success') continue;

      setFiles(prev =>
        prev.map(f => f.id === fileItem.id ? { ...f, status: 'uploading' as const } : f)
      );

      try {
        const result = await uploadService.uploadFile(fileItem.file, projectId, fileItem.type);
        setFiles(prev =>
          prev.map(f => f.id === fileItem.id
            ? { ...f, status: 'success' as const, ipfsHash: result.document?.ipfsHash }
            : f
          )
        );
      } catch {
        setFiles(prev =>
          prev.map(f => f.id === fileItem.id ? { ...f, status: 'error' as const } : f)
        );
      }
    }

    setIsUploading(false);
    const successImages = files.filter(f => f.type === 'IMAGE' && f.status === 'success').length;
    if (successImages >= 1) {
      toast.success('Files uploaded!');
    }
  };

  const handleFinalize = async () => {
    if (!projectId) return;
    setIsFinalizing(true);

    try {
      await projectService.finalizeProject(projectId);
      toast.success('Project submitted for review!');
      onSuccess();
    } catch {
      toast.error('Failed to finalize project');
    } finally {
      setIsFinalizing(false);
    }
  };

  const steps = [
    { key: 'info', label: 'Project Info' },
    { key: 'uploads', label: 'Upload Data' },
    { key: 'review', label: 'Review & Submit' },
  ];

  const successImages = files.filter(f => f.type === 'IMAGE' && f.status === 'success').length;

  return (
    <Modal isOpen={true} onClose={onClose} title="Create New Project" size="lg">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <div className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep === step.key
                  ? 'bg-ocean-500 text-white'
                  : steps.findIndex(s => s.key === currentStep) > index
                    ? 'bg-kelp-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }
              `}>
                {steps.findIndex(s => s.key === currentStep) > index ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span className={`ml-2 text-sm font-medium hidden sm:block ${currentStep === step.key
                ? 'text-ocean-600 dark:text-ocean-400'
                : 'text-slate-500 dark:text-slate-400'
                }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${steps.findIndex(s => s.key === currentStep) > index
                ? 'bg-kelp-500'
                : 'bg-slate-200 dark:bg-slate-700'
                }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Project Info */}
      {currentStep === 'info' && (
        <div className="space-y-4">
          <Input
            label="Project Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Mangrove Restoration Project"
            required
          />

          <Textarea
            label="Description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            placeholder="Describe your restoration project..."
            rows={3}
          />

          <Input
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Sundarbans, West Bengal"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude"
              name="latitude"
              type="number"
              value={formData.latitude}
              onChange={handleChange}
              step="0.000001"
              min="-90"
              max="90"
              required
            />
            <Input
              label="Longitude"
              name="longitude"
              type="number"
              value={formData.longitude}
              onChange={handleChange}
              step="0.000001"
              min="-180"
              max="180"
              required
            />
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={detectLocation}
            loading={detectingLocation}
            className="w-full"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Auto-detect Location
          </Button>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Area (hectares)"
              name="areaHectares"
              type="number"
              value={formData.areaHectares}
              onChange={handleChange}
              step="0.1"
              min="0.1"
              required
            />
            <Select
              label="Ecosystem Type"
              name="ecosystemType"
              value={formData.ecosystemType}
              onChange={handleChange}
              options={ecosystemOptions}
              required
            />
          </div>
        </div>
      )}

      {/* Step 2: Upload Data */}
      {currentStep === 'uploads' && (
        <div className="space-y-6">
          {/* Images Section */}
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Project Images (Required)</h4>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, 'IMAGE')}
              className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer border-slate-300 dark:border-slate-600 hover:border-ocean-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileSelect(e, 'IMAGE')}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer block">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Drop images here or click to browse
                </p>
              </label>
            </div>
            {/* Image Preview Grid */}
            {files.filter(f => f.type === 'IMAGE').length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-3">
                {files.filter(f => f.type === 'IMAGE').map(file => (
                  <div key={file.id} className="relative group rounded-lg overflow-hidden aspect-square">
                    <img src={file.preview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeFile(file.id)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {/* Status Overlay */}
                    {file.status !== 'pending' && (
                      <div className={`absolute inset-0 flex items-center justify-center ${file.status === 'uploading' ? 'bg-slate-900/60' : 'bg-kelp-500/20'}`}>
                        {file.status === 'uploading' && <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {file.status === 'success' && <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-700" />

          {/* Documents Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Drone Data */}
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Drone Data (LiDAR/Point Cloud)</h4>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'DRONE_DATA')}
                className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer border-slate-300 dark:border-slate-600 hover:border-ocean-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <input
                  type="file"
                  accept=".zip,.las,.laz,.obj"
                  onChange={(e) => handleFileSelect(e, 'DRONE_DATA')}
                  className="hidden"
                  id="drone-upload"
                />
                <label htmlFor="drone-upload" className="cursor-pointer block">
                  <span className="text-2xl mb-1 block">🚁</span>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Upload .zip, .las, .obj
                  </p>
                </label>
              </div>
              {/* List */}
              <div className="mt-2 space-y-2">
                {files.filter(f => f.type === 'DRONE_DATA').map(file => (
                  <div key={file.id} className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-800 p-2 rounded">
                    <span className="truncate flex-1">{file.file.name}</span>
                    <button onClick={() => removeFile(file.id)} className="text-red-500 ml-2">×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Reports */}
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Technical Reports (PDF)</h4>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'REPORT')}
                className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer border-slate-300 dark:border-slate-600 hover:border-ocean-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleFileSelect(e, 'REPORT')}
                  className="hidden"
                  id="report-upload"
                />
                <label htmlFor="report-upload" className="cursor-pointer block">
                  <span className="text-2xl mb-1 block">📄</span>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Upload PDF reports
                  </p>
                </label>
              </div>
              {/* List */}
              <div className="mt-2 space-y-2">
                {files.filter(f => f.type === 'REPORT').map(file => (
                  <div key={file.id} className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-800 p-2 rounded">
                    <span className="truncate flex-1">{file.file.name}</span>
                    <button onClick={() => removeFile(file.id)} className="text-red-500 ml-2">×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={uploadFiles} loading={isUploading} className="w-full">
            Upload All Files ({files.length})
          </Button>

          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
            {files.filter(f => f.status === 'success').length} of {files.length} uploaded successfully
          </p>
        </div>
      )}

      {/* Step 3: Review */}
      {currentStep === 'review' && (
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
            <h4 className="font-medium text-slate-900 dark:text-slate-100">Project Summary</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Name:</span>
                <p className="font-medium text-slate-900 dark:text-slate-100">{formData.name}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Location:</span>
                <p className="font-medium text-slate-900 dark:text-slate-100">{formData.location}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Area:</span>
                <p className="font-medium text-slate-900 dark:text-slate-100">{formData.areaHectares} hectares</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Ecosystem:</span>
                <p className="font-medium text-slate-900 dark:text-slate-100">{formData.ecosystemType.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Ecosystem:</span>
                <p className="font-medium text-slate-900 dark:text-slate-100">{formData.ecosystemType.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Files:</span>
                <p className="font-medium text-slate-900 dark:text-slate-100">{files.filter(f => f.status === 'success').length} uploaded</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-kelp-50 dark:bg-kelp-900/20 border border-kelp-200 dark:border-kelp-800">
            <p className="text-sm text-kelp-700 dark:text-kelp-300">
              Ready to submit! Your project will be reviewed by our team and you'll be notified once approved.
            </p>
          </div>
        </div>
      )}

      <ModalFooter>
        {currentStep !== 'info' && (
          <Button variant="ghost" onClick={handlePrevStep} disabled={isLoading || isUploading || isFinalizing}>
            Back
          </Button>
        )}
        <Button variant="ghost" onClick={onClose} disabled={isLoading || isUploading || isFinalizing}>
          Cancel
        </Button>
        {currentStep === 'review' ? (
          <Button onClick={handleFinalize} loading={isFinalizing}>
            Submit Project
          </Button>
        ) : (
          <Button
            onClick={handleNextStep}
            loading={isLoading}
            disabled={currentStep === 'uploads' && successImages < 1}
          >
            {currentStep === 'uploads' ? 'Continue to Review' : 'Next: Upload Data'}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default ProjectForm;
