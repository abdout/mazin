import React from 'react';
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Project } from './types';
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
    <div className="relative h-48">
      <div
        className={`w-full h-full p-5 border rounded-xl flex flex-col justify-between hover:border-black transition-colors ${contextMenu.projectID === project.id ? 'opacity-20' : ''}`}
        onContextMenu={(e) => {
          if (project.id) {
            onRightClick(e, project.id);
          }
        }}
      >
        <Link href={`/project/${project.id}`} className="flex flex-col h-full">
          {/* Header */}
          <div className="space-y-1">
            <h3 className="font-semibold text-lg leading-tight truncate">{project.customer}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {project.blAwbNumber || project.location || 'BL/AWB'}
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-center py-2">
            <div className="flex gap-2 items-center text-sm">
              <Icon icon="mdi:ship" width={18} className="text-muted-foreground" />
              <span className="truncate">{shipmentType || 'Shipment'}</span>
            </div>
            {(project.portOfOrigin || project.portOfDestination) && (
              <div className="flex gap-1.5 items-center mt-1.5 text-xs text-muted-foreground">
                <span className="truncate max-w-[80px]">{project.portOfOrigin || '---'}</span>
                <Icon icon="mdi:arrow-right" width={12} />
                <span className="truncate max-w-[80px]">{project.portOfDestination || '---'}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-2 items-center">
            <div className={`rounded-full w-3 h-3 ${statusInfo.color}`}></div>
            <span className="text-sm">{statusInfo.label}</span>
          </div>
        </Link>
      </div>

      {contextMenu.projectID === project.id && (
        <div
          className="absolute top-0 left-0 w-full h-full rounded-xl bg-background/90 backdrop-blur-sm flex flex-row justify-center items-center gap-4"
          onMouseLeave={onCloseContextMenu}
          onClick={(e) => {
            // Close if clicking outside the buttons
            if (e.target === e.currentTarget) {
              onCloseContextMenu();
            }
          }}
        >
          <button
            onClick={() => project.id && onOpenDialog(project.id)}
            className="p-3 hover:bg-muted rounded-xl transition-colors border bg-background"
            title="Edit"
          >
            <Icon icon="ph:pencil-simple" width={24} />
          </button>
          <Delete id={contextMenu.projectID} onSuccess={onProjectDeleted} />
        </div>
      )}
    </div>
  );
};

export default ProjectCard;
