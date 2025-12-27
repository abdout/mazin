import React from "react";
import Index from "@/components/platform/project/itp/index";
import Action from "@/components/platform/project/layout/action";
import { getProject } from "@/components/platform/project/actions";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ITP({ params }: PageProps) {
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
        <h1 className="text-2xl font-bold text-center">
          DOCUMENT CHECKLIST
        </h1>
        <p className="text-center text-muted-foreground">
          {project.blAwbNumber && `BL/AWB: ${project.blAwbNumber}`}
        </p>
        <Index params={params} />
      </div>
    </div>
  );
}
