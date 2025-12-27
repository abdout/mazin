'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Tag, AlertTriangle, CheckCircle2, AlertCircle, Trash2, FileText, BookOpen, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { getTask, deleteTask } from '@/components/platform/task/actions';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/components/platform/task/constant';
import { format } from 'date-fns';
import { toast } from 'sonner';
import TaskForm from '@/components/platform/task/form';
import Loading from '@/components/atom/loading';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

// Document content definitions
const docContent = {
  manuals: {
    title: "Manuals",
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
    title: "Method of Statement",
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
    title: "Reports",
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
};

const TaskDetail = () => {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const [docScale, setDocScale] = useState<number>(1);

  // Function to handle zoom controls
  const zoomIn = () => {
    setDocScale(prev => Math.min(prev + 0.1, 2)); // Maximum zoom: 2x
  };

  const zoomOut = () => {
    setDocScale(prev => Math.max(prev - 0.1, 0.5)); // Minimum zoom: 0.5x
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
        const taskId = params?.id as string;
        if (!taskId) return;
        
        const result = await getTask(taskId);
        
        if (result.error) {
          toast.error(result.error);
          return;
        }
        
        setTask(result.task);
      } catch (error) {
        console.error('Error fetching task details:', error);
        toast.error('Failed to load task details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTaskDetails();
  }, [params?.id]);

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
      
      toast.success('Task deleted successfully');
      router.push('/task');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSuccess = async () => {
    // Refresh task data
    const taskId = params?.id as string;
    if (!taskId) return Promise.resolve();
    
    const result = await getTask(taskId);
    if (!result.error) {
      setTask(result.task);
    }
    setShowEditForm(false);
    return Promise.resolve();
  };

  // Function to close the document dialog
  const closeDocDialog = () => {
    setActiveDoc(null);
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
          <h1 className="text-3xl text-primary">Task not found</h1>
          <Link href="/task" className="text-primary underline mt-4 block">
            Return to task list
          </Link>
        </div>
      </div>
    );
  }

  // Format date if it exists
  const formattedDate = task.date ? format(new Date(task.date), 'PPP') : 'Not set';
  
  // Get status and priority labels
  const statusLabel = TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS] || task.status;
  const priorityLabel = TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS] || task.priority;
  
  // Status colors
  const statusColors: Record<string, string> = {
    'pending': 'bg-gray-400',
    'stuck': 'bg-red-400',
    'in_progress': 'bg-blue-400',
    'done': 'bg-green-400'
  };
  
  // Priority colors
  const priorityColors: Record<string, string> = {
    'high': 'bg-red-400',
    'medium': 'bg-yellow-400',
    'low': 'bg-blue-400',
    'pending': 'bg-gray-400'
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
                Edit Task
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteTask}
                disabled={deleting}
                className="flex-1"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" onClick={handleBack} className="p-0 h-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>
          </div>
          
          <h1 className="text-4xl font-bold text-primary">{task.task}</h1>
          <h2 className="text-2xl text-muted-foreground mt-2">{task.project}</h2>
          
          <div className="mt-8 border-t border-primary/20 pt-6">
            <h3 className="text-xl text-primary font-semibold mb-3">Description</h3>
            <p className="text-muted-foreground">
              {task.desc || 'No description provided'}
            </p>
          </div>
          
          <div className="mt-8 border-t border-primary/20 pt-6">
            <h3 className="text-xl text-primary font-semibold mb-3">Details</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-1 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Duration
                </h4>
                <p className="text-muted-foreground">{task.duration || '0'} hours</p>
              </div>
              <div>
                <h4 className="font-medium mb-1 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Overtime
                </h4>
                <p className="text-muted-foreground">{task.overtime || '0'} hours</p>
              </div>
              <div>
                <h4 className="font-medium mb-1 flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  System
                </h4>
                <p className="text-muted-foreground">{task.tag || 'None'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Category
                </h4>
                <p className="text-muted-foreground">{task.label || 'None'}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 border-t border-primary/20 pt-6">
            <h3 className="text-xl text-primary font-semibold mb-3">
              <AlertTriangle className="h-5 w-5 inline-block mr-2" />
              Remarks
            </h3>
            <p className="text-muted-foreground">
              {task.remark || 'No remarks'}
            </p>
          </div>
          
          {task.linkedActivity && Object.values(task.linkedActivity).some(value => value) && (
            <div className="mt-8 border-t border-primary/20 pt-6">
              <h3 className="text-xl text-primary font-semibold mb-3">Linked Activities</h3>
              <div className="bg-muted rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {task.linkedActivity.projectId && (
                    <div>
                      <h4 className="text-sm font-medium">Project ID</h4>
                      <p className="text-muted-foreground">{task.linkedActivity.projectId}</p>
                    </div>
                  )}
                  {task.linkedActivity.system && (
                    <div>
                      <h4 className="text-sm font-medium">System</h4>
                      <p className="text-muted-foreground">{task.linkedActivity.system}</p>
                    </div>
                  )}
                  {task.linkedActivity.category && (
                    <div>
                      <h4 className="text-sm font-medium">Category</h4>
                      <p className="text-muted-foreground">{task.linkedActivity.category}</p>
                    </div>
                  )}
                  {task.linkedActivity.subcategory && (
                    <div>
                      <h4 className="text-sm font-medium">Subcategory</h4>
                      <p className="text-muted-foreground">{task.linkedActivity.subcategory}</p>
                    </div>
                  )}
                  {task.linkedActivity.activity && (
                    <div>
                      <h4 className="text-sm font-medium">Activity</h4>
                      <p className="text-muted-foreground">{task.linkedActivity.activity}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8 border-t border-primary/20 pt-6">
            <h3 className="text-xl text-primary font-semibold mb-3">Documentation</h3>
            <p className="text-muted-foreground mb-4">
              Reference materials, guides and reports for this task.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <button 
                onClick={() => setActiveDoc('manuals')}
                className="border border-primary/30 p-4 rounded-lg flex flex-col items-start text-left cursor-pointer hover:bg-primary/5 transition-colors"
              >
                <FileText className="h-6 w-6 text-primary mb-2" />
                <p className="text-primary text-sm font-medium">Manuals</p>
              </button>
              
              <button 
                onClick={() => setActiveDoc('mos')}
                className="border border-primary/30 p-4 rounded-lg flex flex-col items-start text-left cursor-pointer hover:bg-primary/5 transition-colors"
              >
                <BookOpen className="h-6 w-6 text-primary mb-2" />
                <p className="text-primary text-sm font-medium">MOS</p>
              </button>
              
              <button 
                onClick={() => setActiveDoc('reports')}
                className="border border-primary/30 p-4 rounded-lg flex flex-col items-start text-left cursor-pointer hover:bg-primary/5 transition-colors"
              >
                <FileSpreadsheet className="h-6 w-6 text-primary mb-2" />
                <p className="text-primary text-sm font-medium">Reports</p>
              </button>
            </div>
          </div>
          
          <div className="mt-8 border-t border-primary/20 pt-6">
            <h3 className="text-xl text-primary font-semibold mb-3">Team Members</h3>
            {task.assignedTo && task.assignedTo.length > 0 ? (
              <div className="space-y-3">
                {task.assignedTo.map((member: string, index: number) => (
                  <div key={index} className="flex items-center p-3 bg-muted rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 font-semibold">
                      {member.charAt(0).toUpperCase()}
                    </div>
                    <span>{member}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No team members assigned</p>
            )}
          </div>
          
          <div className="mt-8 pt-4 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <div>
                Created: {task.createdAt ? format(new Date(task.createdAt), 'PPP') : 'Unknown'}
              </div>
              <div>
                Last Updated: {task.updatedAt ? format(new Date(task.updatedAt), 'PPP') : 'Unknown'}
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
                  {docContent[activeDoc as keyof typeof docContent]?.title || 'Document'}
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

export default TaskDetail;