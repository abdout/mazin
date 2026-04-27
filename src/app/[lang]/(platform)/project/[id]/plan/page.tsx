import React from 'react';
import { getProject } from '@/components/platform/project/actions';
import PlanClient from './plan-client';

interface PageProps {
  params: Promise<{ id: string; lang: string }>;
}

const Plan = async ({ params }: PageProps) => {
  const { id } = await params;
  const response = await getProject(id);
  const project = response.success ? response.project : null;

  return <PlanClient project={project} />;
};

export default Plan;
