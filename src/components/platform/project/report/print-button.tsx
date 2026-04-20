'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

interface ReportPrintButtonProps {
  label?: string
}

export default function ReportPrintButton({ label }: ReportPrintButtonProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <Button onClick={handlePrint} variant="outline" size="sm">
      <Printer className="me-2 size-4" />
      {label ?? 'Export PDF'}
    </Button>
  )
}
