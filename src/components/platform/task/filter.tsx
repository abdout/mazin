import { useEffect, useState } from 'react';
import { getTasks } from './actions';
import { Task } from './type';
import { TASK_STATUS, TASK_PRIORITY } from './constant';

interface FilterOption {
    label: string;
    value: string;
}

const getUniqueValues = (tasks: Task[], property: keyof Task) => {
    if (property === 'task') {
      return [];
    }
  
    const values = tasks.map(task => task[property]);
    return Array.from(new Set(values)).map(value => ({ label: value as string, value: value as string }));
};

// Default values for status and priority when no tasks are available
const getDefaultOptions = (property: keyof Task): FilterOption[] => {
  if (property === 'status') {
    return [
      { label: 'Pending', value: TASK_STATUS.PENDING },
      { label: 'Stuck', value: TASK_STATUS.STUCK },
      { label: 'In Progress', value: TASK_STATUS.IN_PROGRESS },
      { label: 'Done', value: TASK_STATUS.DONE }
    ];
  }
  
  if (property === 'priority') {
    return [
      { label: 'Low', value: TASK_PRIORITY.LOW },
      { label: 'Medium', value: TASK_PRIORITY.MEDIUM },
      { label: 'High', value: TASK_PRIORITY.HIGH },
      { label: 'Urgent', value: TASK_PRIORITY.URGENT }
    ];
  }
  
  return [];
};

export const useFilter = (property: keyof Task): FilterOption[] => {
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>(getDefaultOptions(property));
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    async function fetchTasks() {
      const result = await getTasks();
      if (result.success && result.tasks) {
        setTasks(result.tasks);
      }
    }
    
    fetchTasks();
  }, []);

  useEffect(() => {
    const uniqueValues = getUniqueValues(tasks, property);
    if (uniqueValues.length > 0) {
      setFilterOptions(uniqueValues);
    } else {
      // If no values are found in tasks, use defaults
      setFilterOptions(getDefaultOptions(property));
    }
  }, [tasks, property]);

  return filterOptions;
};