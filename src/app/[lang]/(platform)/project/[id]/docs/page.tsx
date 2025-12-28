'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { Icon } from '@iconify/react'

const requiredDocs = [
  { name: 'Bill of Lading (B/L)', icon: 'mdi:file-document', required: true },
  { name: 'Commercial Invoice', icon: 'mdi:file-document', required: true },
  { name: 'Packing List', icon: 'mdi:file-document', required: true },
  { name: 'Certificate of Origin', icon: 'mdi:certificate', required: true },
  { name: 'IM Form', icon: 'mdi:bank', required: true },
  { name: 'SSMO Certificate', icon: 'mdi:shield-check', required: false },
  { name: 'Insurance Certificate', icon: 'mdi:shield', required: false },
  { name: 'Phytosanitary Certificate', icon: 'mdi:leaf', required: false },
]

const ProjectDocs = () => {
  const params = useParams()
  const projectId = params.id as string

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage required documents for customs clearance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="p-4 border rounded-xl">
          <p className="text-sm text-muted-foreground">Total Required</p>
          <p className="text-2xl font-semibold mt-1">5</p>
        </div>
        <div className="p-4 border rounded-xl border-green-200 bg-green-50 dark:bg-green-950/20">
          <p className="text-sm text-green-700 dark:text-green-400">Uploaded</p>
          <p className="text-2xl font-semibold mt-1 text-green-700 dark:text-green-400">0</p>
        </div>
        <div className="p-4 border rounded-xl border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <p className="text-sm text-amber-700 dark:text-amber-400">Pending</p>
          <p className="text-2xl font-semibold mt-1 text-amber-700 dark:text-amber-400">5</p>
        </div>
        <div className="p-4 border rounded-xl border-red-200 bg-red-50 dark:bg-red-950/20">
          <p className="text-sm text-red-700 dark:text-red-400">Expired</p>
          <p className="text-2xl font-semibold mt-1 text-red-700 dark:text-red-400">0</p>
        </div>
      </div>

      <div className="border rounded-xl p-6">
        <h2 className="text-lg font-medium mb-4">Document Checklist</h2>
        <div className="space-y-3">
          {requiredDocs.map((doc) => (
            <div key={doc.name} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
              <Icon icon={doc.icon} width={20} className="text-muted-foreground" />
              <span className="flex-1">{doc.name}</span>
              {doc.required && (
                <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded">Required</span>
              )}
              <span className="text-sm text-muted-foreground">Not uploaded</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <div className="flex gap-3">
          <Icon icon="mdi:information" width={20} className="text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">Document Validation</p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              All required documents must be validated before customs declaration. Commercial Invoice value must match IM Form within 5%.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDocs