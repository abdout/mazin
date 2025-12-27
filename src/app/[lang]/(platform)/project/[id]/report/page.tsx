import React from 'react';
import { getProject } from '@/components/platform/project/actions';
import ReportClient from './report-client';

interface Params {
  id: string;
}

const Report = async ({ params }: { params: Params }) => {
  const response = await getProject(params.id);
  const project = response.success ? response.project : null;
  
  return <ReportClient project={project} id={params.id} />;
}

export default Report;