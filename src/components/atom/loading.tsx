'use client';

import React from 'react';
import { Skeleton } from "@/components/ui/skeleton"

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-gray-900`}
      />
    </div>
  );
};

export default Loading;

// Skeleton components for various loading states
interface SkeletonCardProps {
  count?: number;
}

export function SkeletonCard({ count = 1 }: SkeletonCardProps = {}) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6 shadow-sm">
          <Skeleton className="h-4 w-[200px] mb-4" />
          <Skeleton className="h-8 w-[150px] mb-2" />
          <Skeleton className="h-3 w-[100px]" />
        </div>
      ))}
    </>
  )
}

interface SkeletonStatsProps {
  count?: number;
}

export function SkeletonStats({ count = 4 }: SkeletonStatsProps = {}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
          <Skeleton className="h-4 w-[80px] mb-2" />
          <Skeleton className="h-8 w-[120px]" />
        </div>
      ))}
    </div>
  )
}

interface SkeletonChartProps {
  count?: number;
}

export function SkeletonChart({ count = 1 }: SkeletonChartProps = {}) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6 shadow-sm">
          <Skeleton className="h-4 w-[150px] mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ))}
    </>
  )
}

interface SkeletonChartGridProps {
  count?: number;
}

export function SkeletonChartGrid({ count = 2 }: SkeletonChartGridProps = {}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[...Array(count)].map((_, i) => (
        <SkeletonChart key={i} />
      ))}
    </div>
  )
}

interface SkeletonListCompactProps {
  items?: number;
  showAvatar?: boolean;
}

export function SkeletonListCompact({ items = 5, showAvatar = true }: SkeletonListCompactProps = {}) {
  return (
    <div className="space-y-2">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-2">
          <div className="flex items-center gap-3">
            {showAvatar && <Skeleton className="h-8 w-8 rounded-full" />}
            <Skeleton className="h-4 w-[150px]" />
          </div>
          <Skeleton className="h-4 w-[80px]" />
        </div>
      ))}
    </div>
  )
}

interface SkeletonDataTableProps {
  columns?: number;
  rows?: number;
}

export function SkeletonDataTable({ columns = 4, rows = 5 }: SkeletonDataTableProps = {}) {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b p-4">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-8 w-[100px]" />
      </div>
      <div className="p-4">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0">
            {[...Array(columns)].map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

interface SkeletonPageNavWideProps {
  count?: number;
}

export function SkeletonPageNavWide({ count = 6 }: SkeletonPageNavWideProps = {}) {
  return (
    <div className="flex gap-2 mb-6">
      {[...Array(count)].map((_, i) => (
        <Skeleton key={i} className="h-8 w-[80px] rounded-full" />
      ))}
    </div>
  )
}
