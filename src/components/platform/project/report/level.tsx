"use client";
import React from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";

interface IndexProps {
  params: Params;
  project?: any; // Accept project as prop
}

interface Params {
  id: string;
}

const Level: React.FC<IndexProps> = ({ params, project }) => {
  const id = params.id;

  if (!project) {
    return null; // Don't render anything if the project data is not loaded yet
  }

  // Fallback if voltages is not available in project data
  const voltages = project.voltages || { EV: false, HV: false, MV: true, LV: true };
  
  const selectedVoltages = ["EV", "HV", "MV", "LV"].filter(
    (voltage) => voltages[voltage as keyof typeof voltages]
  );

  return (
    <div className="flex flex-col">
      {selectedVoltages.map((voltage) => (
        <Link
          href={`/project/${id}/report/${voltage.toLowerCase()}`}
          key={voltage}
          className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50"
        >
          <Icon icon={"ph:folder-simple-thin"} height="36" />
          <h2 className="mt-1">{voltage}</h2>
        </Link>
      ))}
    </div>
  );
};

export default Level;