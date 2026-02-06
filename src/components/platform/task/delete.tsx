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
import type { Dictionary } from "@/components/internationalization";
import { useDictionary } from "@/components/internationalization/use-dictionary";

export interface DeleteTaskProps {
  task: Task;
  onSuccess?: () => Promise<void>;
  dictionary?: Dictionary;
}

const DeleteTask = ({ task, onSuccess, dictionary: propDictionary }: DeleteTaskProps) => {
  const hookDictionary = useDictionary();
  const dictionary = propDictionary ?? hookDictionary;

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const t = dictionary.task;

  const handleDelete = async () => {
    // Use task.id (Prisma) if available, otherwise fall back to task._id (MongoDB)
    const taskId = task.id || task._id;

    if (!taskId) {
      console.error('Cannot delete task: No task ID provided');
      return;
    }

    try {
      setIsDeleting(true);

      const result = await deleteTask(taskId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(t?.taskDeletedSuccess || 'Task deleted successfully');

      setIsOpen(false);
      if (onSuccess) {
        await onSuccess();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : (dictionary.common.error || 'Failed to delete task');
      toast.error(message);
    } finally {
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
        title={dictionary.common.delete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]" data-action="no-navigate">
          <DialogHeader>
            <DialogTitle>{t?.deleteTask || 'Delete Task'}</DialogTitle>
            <DialogDescription>
              {t?.deleteConfirmation || 'Are you sure you want to delete this task? This action cannot be undone.'}
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
              {dictionary.common.cancel}
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
              {isDeleting ? (t?.deleting || 'Deleting...') : dictionary.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeleteTask;
