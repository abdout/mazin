/**
 * Tracking Utilities
 * Functions for generating tracking numbers, slugs, and calculating ETAs
 */

import { TrackingStageType } from '@prisma/client';
import { nanoid } from 'nanoid';

// All 11 tracking stages in order
export const TRACKING_STAGES: TrackingStageType[] = [
  'PRE_ARRIVAL_DOCS',
  'VESSEL_ARRIVAL',
  'CUSTOMS_DECLARATION',
  'CUSTOMS_PAYMENT',
  'INSPECTION',
  'PORT_FEES',
  'QUALITY_STANDARDS',
  'RELEASE',
  'LOADING',
  'IN_TRANSIT',
  'DELIVERED',
];

// Stage configuration with estimated hours
export const STAGE_CONFIG: Record<TrackingStageType, { order: number; estimatedHours: number; name: string }> = {
  PRE_ARRIVAL_DOCS: { order: 1, estimatedHours: 24, name: 'Pre-arrival Documentation' },
  VESSEL_ARRIVAL: { order: 2, estimatedHours: 0, name: 'Vessel Arrival' },
  CUSTOMS_DECLARATION: { order: 3, estimatedHours: 24, name: 'Customs Declaration' },
  CUSTOMS_PAYMENT: { order: 4, estimatedHours: 12, name: 'Customs Payment' },
  INSPECTION: { order: 5, estimatedHours: 48, name: 'Inspection' },
  PORT_FEES: { order: 6, estimatedHours: 12, name: 'Port Fees' },
  QUALITY_STANDARDS: { order: 7, estimatedHours: 24, name: 'Quality Standards' },
  RELEASE: { order: 8, estimatedHours: 12, name: 'Release' },
  LOADING: { order: 9, estimatedHours: 6, name: 'Loading' },
  IN_TRANSIT: { order: 10, estimatedHours: 24, name: 'In Transit' },
  DELIVERED: { order: 11, estimatedHours: 0, name: 'Delivered' },
};

/**
 * Generate a unique tracking number in format TRK-XXXXXX
 */
export function generateTrackingNumber(): string {
  const suffix = nanoid(6).toUpperCase();
  return `TRK-${suffix}`;
}

/**
 * Generate a URL-safe tracking slug
 */
export function generateTrackingSlug(): string {
  return nanoid(10).toLowerCase();
}

/**
 * Generate a unique shipment number in format SHP-YYYYMMDD-XXXX
 */
export function generateShipmentNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = nanoid(4).toUpperCase();
  return `SHP-${dateStr}-${suffix}`;
}

/**
 * Calculate estimated dates for each tracking stage based on arrival date
 */
export function calculateStageETAs(arrivalDate: Date | null): Record<TrackingStageType, { start: Date; end: Date }> {
  const etas: Record<string, { start: Date; end: Date }> = {};
  const baseDate = arrivalDate || new Date();

  let currentDate = new Date(baseDate);

  for (const stage of TRACKING_STAGES) {
    const config = STAGE_CONFIG[stage];
    const startDate = new Date(currentDate);
    const endDate = new Date(currentDate);
    endDate.setHours(endDate.getHours() + config.estimatedHours);

    etas[stage] = {
      start: startDate,
      end: endDate,
    };

    // Move current date to end of this stage for next stage calculation
    currentDate = new Date(endDate);
  }

  return etas as Record<TrackingStageType, { start: Date; end: Date }>;
}

/**
 * Get the next stage after the current one
 */
export function getNextStage(currentStage: TrackingStageType): TrackingStageType | null {
  const currentIndex = TRACKING_STAGES.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === TRACKING_STAGES.length - 1) {
    return null;
  }
  return TRACKING_STAGES[currentIndex + 1];
}

/**
 * Get progress percentage based on completed stages
 */
export function getProgressPercentage(completedStages: number): number {
  return Math.round((completedStages / TRACKING_STAGES.length) * 100);
}

/**
 * Get stage display name
 */
export function getStageName(stage: TrackingStageType): string {
  return STAGE_CONFIG[stage]?.name || stage;
}

/**
 * Check if a stage is a milestone (for client notifications)
 */
export function isMilestoneStage(stage: TrackingStageType): boolean {
  const milestones: TrackingStageType[] = [
    'VESSEL_ARRIVAL',
    'CUSTOMS_DECLARATION',
    'RELEASE',
    'DELIVERED',
  ];
  return milestones.includes(stage);
}
