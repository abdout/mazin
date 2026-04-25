// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { FeeCalculationType, FeeType } from "@prisma/client"

export interface FeeTemplateDTO {
  id: string
  code: string
  name: string
  nameAr: string | null
  description: string | null
  feeType: FeeType
  calculationType: FeeCalculationType
  amount: number | null
  percentage: number | null
  minAmount: number | null
  maxAmount: number | null
  isGovernmentFee: boolean
  isTaxable: boolean
  taxRate: number | null
  isActive: boolean
}
