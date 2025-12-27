'use client';

import Action from '@/components/platform/project/report/action';
import Level from '@/components/platform/project/report/level';
import { Project } from '@/components/platform/project/types';
import React from 'react';
import { usePDF } from 'react-to-pdf';

interface ReportClientProps {
  project: any; // Using any to avoid type issues with the server response
  id: string;
}

interface Params {
  id: string;
}

const ReportClient = ({ project, id }: ReportClientProps) => {
  const { toPDF, targetRef } = usePDF({
    filename: `${project?.customer} ITP.pdf`,
  });

  const params: Params = { id };
  
  return (
    <div>
      <Action projectTitle={project?.customer || ""} toPDF={toPDF} />
      <Level params={params} project={project} />
    </div>
  );
};

export default ReportClient; 