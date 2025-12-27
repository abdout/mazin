'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectFormSchema, type ProjectFormValues } from './validation';
import { createProject, updateProject } from './actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Form } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type ShipmentType, type StageWithType, type ProjectCreateFormProps } from './types';
import { GeneralTab } from './general';
import { ActivitiesTab } from './activities';
import { ResourcesTab } from './resources';
import { DescriptionTab } from './description';

// Shipment type options
const SHIPMENT_TYPES: ShipmentType[] = [
  'IMPORT_SEA_FCL',
  'IMPORT_SEA_LCL',
  'IMPORT_AIR',
  'IMPORT_LAND',
  'EXPORT_SEA',
  'EXPORT_AIR',
  'EXPORT_LAND',
  'TRANSIT',
  'RE_EXPORT'
];

// Initialize empty state for all shipment types
const initializeCategories = (): Record<ShipmentType, string[]> => {
  const result: Partial<Record<ShipmentType, string[]>> = {};
  SHIPMENT_TYPES.forEach(type => { result[type] = []; });
  return result as Record<ShipmentType, string[]>;
};

const initializeSubcategories = (): Record<ShipmentType, Record<string, string[]>> => {
  const result: Partial<Record<ShipmentType, Record<string, string[]>>> = {};
  SHIPMENT_TYPES.forEach(type => { result[type] = {}; });
  return result as Record<ShipmentType, Record<string, string[]>>;
};

export default function ProjectCreateForm({ projectToEdit, onSuccess, onClose }: ProjectCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSystems, setSelectedSystems] = useState<ShipmentType[]>([]);
  const [activeSystemTab, setActiveSystemTab] = useState<ShipmentType | null>(null);

  // Selected activities/stages
  const [selectedActivities, setSelectedActivities] = useState<StageWithType[]>(
    (projectToEdit?.activities as unknown as StageWithType[]) || []
  );

  // Track selected categories per shipment type
  const [selectedCategories, setSelectedCategories] = useState<Record<ShipmentType, string[]>>(initializeCategories());

  // Track selected subcategories per shipment type and category
  const [selectedSubcategories, setSelectedSubcategories] = useState<Record<ShipmentType, Record<string, string[]>>>(initializeSubcategories());

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      customer: projectToEdit?.customer || '',
      blAwbNumber: projectToEdit?.blAwbNumber || '',
      description: projectToEdit?.description || '',
      status: (projectToEdit?.status?.toLowerCase() as 'pending' | 'in_progress' | 'customs_hold' | 'released' | 'delivered') || 'pending',
      priority: (projectToEdit?.priority?.toLowerCase() as 'urgent' | 'high' | 'medium' | 'low') || 'medium',
      systems: projectToEdit?.systems || [],
      portOfOrigin: projectToEdit?.portOfOrigin || '',
      portOfDestination: projectToEdit?.portOfDestination || '',
      teamLead: projectToEdit?.teamLead || '',
      team: projectToEdit?.team || [],
      startDate: projectToEdit?.startDate || undefined,
      endDate: projectToEdit?.endDate || undefined,
    },
  });

  // Initialize selectedSystems from projectToEdit if available
  useEffect(() => {
    if (projectToEdit && projectToEdit.systems && projectToEdit.systems.length > 0) {
      const shipmentTypes = projectToEdit.systems.filter((sys): sys is ShipmentType =>
        SHIPMENT_TYPES.includes(sys as ShipmentType)
      );
      setSelectedSystems(shipmentTypes);

      if (shipmentTypes.length > 0) {
        setActiveSystemTab(shipmentTypes[0]);
      }
    }

    // Initialize categories and subcategories from project activities
    if (projectToEdit?.activities && projectToEdit.activities.length > 0) {
      const categoriesMap = initializeCategories();
      const subcategoriesMap = initializeSubcategories();

      projectToEdit.activities.forEach(activity => {
        const system = activity.system as ShipmentType;
        if (!system || !SHIPMENT_TYPES.includes(system)) return;

        const category = activity.category || '';
        const subcategory = activity.subcategory || '';

        // Add category if not already added
        if (category && !categoriesMap[system].includes(category)) {
          categoriesMap[system].push(category);
        }

        // Initialize subcategory array if needed
        if (category && !subcategoriesMap[system][category]) {
          subcategoriesMap[system][category] = [];
        }

        // Add subcategory if not already added
        if (category && subcategory && !subcategoriesMap[system][category].includes(subcategory)) {
          subcategoriesMap[system][category].push(subcategory);
        }
      });

      setSelectedCategories(categoriesMap);
      setSelectedSubcategories(subcategoriesMap);
    }
  }, [projectToEdit]);

  useEffect(() => {
    // When selected systems change, update the form value
    if (selectedSystems.length > 0) {
      form.setValue('systems', selectedSystems, { shouldValidate: false });
    }

    // If we have systems but no active tab, set the first system as active
    if (selectedSystems.length > 0 && !activeSystemTab) {
      setActiveSystemTab(selectedSystems[0]);
    } else if (selectedSystems.length === 0) {
      // If no systems are selected, clear the active tab
      setActiveSystemTab(null);
    } else if (!selectedSystems.includes(activeSystemTab as ShipmentType)) {
      // If the active tab is not in selected systems anymore, update active tab
      setActiveSystemTab(selectedSystems[0]);
    }
  }, [selectedSystems, activeSystemTab]);

  // Separate effect for form value updates
  useEffect(() => {
    if (selectedSystems.length > 0) {
      form.setValue('systems', selectedSystems, { shouldValidate: false });
    }
  }, [selectedSystems, form]);

  const onSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true);
    try {
      // Simplified project data matching validation schema
      const projectData = {
        customer: data.customer || '',
        blAwbNumber: data.blAwbNumber || '',
        description: data.description || '',
        status: data.status || 'pending',
        priority: data.priority || 'medium',
        systems: selectedSystems || [],
        portOfOrigin: data.portOfOrigin || '',
        portOfDestination: data.portOfDestination || '',
        teamLead: data.teamLead || '',
        team: data.team || [],
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
      };

      let result;

      if (projectToEdit && projectToEdit.id) {
        // Update existing project
        result = await updateProject(projectToEdit.id, projectData);
        if (result.success) {
          toast.success('Shipment updated successfully!');
        }
      } else {
        // Create new project
        result = await createProject(projectData);
        if (result.success) {
          toast.success('Shipment created successfully!');
        }
      }

      if (result.success) {
        // Reset form state
        form.reset();
        setSelectedSystems([]);
        setSelectedCategories(initializeCategories());
        setSelectedSubcategories(initializeSubcategories());
        setSelectedActivities([]);

        if (onSuccess) {
          await onSuccess();
        }
        if (onClose) {
          onClose();
        }
      } else {
        toast.error(result.error || 'Failed to save shipment');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('An error occurred while saving the shipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle system toggle
  const handleSystemToggle = useCallback((system: ShipmentType) => {
    setSelectedSystems(prev => {
      if (prev.includes(system)) {
        // If system is already selected, remove it and all its activities
        handleUnselectAllActivities(system, '*', null);
        // Clear selected categories for this system
        setSelectedCategories(prevCat => ({
          ...prevCat,
          [system]: []
        }));
        setSelectedSubcategories(prevSub => ({
          ...prevSub,
          [system]: {}
        }));
        return prev.filter(s => s !== system);
      } else {
        // If system is not yet selected, add it
        return [...prev, system];
      }
    });
  }, []);

  // Handle activity change
  const handleActivityChange = useCallback((system: ShipmentType, category: string, subcategory: string, activity: string, checked: boolean) => {
    setSelectedActivities(prev => {
      if (checked) {
        // Add the activity
        return [...prev, { shipmentType: system, stage: category, substage: subcategory, task: activity }];
      } else {
        // Remove the activity
        return prev.filter(a =>
          !(a.shipmentType === system &&
            a.stage === category &&
            a.substage === subcategory &&
            a.task === activity)
        );
      }
    });
  }, []);

  const handleSelectAllActivities = useCallback((system: ShipmentType, category: string, subcategory: string | null, activities: StageWithType[]) => {
    setSelectedActivities(prev => {
      // Remove existing activities for this category/subcategory
      const filteredPrev = prev.filter(a =>
        !(a.shipmentType === system &&
          a.stage === category &&
          (!subcategory || a.substage === subcategory))
      );

      // Add new activities
      return [...filteredPrev, ...activities];
    });
  }, []);

  const handleUnselectAllActivities = useCallback((system: ShipmentType, category: string, subcategory: string | null) => {
    setSelectedActivities(prev => {
      if (subcategory) {
        // Remove activities for specific subcategory
        return prev.filter(a =>
          !(a.shipmentType === system &&
            a.stage === category &&
            a.substage === subcategory)
        );
      } else {
        // Remove all activities for the category
        return prev.filter(a =>
          !(a.shipmentType === system && a.stage === category)
        );
      }
    });
  }, []);

  // Handle category toggle
  const handleCategoryToggle = useCallback((system: ShipmentType, category: string) => {
    const systemCategories = selectedCategories[system] || [];
    const isSelected = systemCategories.includes(category);

    // Update categories first
    setSelectedCategories(prev => ({
      ...prev,
      [system]: isSelected
        ? systemCategories.filter(c => c !== category)
        : [...systemCategories, category]
    }));

    // Update subcategories
    setSelectedSubcategories(prev => ({
      ...prev,
      [system]: {
        ...prev[system],
        [category]: isSelected ? [] : []
      }
    }));

    // Handle activities
    if (isSelected) {
      handleUnselectAllActivities(system, category, null);
    }
  }, [selectedCategories, handleUnselectAllActivities]);

  // Handle subcategory toggle
  const handleSubcategoryToggle = useCallback((system: ShipmentType, category: string, subcategory: string) => {
    setSelectedSubcategories(prev => {
      const categorySubcategories = prev[system]?.[category] || [];
      const isSelected = categorySubcategories.includes(subcategory);

      if (isSelected) {
        // Remove subcategory and filter out related activities
        handleUnselectAllActivities(system, category, subcategory);
      }

      return {
        ...prev,
        [system]: {
          ...prev[system],
          [category]: isSelected
            ? categorySubcategories.filter(s => s !== subcategory)
            : [...categorySubcategories, subcategory]
        }
      };
    });
  }, [handleUnselectAllActivities]);

  return (
    <ScrollArea className="h-full max-h-screen pr-4">
      <div className="container mx-auto py-8 px-10 max-w-5xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-16">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="mb-4 w-full justify-start">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="activities">Stages</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="description">Description</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-16">
                <GeneralTab control={form.control} />
              </TabsContent>

              <TabsContent value="activities" className="space-y-16">
                <ActivitiesTab
                  control={form.control}
                  selectedSystems={selectedSystems}
                  selectedActivities={selectedActivities}
                  selectedCategories={selectedCategories}
                  selectedSubcategories={selectedSubcategories}
                  activeSystemTab={activeSystemTab}
                  onSystemToggle={handleSystemToggle}
                  onActivityChange={handleActivityChange}
                  onSelectAllActivities={handleSelectAllActivities}
                  onUnselectAllActivities={handleUnselectAllActivities}
                  onCategoryToggle={handleCategoryToggle}
                  onSubcategoryToggle={handleSubcategoryToggle}
                  setActiveSystemTab={setActiveSystemTab}
                />
              </TabsContent>

              <TabsContent value="resources" className="space-y-16">
                <ResourcesTab control={form.control} />
              </TabsContent>

              <TabsContent value="description" className="space-y-16">
                <DescriptionTab control={form.control} />
              </TabsContent>
            </Tabs>

            {/* Submit Button */}
            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                className="w-full sm:w-auto px-8 py-6 rounded-md"
                disabled={isSubmitting}
                size="lg"
              >
                <Save className="mr-2 h-5 w-5" />
                {isSubmitting
                  ? (projectToEdit ? "Updating Shipment..." : "Creating Shipment...")
                  : (projectToEdit ? "Update Shipment" : "Create Shipment")
                }
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </ScrollArea>
  );
}
