'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { deleteTask } from './actions';
import { Task } from './type';

interface DeleteTaskProps {
  task: Task;
  onSuccess?: () => Promise<void>;
}

const DeleteTask = ({ task, onSuccess }: DeleteTaskProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    console.log('=== Client: Delete Task ===');
    console.log('Task to delete:', JSON.stringify(task, null, 2));
    
    // Use task.id (Prisma) if available, otherwise fall back to task._id (MongoDB)
    const taskId = task.id || task._id;
    
    if (!taskId) {
      console.error('Cannot delete task: No task ID provided');
      return;
    }
    
    try {
      console.log('Setting isDeleting to true');
      setIsDeleting(true);
      
      console.log('Calling deleteTask API with ID:', taskId);
      const result = await deleteTask(taskId);
      console.log('API response:', JSON.stringify(result, null, 2));
      
      if (result.error) {
        console.error('Error from API:', result.error);
        toast.error(result.error);
        return;
      }
      
      console.log('Task deletion successful');
      toast.success('Task deleted successfully');
      
      setIsOpen(false);
      if (onSuccess) {
        console.log('Calling onSuccess callback');
        await onSuccess();
      }
    } catch (error: any) {
      console.error('Exception in task deletion:', error);
      console.error('Error stack:', error.stack);
      toast.error(error.message || 'Failed to delete task');
    } finally {
      console.log('Setting isDeleting to false');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        data-action="no-navigate"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]" data-action="no-navigate">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="font-medium">{task.task}</p>
            {task.desc && <p className="text-sm text-muted-foreground mt-1">{task.desc}</p>}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              disabled={isDeleting}
              data-action="no-navigate"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={isDeleting}
              data-action="no-navigate"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeleteTask; 