import { TASK_STATUS, TASK_PRIORITY } from './constant';
import { TaskStatus, TaskPriority } from '@prisma/client';

// Clearance Stage (replaces Activity)
export interface ClearanceStage {
  shipmentType: string;
  stage: string;
  substage: string;
  task: string;
}

// Legacy Activity for backward compatibility
export interface Activity {
  system: string;
  category: string;
  subcategory: string;
  activity: string;
}

export type TaskStatusType = typeof TASK_STATUS[keyof typeof TASK_STATUS];
export type TaskPriorityType = typeof TASK_PRIORITY[keyof typeof TASK_PRIORITY];

export interface Task {
  _id?: string;
  id?: string;
  project: string;
  task: string;
  club?: string;
  status: TaskStatus | TaskStatusType | string;
  priority: TaskPriority | TaskPriorityType | string;
  duration?: string;
  desc?: string;
  label?: string;
  tag?: string;
  remark?: string;
  date?: Date | null;
  hours?: number | null;
  overtime?: number | null;
  projectId?: string | null;
  // New: Linked Stage for custom clearance
  linkedStage?: {
    projectId: string;
    shipmentType: string;
    stage: string;
    substage: string;
    task: string;
  } | null;
  // Legacy: Linked Activity for backward compatibility
  linkedActivity?: {
    projectId: string;
    system: string;
    category: string;
    subcategory: string;
    activity: string;
  } | null;
  assignedTo?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaskCreateFormProps {
  taskToEdit?: Task | null;
  onSuccess?: () => Promise<void>;
  onClose?: () => void;
}

export interface TaskContextProps {
  task: Task | null;
  tasks: Task[];
  fetchTask: (id: string) => void;
  fetchTasks: () => void;
  refreshTasks: () => void;
  deleteTask: (id: string) => void;
  createTask: (data: Task) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
}
