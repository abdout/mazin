import ProjectList from "@/components/platform/project/content";
import React from "react";

const Project = () => {
  return (
    <div className="container mx-auto px-4 py-4">
      {/* <div className="-mt-4 mb-6">
        <h1 className="text-4xl font-heading">Project</h1>
        <p className="text-muted-foreground">Manage. track.</p>
      </div> */}
      <ProjectList />
    </div>
  );
};

export default Project;
