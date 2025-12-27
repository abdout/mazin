"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

interface ActionProps {
  projectTitle: string;
  toPDF?: () => void;
}

interface ActionButtonProps {
  label: string;
  onClick?: () => void;
}

const ActionButton = ({ 
  label, 
  onClick 
}: ActionButtonProps) => (
  <button
    onClick={onClick}
    className="inline-flex items-center justify-center h-9 w-24 rounded-md px-3 py-2 text-xs font-normal border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50"
    aria-label={label}
  >
    <span>{label}</span>
  </button>
);

const Action: React.FC<ActionProps> = ({ projectTitle, toPDF }) => {
  const pathname = usePathname();
  const projectId = pathname.split("/")[2];

  // Determine current section from pathname
  const getStatement = () => {
    if (pathname.includes(`${projectId}/report/mv/cable/pd`)) return "Partial Discharge";
    if (pathname.includes(`${projectId}/report/mv/cable`)) return "MV Cable";
    if (pathname.includes(`${projectId}/report/mv`)) return "Medium Voltage";
    if (pathname.includes(`${projectId}/report`)) return "Report";
    if (pathname.includes(`${projectId}/mos`)) return "MOS";
    if (pathname.includes(`${projectId}/itp`)) return "ITP";
    if (pathname.includes(`${projectId}`)) return "Detail";
    return "";
  };

  return (
    <div className=" pt-3 pb-5 px-5">
      <div className="flex items-center gap-5 mb-6">
        <Image src="/customer/rtcc.png" alt="RTCC" width={65} height={65} className="rounded-md" />
        
        <div className="space-y-1 -mt-1 ">
          <h1 className="text-4xl font-heading leading-tight -mt-1">
            {projectTitle} <span >{getStatement()}</span>
          </h1>
          
          <div className="flex items-center  text-sm text-muted-foreground">
            <span>Last update 14 Feb</span>
            <span className="mx-2 w-1 h-1 rounded-full bg-muted-foreground"></span>
            <span>7 min read</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4">
        <ActionButton 
          label="Approve" 
        />
        <ActionButton 
          label="Edit" 
        />
        <ActionButton 
          label="Send" 
        />
        <ActionButton 
          label="Download" 
          onClick={toPDF} 
        />
      </div>
      <hr className="pt-2 mt-6 h-[1px] border-muted" />
    </div>
  );
};

export default Action;
