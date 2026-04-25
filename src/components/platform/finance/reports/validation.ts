// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

// All current reports compute from fixed periods (this month / YTD / aging
// buckets). If we add user-driven date ranges later, this schema is the entry
// point.
export const dateRangeSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
  })
