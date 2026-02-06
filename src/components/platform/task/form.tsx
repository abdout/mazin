'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

import { TASK_STATUS, TASK_PRIORITY, TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from './constant';
import { taskFormSchema, TaskFormValues } from './validation';
import { TaskCreateFormProps } from './type';
import { createTask, updateTask, getTeamMembers } from './actions';
import { cn } from '@/lib/utils';
import { useDictionary } from '@/components/internationalization/use-dictionary';
import { useLocale } from '@/components/internationalization/use-locale';

interface Project {
  _id: string;
  id?: string;
  customer: string;
}

const TaskForm: React.FC<TaskCreateFormProps> = ({
  taskToEdit = null,
  onSuccess,
  onClose,
  dictionary: propDictionary,
  locale: propLocale
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);

  const hookDictionary = useDictionary();
  const { locale: hookLocale } = useLocale();

  const dictionary = propDictionary ?? hookDictionary;
  const locale = propLocale ?? hookLocale;

  const t = dictionary.task;
  const dateLocale = locale === 'ar' ? ar : enUS;

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoadingProjects(true);
        const response = await fetch('/api/project');
        if (!response.ok) {
          throw new Error(t?.fetchError || 'Failed to fetch projects');
        }

        const data = await response.json();
        if (data?.projects) {
          setProjects(data.projects);
        }
      } catch {
        toast.error(t?.fetchError || 'Failed to load projects. Please try again.');
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [t?.fetchError]);

  // Fetch team members from database
  useEffect(() => {
    getTeamMembers().then((result) => {
      if ("members" in result && result.members) {
        setTeamMembers(result.members);
      }
    });
  }, []);

  const TEAM_MEMBERS = teamMembers;

  const defaultValues: TaskFormValues = {
    project: taskToEdit?.project || '',
    task: taskToEdit?.task || '',
    status: 'pending',
    priority: 'medium',
    duration: taskToEdit?.duration || '4',
    desc: taskToEdit?.desc || '',
    label: '',
    date: taskToEdit?.date ? new Date(taskToEdit.date) : undefined,
    hours: taskToEdit?.hours || undefined,
    assignedTo: taskToEdit?.assignedTo || [],
  };

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues
  });

  const onSubmit = async (data: TaskFormValues) => {
    try {
      setIsSubmitting(true);

      let result;

      if (taskToEdit) {
        const taskId = taskToEdit.id || taskToEdit._id;
        if (!taskId) {
          toast.error(dictionary.common.error || 'Task ID is missing');
          return;
        }
        result = await updateTask(taskId, data);
      } else {
        result = await createTask(data);
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        taskToEdit
          ? (t?.taskUpdatedSuccess || 'Task updated successfully')
          : (t?.taskCreatedSuccess || 'Task created successfully')
      );

      if (onSuccess) {
        await onSuccess();
      }

      if (onClose) onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : (dictionary.common.error || 'Failed to save task');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get localized status options
  const getLocalizedStatusOptions = () => {
    return TASK_STATUS_OPTIONS.map(option => ({
      ...option,
      label: t?.statuses?.[option.value.toUpperCase() as keyof typeof t.statuses] || option.label
    }));
  };

  // Get localized priority options
  const getLocalizedPriorityOptions = () => {
    return TASK_PRIORITY_OPTIONS.map(option => ({
      ...option,
      label: t?.priorities?.[option.value.toUpperCase() as keyof typeof t.priorities] || option.label
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-background" data-action="no-navigate">
      <div className="flex h-full flex-col">
        {/* Close button in the corner */}
        <div className="absolute top-4 end-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (onClose) onClose();
            }}
            className="h-8 w-8"
            data-action="no-navigate"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className="container mx-auto py-8 px-10 max-w-5xl">
            <Form {...form}>
              <form onSubmit={(e) => {
                e.stopPropagation();
                form.handleSubmit(onSubmit)(e);
              }} className="space-y-16" data-action="no-navigate">
                {/* Basic Information Section */}
                <section>
                  <h2 className="text-xl font-semibold mb-6 pb-2 border-b">{t?.general || 'General'}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Project Field - Using dropdown for better UX */}
                    <FormField
                      control={form.control}
                      name="project"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-medium">{t?.project || 'Project'}</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between bg-muted/30",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={isLoadingProjects}
                                >
                                  {isLoadingProjects
                                    ? (t?.loadingProjects || "Loading projects...")
                                    : field.value
                                      ? field.value
                                      : (t?.selectProject || "Select project")}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                              <Command>
                                <CommandInput placeholder={t?.searchProjects || "Search projects..."} />
                                <CommandEmpty>{t?.noProjectFound || "No project found."}</CommandEmpty>
                                <CommandList>
                                  <CommandGroup>
                                    {projects.map((project) => (
                                      <CommandItem
                                        key={project._id}
                                        value={project.customer}
                                        onSelect={() => {
                                          form.setValue("project", project.customer);
                                        }}
                                      >
                                        {project.customer}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Task Name */}
                    <FormField
                      control={form.control}
                      name="task"
                      render={({ field }) => (
                        <FormItem className="md:col-span-3">
                          <FormLabel className="text-sm font-medium">{t?.taskName || 'Task Name'}</FormLabel>
                          <FormControl>
                            <Input placeholder={t?.enterTaskName || "Enter task name"} {...field} className="bg-muted/30" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                {/* Description Section */}
                <section>
                  <h2 className="text-xl font-semibold mb-6 pb-2 border-b">{t?.description || 'Description'}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    {/* Date Field - Moved to start of row */}
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-medium">{t?.date || 'Date'}</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full ps-3 text-start font-normal bg-muted/30",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: dateLocale })
                                  ) : (
                                    <span>{t?.pickDate || 'Pick a date'}</span>
                                  )}
                                  <CalendarIcon className="ms-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ?? undefined}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Status Field */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">{t?.status || 'Status'}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-muted/30">
                                <SelectValue placeholder={t?.selectStatus || "Select status"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getLocalizedStatusOptions().map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Priority Field */}
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">{t?.priority || 'Priority'}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-muted/30">
                                <SelectValue placeholder={t?.selectPriority || "Select priority"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getLocalizedPriorityOptions().map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Assigned To Field */}
                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">{t?.assignedTo || 'Assigned To'}</FormLabel>
                          <div className="space-y-3">
                            {field.value && field.value.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {field.value.map((memberId) => {
                                  const member = TEAM_MEMBERS.find(m => m.id === memberId);
                                  return (
                                    <Badge key={memberId} variant="secondary" className="px-3 py-1">
                                      {member?.name}
                                      <button
                                        type="button"
                                        className="ms-2 text-muted-foreground hover:text-foreground"
                                        onClick={() => {
                                          const newValue = field.value?.filter(id => id !== memberId) || [];
                                          form.setValue('assignedTo', newValue);
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    type="button"
                                    className="w-full justify-between bg-muted/30"
                                  >
                                    <span>{t?.assignTeamMembers || 'Assign team members'}</span>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[300px] p-0">
                                <Command>
                                  <CommandInput placeholder={t?.searchTeamMembers || "Search team members..."} />
                                  <CommandEmpty>{t?.noMemberFound || "No member found."}</CommandEmpty>
                                  <CommandList>
                                    <CommandGroup>
                                      {TEAM_MEMBERS
                                        .filter(member => !field.value?.includes(member.id))
                                        .map((member) => (
                                          <CommandItem
                                            key={member.id}
                                            value={member.name}
                                            onSelect={() => {
                                              const newValue = [...(field.value || []), member.id];
                                              form.setValue('assignedTo', newValue);
                                            }}
                                          >
                                            {member.name}
                                          </CommandItem>
                                        ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-6">
                    {/* Description Field */}
                    <FormField
                      control={form.control}
                      name="desc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">{t?.taskDescription || 'Task Description'}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t?.enterTaskDescription || "Enter task description"}
                              className="min-h-[150px] bg-muted/30"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                {/* Submit Button */}
                <div className="pt-4 flex justify-end">
                  <Button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-6 rounded-md"
                    disabled={isSubmitting}
                    size="lg"
                  >
                    <Save className="me-2 h-5 w-5" />
                    {isSubmitting
                      ? (taskToEdit ? (t?.updatingTask || "Updating Task...") : (t?.creatingTask || "Creating Task..."))
                      : (taskToEdit ? (t?.updateTask || "Update Task") : (t?.createTask || "Create Task"))
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default TaskForm;
