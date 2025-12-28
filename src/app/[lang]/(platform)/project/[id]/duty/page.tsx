'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { Icon } from '@iconify/react'

const ProjectDuty = () => {
  const params = useParams()
  const projectId = params.id as string

  const [cifValue, setCifValue] = useState('')
  const [dutyRate, setDutyRate] = useState('5')
  const [vatRate, setVatRate] = useState('17')

  const cif = parseFloat(cifValue) || 0
  const duty = cif * (parseFloat(dutyRate) / 100)
  const vat = (cif + duty) * (parseFloat(vatRate) / 100)
  const total = duty + vat

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Duty Calculator</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Calculate customs duties and VAT for this shipment
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">Input Values</h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">CIF Value (USD)</label>
              <input
                type="number"
                value={cifValue}
                onChange={(e) => setCifValue(e.target.value)}
                placeholder="Enter CIF value"
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">HS Code</label>
              <input
                type="text"
                placeholder="e.g., 8471.30"
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Duty Rate (%)</label>
                <input
                  type="number"
                  value={dutyRate}
                  onChange={(e) => setDutyRate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">VAT Rate (%)</label>
                <input
                  type="number"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">Calculation Result</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">CIF Value</span>
              <span className="font-medium">${cif.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Customs Duty ({dutyRate}%)</span>
              <span className="font-medium">${duty.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">VAT ({vatRate}%)</span>
              <span className="font-medium">${vat.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-muted/50 rounded-lg px-3 -mx-3">
              <span className="font-semibold">Total Due</span>
              <span className="font-bold text-lg">${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-muted/30 border rounded-xl">
        <div className="flex gap-3">
          <Icon icon="mdi:calculator" width={20} className="text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">Calculation Formula</p>
            <p className="text-sm text-muted-foreground mt-1">
              Total Duty = CIF × Duty Rate | VAT = (CIF + Duty) × VAT Rate | Total = Duty + VAT
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDuty
