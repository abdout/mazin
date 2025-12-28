'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { Icon } from '@iconify/react'

const ProjectACD = () => {
  const params = useParams()
  const projectId = params.id as string

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Advance Cargo Declaration</h1>
        <p className="text-muted-foreground text-sm mt-1">
          ACD tracking for Sudan imports (mandatory from January 2026)
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 border rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon icon="mdi:file-document" width={18} />
            <span className="text-sm">ACN Number</span>
          </div>
          <p className="text-lg font-semibold mt-2">--</p>
        </div>
        <div className="p-4 border rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon icon="mdi:calendar" width={18} />
            <span className="text-sm">Validation Deadline</span>
          </div>
          <p className="text-lg font-semibold mt-2">--</p>
        </div>
        <div className="p-4 border rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon icon="mdi:check-circle" width={18} />
            <span className="text-sm">Status</span>
          </div>
          <p className="text-lg font-semibold mt-2">Pending</p>
        </div>
      </div>

      <div className="mt-8 border rounded-xl p-6">
        <h2 className="text-lg font-medium mb-4">Required Documents</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Icon icon="mdi:file-outline" width={20} className="text-muted-foreground" />
            <span>Draft Bill of Lading</span>
            <span className="ms-auto text-sm text-muted-foreground">Not uploaded</span>
          </div>
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Icon icon="mdi:file-outline" width={20} className="text-muted-foreground" />
            <span>Commercial Invoice</span>
            <span className="ms-auto text-sm text-muted-foreground">Not uploaded</span>
          </div>
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Icon icon="mdi:file-outline" width={20} className="text-muted-foreground" />
            <span>Freight Invoice</span>
            <span className="ms-auto text-sm text-muted-foreground">Not uploaded</span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
        <div className="flex gap-3">
          <Icon icon="mdi:alert" width={20} className="text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">ACD Compliance</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              ACD must be validated 5 days before vessel arrival. Submit documents to acdsudan.com.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectACD
