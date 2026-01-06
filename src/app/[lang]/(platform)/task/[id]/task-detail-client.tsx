'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Tag, AlertTriangle, CheckCircle2, FileText, BookOpen, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getTask, deleteTask } from '@/components/platform/task/actions';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import TaskForm from '@/components/platform/task/form';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import type { Locale } from '@/components/internationalization';

interface TaskDetailClientProps {
  taskId: string;
  locale: Locale;
  dictionary: Record<string, any>;
}

// Document content definitions
const getDocContent = (dict: Record<string, any>) => ({
  manuals: {
    title: dict.task?.docs?.manuals ?? "Manuals",
    content: (scale: number) => (
      <div className="w-full h-full bg-background/5 overflow-hidden">
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'center', width: '100%', height: '100%' }}>
          <iframe
            src="/docs/fake.pdf#toolbar=0&navpanes=0&statusbar=0"
            className="w-full h-full"
            frameBorder="0"
          />
        </div>
      </div>
    )
  },
  mos: {
    title: dict.task?.docs?.mos ?? "Method of Statement",
    content: (scale: number) => (
      <div className="w-full h-full bg-background/5 overflow-hidden">
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'center', width: '100%', height: '100%' }}>
          <iframe
            src="/docs/fake.pdf#toolbar=0&navpanes=0&statusbar=0"
            className="w-full h-full"
            frameBorder="0"
          />
        </div>
      </div>
    )
  },
  reports: {
    title: dict.task?.docs?.reports ?? "Reports",
    content: (scale: number) => (
      <div className="w-full h-full bg-background/5 overflow-hidden">
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'center', width: '100%', height: '100%' }}>
          <iframe
            src="/docs/fake.pdf#toolbar=0&navpanes=0&statusbar=0"
            className="w-full h-full"
            frameBorder="0"
          />
        </div>
      </div>
    )
  }
});

const TaskDetailClient = ({ taskId, locale, dictionary }: TaskDetailClientProps) => {
  const router = useRouter();
  const isRTL = locale === 'ar';
  const dateLocale = isRTL ? ar : enUS;
  const dict = dictionary;
  const t = dict.task ?? {};
  const common = dict.common ?? {};

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const [docScale, setDocScale] = useState<number>(1);

  const docContent = getDocContent(dict);

  // Function to handle zoom controls
  const zoomIn = () => {
    setDocScale(prev => Math.min(prev + 0.1, 2));
  };

  const zoomOut = () => {
    setDocScale(prev => Math.max(prev - 0.1, 0.5));
  };

  // Reset zoom level when closing or changing document
  useEffect(() => {
    if (activeDoc) {
      setDocScale(1);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [activeDoc]);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        if (!taskId) return;

        const result = await getTask(taskId);

        if (result.error) {
          toast.error(result.error);
          return;
        }

        setTask(result.task);
      } catch (error) {
        console.error('Error fetching task details:', error);
        toast.error(t.fetchError ?? 'Failed to load task details');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId, t.fetchError]);

  const handleBack = () => {
    router.back();
  };

  const handleDeleteTask = async () => {
    if (!task?._id) return;

    try {
      setDeleting(true);
      const result = await deleteTask(task._id);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(t.deleteSuccess ?? 'Task deleted successfully');
      router.push(`/${locale}/task`);
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error(t.deleteError ?? 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSuccess = async () => {
    if (!taskId) return Promise.resolve();

    const result = await getTask(taskId);
    if (!result.error) {
      setTask(result.task);
    }
    setShowEditForm(false);
    return Promise.resolve();
  };

  const closeDocDialog = () => {
    setActiveDoc(null);
  };

  // Get localized status label
  const getStatusLabel = (status: string) => {
    const statusKey = status?.toUpperCase();
    return t.statuses?.[statusKey] ?? status;
  };

  // Get localized priority label
  const getPriorityLabel = (priority: string) => {
    const priorityKey = priority?.toUpperCase();
    return t.priorities?.[priorityKey] ?? priority;
  };

  if (loading) {
    return (
      <div className="container px-8 py-28 bg-background min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-3"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container py-20 bg-background min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl text-primary">{t.notFound ?? 'Task not found'}</h1>
          <Link href={`/${locale}/task`} className="text-primary underline mt-4 block">
            {t.returnToList ?? 'Return to task list'}
          </Link>
        </div>
      </div>
    );
  }

  // Format date with locale
  const formattedDate = task.date
    ? format(new Date(task.date), 'PPP', { locale: dateLocale })
    : (t.notSet ?? 'Not set');

  // Get status and priority labels
  const statusLabel = getStatusLabel(task.status);
  const priorityLabel = getPriorityLabel(task.priority);

  // Status colors
  const statusColors: Record<string, string> = {
    'pending': 'bg-gray-400',
    'stuck': 'bg-red-400',
    'in_progress': 'bg-blue-400',
    'done': 'bg-green-400'
  };

  // Priority colors
  const priorityColors: Record<string, string> = {
    'urgent': 'bg-red-500',
    'high': 'bg-red-400',
    'medium': 'bg-yellow-400',
    'low': 'bg-blue-400',
    'neutral': 'bg-gray-400'
  };

  return (
    <div className="container px-8 py-28 bg-background min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Left sidebar with image and actions */}
        <div className="flex flex-col justify-start items-start pt-0">
          <div className="bg-primary/5 rounded-xl p-6 w-full flex justify-center items-center" style={{ height: '200px' }}>
            <div className={`flex items-center justify-center h-16 w-16 rounded-full ${statusColors[task.status] || 'bg-gray-400'}`}>
              <span className="text-white text-xl font-bold">{task.task.charAt(0).toUpperCase()}</span>
            </div>
          </div>

          <div className="w-full mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <Badge className={`${statusColors[task.status] || 'bg-gray-400'} text-white`}>
                {statusLabel}
              </Badge>
              <Badge className={`${priorityColors[task.priority] || 'bg-gray-400'} text-white`}>
                {priorityLabel}
              </Badge>
            </div>

            <p className="text-xl mt-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </p>

            <div className="flex items-center gap-4 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEditForm(true)}
                className="flex-1"
              >
                {t.editTask ?? common.edit ?? 'Edit Task'}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteTask}
                disabled={deleting}
                className="flex-1"
              >
                {deleting ? (common.loading ?? 'Deleting...') : (common.delete ?? 'Delete')}
              </Button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="md:col-span-2">
          <h1 className="text-4xl font-bold">{task.task}</h1>
          <h2 className="text-2xl text-muted-foreground mt-2">{task.project}</h2>

          <div className="mt-8 border-t border-primary/20 pt-6">
            <h3 className="text-xl text-primary font-semibold mb-3">{t.description ?? 'Description'}</h3>
            <p className="text-muted-foreground">
              {task.desc || (t.noDescription ?? 'No description provided')}
            </p>
          </div>

          <div className="mt-8 border-t border-primary/20 pt-6">
            <h3 className="text-xl text-primary font-semibold mb-3">{t.details ?? 'Details'}</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-1 flex items-center">
                  <Clock className="h-4 w-4 me-2" />
                  {t.duration ?? 'Duration'}
                </h4>
                <p className="text-muted-foreground">{task.duration || '0'} {t.hours ?? 'hours'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1 flex items-center">
                  <Clock className="h-4 w-4 me-2" />
                  {t.overtime ?? 'Overtime'}
                </h4>
                <p className="text-muted-foreground">{task.overtime || '0'} {t.hours ?? 'hours'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1 flex items-center">
                  <Tag className="h-4 w-4 me-2" />
                  {t.system ?? 'System'}
                </h4>
                <p className="text-muted-foreground">{task.tag || (common.none ?? 'None')}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1 flex items-center">
                  <CheckCircle2 className="h-4 w-4 me-2" />
                  {t.category ?? 'Category'}
                </h4>
                <p className="text-muted-foreground">{task.label || (common.none ?? 'None')}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-primary/20 pt-6">
            <h3 className="text-xl text-primary font-semibold mb-3">
              <AlertTriangle className="h-5 w-5 inline-block me-2" />
              {t.remarks ?? 'Remarks'}
            </h3>
            <p className="text-muted-foreground">
              {task.remark || (t.noRemarks ?? 'No remarks')}
            </p>
          </div>

          {task.linkedActivity && Object.values(task.linkedActivity).some(value => value) && (
            <div className="mt-8 border-t border-primary/20 pt-6">
              <h3 className="text-xl text-primary font-semibold mb-3">{t.linkedActivities ?? 'Linked Activities'}</h3>
              <div className="bg-muted rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {task.linkedActivity.projectId && (
                    <div>
                      <h4 className="text-sm font-medium">{t.projectRef ?? 'Project ID'}</h4>
                      <p className="text-muted-foreground">{task.linkedActivity.projectId}</p>
                    </div>
                  )}
                  {task.linkedActivity.system && (
                    <div>
                      <h4 className="text-sm font-medium">{t.system ?? 'System'}</h4>
                      <p className="text-muted-foreground">{task.linkedActivity.system}</p>
                    </div>
                  )}
                  {task.linkedActivity.category && (
                    <div>
                      <h4 className="text-sm font-medium">{t.category ?? 'Category'}</h4>
                      <p className="text-muted-foreground">{task.linkedActivity.category}</p>
                    </div>
                  )}
                  {task.linkedActivity.subcategory && (
                    <div>
                      <h4 className="text-sm font-medium">{t.subcategory ?? 'Subcategory'}</h4>
                      <p className="text-muted-foreground">{task.linkedActivity.subcategory}</p>
                    </div>
                  )}
                  {task.linkedActivity.activity && (
                    <div>
                      <h4 className="text-sm font-medium">{t.activity ?? 'Activity'}</h4>
                      <p className="text-muted-foreground">{task.linkedActivity.activity}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 border-t border-primary/20 pt-6">
            <h3 className="text-xl text-primary font-semibold mb-3">{t.documentation ?? 'Documentation'}</h3>
            <p className="text-muted-foreground mb-4">
              {t.documentationDesc ?? 'Reference materials, guides and reports for this task.'}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <button
                onClick={() => setActiveDoc('manuals')}
                className="border border-primary/30 p-4 rounded-lg flex flex-col items-start text-start cursor-pointer hover:bg-primary/5 transition-colors"
              >
                <FileText className="h-6 w-6 text-primary mb-2" />
                <p className="text-primary text-sm font-medium">{t.docs?.manuals ?? 'Manuals'}</p>
              </button>

              <button
                onClick={() => setActiveDoc('mos')}
                className="border border-primary/30 p-4 rounded-lg flex flex-col items-start text-start cursor-pointer hover:bg-primary/5 transition-colors"
              >
                <BookOpen className="h-6 w-6 text-primary mb-2" />
                <p className="text-primary text-sm font-medium">{t.docs?.mos ?? 'MOS'}</p>
              </button>

              <button
                onClick={() => setActiveDoc('reports')}
                className="border border-primary/30 p-4 rounded-lg flex flex-col items-start text-start cursor-pointer hover:bg-primary/5 transition-colors"
              >
                <FileSpreadsheet className="h-6 w-6 text-primary mb-2" />
                <p className="text-primary text-sm font-medium">{t.docs?.reports ?? 'Reports'}</p>
              </button>
            </div>
          </div>

          <div className="mt-8 border-t border-primary/20 pt-6">
            <h3 className="text-xl text-primary font-semibold mb-3">{t.team ?? 'Team Members'}</h3>
            {task.assignedTo && task.assignedTo.length > 0 ? (
              <div className="space-y-3">
                {task.assignedTo.map((member: string, index: number) => (
                  <div key={index} className="flex items-center p-3 bg-muted rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center me-3 font-semibold">
                      {member.charAt(0).toUpperCase()}
                    </div>
                    <span>{member}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">{t.noTeamMembers ?? 'No team members assigned'}</p>
            )}
          </div>

          <div className="mt-8 pt-4 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <div>
                {common.createdAt ?? 'Created'}: {task.createdAt ? format(new Date(task.createdAt), 'PPP', { locale: dateLocale }) : (t.unknown ?? 'Unknown')}
              </div>
              <div>
                {t.lastUpdated ?? 'Last Updated'}: {task.updatedAt ? format(new Date(task.updatedAt), 'PPP', { locale: dateLocale }) : (t.unknown ?? 'Unknown')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Dialog */}
      <AnimatePresence>
        {activeDoc && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50"
              onClick={closeDocDialog}
            />

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed inset-4 md:inset-10 bg-background z-50 rounded-lg overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-primary/20 flex justify-between items-center">
                <h3 className="text-xl text-primary font-semibold">
                  {docContent[activeDoc as keyof typeof docContent]?.title || (t.document ?? 'Document')}
                </h3>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={zoomOut}
                      className="p-1 rounded-full hover:bg-muted"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                      </svg>
                    </button>

                    <span className="text-sm text-primary">{Math.round(docScale * 100)}%</span>

                    <button
                      onClick={zoomIn}
                      className="p-1 rounded-full hover:bg-muted"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  </div>

                  <button
                    onClick={closeDocDialog}
                    className="p-1 rounded-full hover:bg-muted"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                {docContent[activeDoc as keyof typeof docContent]?.content(docScale)}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Form Dialog */}
      {showEditForm && (
        <TaskForm
          taskToEdit={task}
          onSuccess={handleEditSuccess}
          onClose={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
};

export default TaskDetailClient;
