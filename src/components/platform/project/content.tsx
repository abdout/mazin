"use client";
import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Project } from './types';
import { getProjects } from './actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import ProjectCreateForm from './form';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import ProjectCard from './card';
import Loading from "@/components/atom/loading";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useRouter } from 'next/navigation';

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, projectID: string | null }>({ x: 0, y: 0, projectID: null });
  const router = useRouter();

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const result = await getProjects();
      if (result.success) {
        setProjects(result.projects || []);
      } else {
        toast.error(result.error || 'Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('An error occurred while fetching projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleRightClick = (e: React.MouseEvent, projectID: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, projectID });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ x: 0, y: 0, projectID: null });
  };

  const handleOpenDialog = (projectId: string) => {
    setEditingProjectId(projectId);
    setIsCreateDialogOpen(true);
    handleCloseContextMenu();
  };

  const projectToEdit = editingProjectId ? projects.find((p: Project) => p._id === editingProjectId) : null;

  const handleProjectCreated = async () => {
    await fetchProjects();
    setIsCreateDialogOpen(false);
    setEditingProjectId(null);
  };

  const handleProjectDeleted = async () => {
    await fetchProjects();
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {projects.map((project: Project) => (
          <ProjectCard
            key={project.id}
            project={project}
            contextMenu={contextMenu}
            onRightClick={handleRightClick}
            onCloseContextMenu={handleCloseContextMenu}
            onOpenDialog={handleOpenDialog}
            onProjectDeleted={handleProjectDeleted}
          />
        ))}

        <div className="h-48">
          <button
            className="w-full h-full p-6 border rounded-xl flex flex-col items-center justify-center hover:border-black opacity-70 hover:opacity-100"
            onClick={() => {
              setEditingProjectId(null);
              setIsCreateDialogOpen(true);
            }}
          >
            <Icon icon="ph:plus-thin" width={70} />
          </button>
        </div>
      </div>

      <Dialog 
        open={isCreateDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingProjectId(null);
          }
        }}
      >
        <DialogContent className="max-w-full h-screen p-0 overflow-hidden">
          <DialogClose asChild className="absolute right-4 top-4">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
          <VisuallyHidden>
            <DialogTitle>{editingProjectId ? 'Edit Project' : 'Create Project'}</DialogTitle>
          </VisuallyHidden>
          <ProjectCreateForm 
            projectToEdit={projectToEdit}
            onSuccess={handleProjectCreated}
            onClose={() => {
              setIsCreateDialogOpen(false);
              setEditingProjectId(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectList;