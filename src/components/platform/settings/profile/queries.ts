// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getAccountByUserId } from "@/components/auth/account"
import type { ProfileDTO } from "../types"

// Fetch the full profile row for settings. `currentUser()` in the session
// doesn't carry `phone`, so we hit the DB once per settings page load.
export async function getProfile(userId: string): Promise<ProfileDTO | null> {
  const [user, oauthAccount] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        isTwoFactorEnabled: true,
      },
    }),
    getAccountByUserId(userId),
  ])

  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    image: user.image,
    isTwoFactorEnabled: user.isTwoFactorEnabled ?? false,
    isOAuth: !!oauthAccount,
  }
}
