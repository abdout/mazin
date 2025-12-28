import React from 'react';
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Project } from './types';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import Delete from "./delete";
import { SHIPMENT_TYPE_LABELS } from './constant';

interface ProjectCardProps {
  project: Project;
  contextMenu: { x: number, y: number, projectID: string | null };
  onRightClick: (e: React.MouseEvent, projectID: string) => void;
  onCloseContextMenu: () => void;
  onOpenDialog: (projectId: string) => void;
  onProjectDeleted?: () => Promise<void>;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  contextMenu,
  onRightClick,
  onCloseContextMenu,
  onOpenDialog,
  onProjectDeleted,
}) => {
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get shipment type label
  const getShipmentTypeLabel = () => {
    if (!project.systems || project.systems.length === 0) return null;
    const firstType = project.systems[0];
    return SHIPMENT_TYPE_LABELS[firstType as keyof typeof SHIPMENT_TYPE_LABELS] || firstType;
  };

  // Get status color and label
  const getStatusInfo = () => {
    switch (project.status) {
      case 'delivered':
      case 'done':
        return { color: 'bg-green-500', label: 'Delivered' };
      case 'released':
        return { color: 'bg-emerald-400', label: 'Released' };
      case 'in_progress':
      case 'on_progress':
        return { color: 'bg-yellow-400', label: 'In Progress' };
      case 'customs_hold':
      case 'stuck':
        return { color: 'bg-red-500', label: 'On Hold' };
      default:
        return { color: 'bg-neutral-400', label: 'Pending' };
    }
  };

  const statusInfo = getStatusInfo();
  const shipmentType = getShipmentTypeLabel();

  return (
    <div className="relative">
      <Card
        className={`border border-gray-400 hover:border-black h-48 ${contextMenu.projectID === project.id ? 'opacity-20' : ''}`}
        onContextMenu={(e) => {
          if (project.id) {
            onRightClick(e, project.id);
          }
        }}
      >
        <Link href={`/project/${project.id}`}>
          <CardHeader>
            <strong className="font-heading text-2xl">{project.customer}</strong>
            <p className="line-clamp-1 overflow-hidden text-ellipsis">
              {project.blAwbNumber || project.location || <span className="opacity-50">BL/AWB Number</span>}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 -ms-1 items-center -mt-2">
              <Icon icon="mdi:ship" width={25} />
              <p className="text-sm">{shipmentType || project.client || 'Shipment Type'}</p>
            </div>
            {(project.portOfOrigin || project.portOfDestination) && (
              <div className="flex gap-2 items-center mt-1 text-xs text-muted-foreground">
                <span>{project.portOfOrigin || '---'}</span>
                <Icon icon="mdi:arrow-right" width={14} />
                <span>{project.portOfDestination || '---'}</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-4 items-center -mt-5">
            <div className={`rounded-full w-4 h-4 ${statusInfo.color}`}></div>
            <p className="capitalize">{statusInfo.label}</p>
          </CardFooter>
        </Link>
      </Card>

      {contextMenu.projectID === project.id && (
        <div
          className="absolute top-0 left-0 w-full h-full flex flex-row justify-center items-center space-x-4 p-8"
          onMouseLeave={onCloseContextMenu}
        >
          <div className="flex items-center justify-center">
            <Delete id={contextMenu.projectID} onSuccess={onProjectDeleted} />
          </div>
          <div className="flex items-center justify-center">
            <button
              onClick={() => project.id && onOpenDialog(project.id)}
              className="flex gap-4 z-50"
            >
              <Icon icon="icon-park-solid:edit" width={40} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCard;
