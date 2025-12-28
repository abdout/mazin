'use client'

import React from 'react'
import { useParams } from 'next/navigation'

const ProjectInvoices = () => {
  const params = useParams()
  const projectId = params.id as string

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Related Invoices</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track duties, VAT, port charges, and other expenses
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-4 border rounded-xl">
          <p className="text-sm text-muted-foreground">Customs Duty</p>
          <p className="text-2xl font-semibold mt-1">--</p>
        </div>
        <div className="p-4 border rounded-xl">
          <p className="text-sm text-muted-foreground">VAT</p>
          <p className="text-2xl font-semibold mt-1">--</p>
        </div>
        <div className="p-4 border rounded-xl">
          <p className="text-sm text-muted-foreground">Port Charges</p>
          <p className="text-2xl font-semibold mt-1">--</p>
        </div>
        <div className="p-4 border rounded-xl">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-semibold mt-1">--</p>
        </div>
      </div>

      <div className="mt-8 border rounded-xl p-6">
        <h2 className="text-lg font-medium mb-4">Expense Records</h2>
        <div className="text-center py-8 text-muted-foreground">
          No expense records yet
        </div>
      </div>
    </div>
  )
}

export default ProjectInvoices
