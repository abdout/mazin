'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getProject } from '@/components/platform/project/actions';

interface Project {
  id?: string;
  _id?: string;
  customer?: string | null;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  systems?: string[];
  shipmentTypes?: string[];
  portOfOrigin?: string | null;
  portOfDestination?: string | null;
  blAwbNumber?: string | null;
  team?: string[];
  teamLead?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown;
}

interface ProjectContextType {
  project: Project | null;
  loading: boolean;
  error: string | null;
  fetchProject: (id: string) => Promise<void>;
  setProject: (project: Project | null) => void;
  clearProject: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async (id: string) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getProject(id);

      if (result.success && result.project) {
        // Normalize the project data
        const normalizedProject: Project = {
          ...result.project,
          _id: result.project.id,
        };
        setProject(normalizedProject);
      } else {
        setError(result.error || 'Failed to fetch project');
        setProject(null);
      }
    } catch (err) {
      console.error('Error fetching project:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch project');
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearProject = useCallback(() => {
    setProject(null);
    setError(null);
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        project,
        loading,
        error,
        fetchProject,
        setProject,
        clearProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
