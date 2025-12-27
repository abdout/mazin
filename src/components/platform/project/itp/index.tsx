'use client';
import { useProject } from "@/provider/project";
import React, { useEffect, useRef } from "react";
import { SHIPMENT_TYPE_LABELS, clearanceStages } from "../constant";
import { ShipmentType } from "../types";

interface IndexProps {
  params: Params | Promise<Params>;
}

interface Params {
  id: string;
}

const Index: React.FC<IndexProps> = ({ params }) => {
  const unwrappedParams = params instanceof Promise ? React.use(params) : params;
  const id = unwrappedParams.id;

  const { project, fetchProject } = useProject();
  const loadedProjectId = useRef<string | null>(null);

  useEffect(() => {
    if (project && project._id === id && loadedProjectId.current === id) {
      return;
    }

    fetchProject(id);
    loadedProjectId.current = id;
  }, [id, fetchProject, project]);

  // Get selected shipment types from project
  const selectedTypes = (project?.systems || project?.shipmentTypes || []) as ShipmentType[];

  // Build document items from selected shipment types
  const documentItems = selectedTypes.map((type) => {
    const typeLabel = SHIPMENT_TYPE_LABELS[type] || type;
    const stages = clearanceStages[type]?.items || {} as Record<string, { activities: string[] }>;
    const stageNames = Object.keys(stages);

    return {
      type,
      label: `DOCUMENT CHECKLIST FOR ${typeLabel}`,
      stages: stageNames,
      taskCount: stageNames.reduce((count, stage) => {
        const stageData = stages[stage as keyof typeof stages] as { activities?: string[] } | undefined;
        return count + (stageData?.activities?.length || 0);
      }, 0)
    };
  });

  if (documentItems.length === 0) {
    return (
      <div className="w-3/4 mx-auto py-8 text-center text-muted-foreground">
        No shipment types selected for this project.
      </div>
    );
  }

  return (
    <div className="w-3/4 mx-auto space-y-8">
      {/* Table of Contents */}
      <table className="w-full border-collapse border border-black">
        <thead>
          <tr>
            <th className="border border-black text-center px-2 py-1 w-1/12">
              No.
            </th>
            <th className="border border-black text-center p-2">Document Category</th>
            <th className="border border-black text-center p-2 w-24">Tasks</th>
          </tr>
        </thead>
        <tbody>
          {documentItems.map((item, index) => (
            <tr key={index}>
              <td className="border border-black text-center p-2">
                {index + 1}
              </td>
              <td className="border border-black text-center p-2">
                {item.label}
              </td>
              <td className="border border-black text-center p-2">
                {item.taskCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Detailed Document Checklists */}
      {documentItems.map((item, typeIndex) => {
        const stages = clearanceStages[item.type]?.items || {};

        return (
          <div key={typeIndex} className="mt-8">
            <h2 className="text-xl font-bold mb-4 text-center">
              {typeIndex + 1}. {item.label}
            </h2>

            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 w-12 text-center">No.</th>
                  <th className="border border-black p-2">Stage / Task</th>
                  <th className="border border-black p-2 w-24 text-center">Status</th>
                  <th className="border border-black p-2 w-48 text-center">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stages).map(([stageName, stageData], stageIndex) => {
                  const activities = stageData?.activities || [];

                  return (
                    <React.Fragment key={stageIndex}>
                      {/* Stage Header */}
                      <tr className="bg-gray-50">
                        <td className="border border-black p-2 text-center font-semibold">
                          {stageIndex + 1}
                        </td>
                        <td className="border border-black p-2 font-semibold" colSpan={3}>
                          {stageName}
                        </td>
                      </tr>

                      {/* Stage Tasks */}
                      {activities.map((task, taskIndex) => (
                        <tr key={`${stageIndex}-${taskIndex}`}>
                          <td className="border border-black p-2 text-center text-xs">
                            {stageIndex + 1}.{taskIndex + 1}
                          </td>
                          <td className="border border-black p-2 pl-6">
                            {task}
                          </td>
                          <td className="border border-black p-2 text-center">
                            <span className="inline-block w-4 h-4 border border-gray-400"></span>
                          </td>
                          <td className="border border-black p-2"></td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default Index;
