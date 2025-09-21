import { useState, useCallback } from 'react';
import { projectService } from '../services/api';
import { Project, CreateProjectData} from '../types';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async (filters?: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await projectService.getProjects(filters);
      setProjects(data.projects || data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadUserProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userProjects = await projectService.getUserProjects();
      setProjects(userProjects);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load user projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProject = useCallback(async (projectData: CreateProjectData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await projectService.createProject(projectData);
      const newProject = response.project;
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProject = useCallback(async (id: string, data: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await projectService.updateProject(id, data);
      const updatedProject = response.project;
      setProjects(prev => 
        prev.map(p => p.id === id ? updatedProject : p)
      );
      return updatedProject;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update project');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approveProject = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await projectService.approveProject(id);
      const updatedProject = response.project;
      setProjects(prev => 
        prev.map(p => p.id === id ? updatedProject : p)
      );
      return updatedProject;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve project');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rejectProject = useCallback(async (id: string, reason?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await projectService.rejectProject(id, reason);
      const updatedProject = response.project;
      setProjects(prev => 
        prev.map(p => p.id === id ? updatedProject : p)
      );
      return updatedProject;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reject project');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    projects,
    isLoading,
    error,
    loadProjects,
    loadUserProjects,
    createProject,
    updateProject,
    approveProject,
    rejectProject,
  };
};