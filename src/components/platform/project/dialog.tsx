'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Plus, X } from 'lucide-react';
import ProjectCreateForm from './form';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { toast } from 'sonner';
import { deleteProject } from './actions';
import { Project } from './types';

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectToEdit?: Project;
  onProjectDeleted?: () => Promise<void>;
}

export function ProjectDialog({ open, onOpenChange, projectToEdit, onProjectDeleted }: ProjectDialogProps) {
  const handleDelete = async () => {
    if (!projectToEdit?._id) return;
    
    try {
      const result = await deleteProject(projectToEdit._id);
      if (result.success) {
        toast.success('Project deleted successfully');
        onOpenChange(false);
        if (onProjectDeleted) {
          await onProjectDeleted();
        }
      } else {
        toast.error(result.error || 'Failed to delete project');
      }
    } catch (error: any) {
      toast.error(error?.message || 'An unexpected error occurred');
    }
  };

  return (
    <>
      <Button 
        onClick={() => onOpenChange(true)} 
        className="flex items-center gap-2"
      >
        <Plus size={16} />
        Create Project
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-full h-screen p-0 overflow-hidden">
          <DialogClose asChild className="absolute right-4 top-4">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
          <VisuallyHidden>
            <DialogTitle>Create Project</DialogTitle>
          </VisuallyHidden>
          <ProjectCreateForm onSuccess={async () => { onOpenChange(false); }} />
        </DialogContent>
      </Dialog>
    </>
  );
} 