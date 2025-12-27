import React from 'react';
import { getProject } from '@/components/platform/project/actions';
import PlanClient from './plan-client';

interface Params {
  id: string;
}

const Plan = async ({ params }: { params: Params }) => {
  const response = await getProject(params.id);
  const project = response.success ? response.project : null;
  
  return <PlanClient project={project} />;
};

export default Plan;
