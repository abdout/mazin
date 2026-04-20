'use client';

import React from "react";
import { usePDF } from "react-to-pdf";
import Action from "@/components/platform/project/layout/action";
import { Project } from "@/components/platform/project/types";

const teamMembers = [
  { image: '/team/eng/osman.png', lead: true },
  { image: '/team/eng/osman.png', lead: false },
  { image: '/team/eng/osman.png', lead: false },
  { image: '/team/eng/osman.png', lead: false },
];
const kit = [
  { image: '/kit/b10e.png' },
  { image: '/kit/ct.png' },
  { image: '/kit/delta4000.png'},
  { image: '/kit/dlro600.png'},
];

interface PlanClientProps {
  project: Pick<Project, 'customer'> | null | undefined;
}

const PlanClient = ({ project }: PlanClientProps) => {
  const { toPDF, targetRef } = usePDF({
    filename: `${project?.customer} Plan.pdf`,
  });

  return (
    <div className="flex flex-col gap-8 mb-10">
      <Action projectTitle={project?.customer || ""} toPDF={toPDF} />
      <div ref={targetRef} className="space-y-8">
        is
      </div>
    </div>
  );
};

export default PlanClient; 