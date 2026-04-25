// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

// Profile editable fields. Role + isTwoFactorEnabled are NOT here — Team and
// Security tabs own those. Email is optional because OAuth users can't change
// theirs (enforced in the action).
export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120).optional(),
  email: z.string().trim().email("Enter a valid email").max(254).optional(),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  image: z
    .string()
    .trim()
    .url("Enter a valid image URL")
    .max(2048)
    .optional()
    .or(z.literal("")),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
