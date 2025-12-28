'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { Icon } from '@iconify/react'

const ProjectContainers = () => {
  const params = useParams()
  const projectId = params.id as string

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Container Tracking</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor container status and demurrage free time
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="p-4 border rounded-xl">
          <p className="text-sm text-muted-foreground">Total Containers</p>
          <p className="text-2xl font-semibold mt-1">0</p>
        </div>
        <div className="p-4 border rounded-xl border-green-200 bg-green-50 dark:bg-green-950/20">
          <p className="text-sm text-green-700 dark:text-green-400">Free Time</p>
          <p className="text-2xl font-semibold mt-1 text-green-700 dark:text-green-400">0</p>
        </div>
        <div className="p-4 border rounded-xl border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <p className="text-sm text-amber-700 dark:text-amber-400">Warning</p>
          <p className="text-2xl font-semibold mt-1 text-amber-700 dark:text-amber-400">0</p>
        </div>
        <div className="p-4 border rounded-xl border-red-200 bg-red-50 dark:bg-red-950/20">
          <p className="text-sm text-red-700 dark:text-red-400">Demurrage</p>
          <p className="text-2xl font-semibold mt-1 text-red-700 dark:text-red-400">0</p>
        </div>
      </div>

      <div className="mt-8 border rounded-xl p-6">
        <h2 className="text-lg font-medium mb-4">Container List</h2>
        <div className="text-center py-8 text-muted-foreground">
          <Icon icon="mdi:package-variant" width={48} className="mx-auto mb-3 opacity-40" />
          <p>No containers added</p>
          <p className="text-sm mt-1">Container numbers will appear here once added to the shipment</p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <div className="flex gap-3">
          <Icon icon="mdi:information" width={20} className="text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">Demurrage Prevention</p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Free time is typically 14 days from vessel arrival. Alerts will be sent at 7, 3, and 1 day before expiry.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectContainers
