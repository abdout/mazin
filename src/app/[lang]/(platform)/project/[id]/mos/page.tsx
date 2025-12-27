import React from "react";
import Index from "@/components/platform/project/mos/index";
import Action from "@/components/platform/project/layout/action";
import { getProject } from "@/components/platform/project/actions";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function MOS({ params }: PageProps) {
  // Fetch project data using server action
  const result = await getProject(params.id);

  if (!result.success || !result.project) {
    return <div className="p-8 text-center">Project not found</div>;
  }

  const project = result.project;

  return (
    <div className="flex flex-col gap-8 mb-10">
      <Action projectTitle={project.customer || "Shipment"} />
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            CLEARANCE PROCEDURES
          </h1>
          <p className="text-muted-foreground mt-2">
            Standard Operating Procedures for Custom Clearance
          </p>
          {project.blAwbNumber && (
            <p className="text-sm text-muted-foreground mt-1">
              BL/AWB: {project.blAwbNumber}
            </p>
          )}
        </div>
        <Index params={params} />
      </div>
    </div>
  );
}
