import { useState, useCallback } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { type Control } from "react-hook-form";
import { type ProjectFormValues } from "./validation";
import { clearanceStages, SHIPMENT_TYPE_LABELS } from "./constant";
import { type ShipmentType, type StageWithType } from "./types";
import { cn } from "@/lib/utils";

// Type definitions
interface StageActivities {
  activities: string[];
}

interface ShipmentStages {
  items: {
    [key: string]: StageActivities;
  };
}

interface ActivitiesTabProps {
  control: Control<ProjectFormValues>;
  selectedSystems: ShipmentType[];
  selectedActivities: StageWithType[];
  selectedCategories: Record<ShipmentType, string[]>;
  selectedSubcategories: Record<ShipmentType, Record<string, string[]>>;
  activeSystemTab: ShipmentType | null;
  onSystemToggle: (system: ShipmentType) => void;
  onActivityChange: (system: ShipmentType, category: string, subcategory: string, activity: string, checked: boolean) => void;
  onSelectAllActivities: (system: ShipmentType, category: string, subcategory: string | null, activities: StageWithType[]) => void;
  onUnselectAllActivities: (system: ShipmentType, category: string, subcategory: string | null) => void;
  onCategoryToggle: (system: ShipmentType, category: string) => void;
  onSubcategoryToggle: (system: ShipmentType, category: string, subcategory: string) => void;
  setActiveSystemTab: (system: ShipmentType | null) => void;
}

export function ActivitiesTab({
  control,
  selectedSystems,
  selectedActivities,
  selectedCategories,
  selectedSubcategories,
  activeSystemTab,
  onSystemToggle,
  onActivityChange,
  onSelectAllActivities,
  onUnselectAllActivities,
  onCategoryToggle,
  onSubcategoryToggle,
  setActiveSystemTab
}: ActivitiesTabProps) {
  const shipmentTypeOptions: ShipmentType[] = [
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

  return (
    <section>
      <h2 className="text-xl font-semibold mb-6 pb-2 border-b">Clearance Stages</h2>
      <div className="rounded-lg bg-muted/20">
        {/* Shipment Type Selection */}
        <div className="space-y-4 mb-4">
          <FormLabel className="text-sm font-medium">Shipment Types</FormLabel>
          <FormMessage>{control._formState.errors.systems?.message}</FormMessage>
          <div className="flex flex-wrap gap-4">
            {shipmentTypeOptions.map((shipmentType) => (
              <Button
                key={shipmentType}
                type="button"
                variant="outline"
                className={cn(
                  "transition-opacity text-xs px-2 py-1",
                  selectedSystems.includes(shipmentType)
                    ? "opacity-100 border-primary bg-primary/10"
                    : "opacity-70 hover:opacity-100"
                )}
                onClick={() => onSystemToggle(shipmentType)}
              >
                {SHIPMENT_TYPE_LABELS[shipmentType]}
              </Button>
            ))}
          </div>
        </div>

        {/* Stages Selection - shown only if shipment types are selected */}
        {selectedSystems.length > 0 && (
          <div className="space-y-4 pt-4">
            <FormLabel className="text-sm font-medium">Clearance Tasks</FormLabel>

            <Tabs
              value={activeSystemTab || undefined}
              onValueChange={(value) => setActiveSystemTab(value as ShipmentType)}
              className="w-full"
            >
              <TabsList className="mb-4 w-full justify-start overflow-auto">
                {selectedSystems.map((shipmentType) => (
                  <TabsTrigger key={shipmentType} value={shipmentType}>
                    {SHIPMENT_TYPE_LABELS[shipmentType]}
                  </TabsTrigger>
                ))}
              </TabsList>

              {selectedSystems.map((shipmentType) => {
                const stages = clearanceStages[shipmentType];
                if (!stages) return null;

                return (
                  <TabsContent key={shipmentType} value={shipmentType} className="mt-2">
                    {/* Stage Selection */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium mb-2">Select Clearance Stages:</h3>
                      <div className="flex flex-wrap gap-3">
                        {Object.keys(stages.items).map((stage) => (
                          <div
                            key={`${shipmentType}-stage-${stage}`}
                            className={cn(
                              "flex items-center px-3 py-1.5 rounded-md space-x-2 cursor-pointer transition-colors",
                              selectedCategories[shipmentType]?.includes(stage)
                                ? "bg-primary/20 border border-primary/50"
                                : "bg-muted/50 hover:bg-muted/80"
                            )}
                            onClick={() => onCategoryToggle(shipmentType, stage)}
                          >
                            <label
                              className="text-sm font-medium cursor-pointer w-full"
                            >
                              {stage}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Only show stages that are selected */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(stages.items)
                        .filter(([stage]) => selectedCategories[shipmentType]?.includes(stage))
                        .map(([stage, stageData]: [string, { activities: string[] }]) => (
                          <Accordion
                            key={`${shipmentType}-${stage}-accordion`}
                            type="multiple"
                            className="w-full"
                          >
                            <AccordionItem
                              value={`${shipmentType}-${stage}`}
                              className="border-b border-muted/60"
                            >
                              <AccordionTrigger className="font-semibold hover:bg-muted/20 px-4 rounded-md">
                                {stage}
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const newActivities: StageWithType[] = [];
                                        (stageData.activities || []).forEach((task: string) => {
                                          newActivities.push({
                                            shipmentType,
                                            stage,
                                            substage: stage,
                                            task
                                          });
                                        });
                                        onSelectAllActivities(shipmentType, stage, null, newActivities);
                                      }}
                                      className="text-xs"
                                    >
                                      Select All
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onUnselectAllActivities(shipmentType, stage, null);
                                      }}
                                      className="text-xs"
                                    >
                                      Unselect All
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-1 gap-2">
                                    {(stageData.activities || []).map((task: string) => {
                                      const isSelected = selectedActivities.some(
                                        a => a.shipmentType === shipmentType &&
                                          a.stage === stage &&
                                          a.substage === stage &&
                                          a.task === task
                                      );
                                      return (
                                        <div
                                          key={`${shipmentType}-${stage}-${task}`}
                                          className={cn(
                                            "flex items-center px-3 py-1.5 rounded-md",
                                            isSelected ? "bg-primary/20" : "bg-muted/50 hover:bg-muted/80"
                                          )}
                                        >
                                          <div className="flex items-center w-full">
                                            <Checkbox
                                              id={`${shipmentType}-${stage}-${task}`}
                                              checked={isSelected}
                                              onCheckedChange={(checked) => {
                                                onActivityChange(
                                                  shipmentType,
                                                  stage,
                                                  stage,
                                                  task,
                                                  !!checked
                                                );
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                              className="mr-2"
                                            />
                                            <label
                                              htmlFor={`${shipmentType}-${stage}-${task}`}
                                              className="text-sm cursor-pointer flex-1"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              {task}
                                            </label>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        ))}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        )}
      </div>
    </section>
  );
}
