"use client";
import Action from "@/components/platform/project/layout/action";
import { useEffect, useState } from "react";
import Info from "@/components/platform/project/detial/info";
import { getProject } from "@/components/platform/project/actions";
import React from "react";
import Loading from "@/components/atom/loading";
import { toast } from "sonner";
import { Project } from "@/components/platform/project/types";

interface Params {
  id: string;
}

const Detail = ({ params }: { params: Params | Promise<Params> }) => {
  console.log("Detail component rendering, params:", params);
  
  // Properly unwrap params using React.use() for Next.js 15
  const unwrappedParams = params instanceof Promise ? React.use(params) : params;
  console.log("Unwrapped params:", unwrappedParams);
  
  const id = unwrappedParams.id;
  console.log("Project ID:", id);
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        console.log("Fetching project with ID:", id);
        const result = await getProject(id);
        
        if (result.success && result.project) {
          // Map Prisma result to Project type (client object -> client string)
          const mappedProject: Project = {
            ...result.project,
            client: typeof result.project.client === 'object' && result.project.client !== null
              ? (result.project.client as { companyName?: string }).companyName
              : result.project.customer || undefined,
            activities: result.project.activities ?? undefined,
            tasks: result.project.tasks ?? undefined,
          } as Project;
          setProject(mappedProject);
        } else {
          setError(result.error || "Failed to load project");
          toast.error(result.error || "Failed to load project");
        }
      } catch (err) {
        console.error("Error fetching project:", err);
        setError("Failed to load project. Please try again.");
        toast.error("Failed to load project. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!project) {
    return <div className="p-4">Project not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <Action projectTitle={project.customer || "Shipment"} />
      <Info />
    </div>
  );
};

export default Detail;