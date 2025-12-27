'use client';

import React from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock, User2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Task } from './type';
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from './constant';

interface TaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const handleClick = () => {
    if (onClick) onClick(task);
  };
  
  const statusLabel = TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS] || task.status;
  const priorityLabel = TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS] || task.priority;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'to_do':
        return 'bg-gray-500 hover:bg-gray-600';
      case 'in_progress':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'done':
        return 'bg-green-500 hover:bg-green-600';
      case 'cancelled':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 hover:bg-red-600';
      case 'medium':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{task.task}</CardTitle>
          <Badge variant="outline" className={getStatusColor(task.status)}>
            {statusLabel}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Project: {task.project}
        </div>
      </CardHeader>
      <CardContent>
        {task.desc && (
          <div className="mb-3 text-sm">
            {task.desc.length > 100 ? `${task.desc.substring(0, 100)}...` : task.desc}
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 mt-2">
          {task.priority && (
            <Badge className={getPriorityColor(task.priority)}>
              {priorityLabel}
            </Badge>
          )}
          
          {task.date && (
            <Badge variant="outline" className="flex gap-1 items-center">
              <CalendarIcon className="h-3 w-3" />
              {format(new Date(task.date), 'MMM dd, yyyy')}
            </Badge>
          )}
          
          {task.duration && (
            <Badge variant="outline" className="flex gap-1 items-center">
              <Clock className="h-3 w-3" />
              {task.duration}
            </Badge>
          )}
          
          {task.assignedTo && task.assignedTo.length > 0 && (
            <Badge variant="outline" className="flex gap-1 items-center">
              <User2 className="h-3 w-3" />
              {task.assignedTo.length} assigned
            </Badge>
          )}
          
          {task.tag && (
            <Badge variant="secondary">
              {task.tag}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard; 