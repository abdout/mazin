// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import type { Dictionary } from "@/components/internationalization/types"
import { auth } from "@/auth"

import { getProfile } from "./queries"
import { ProfileForm } from "./form"

type Locale = "ar" | "en"

interface ProfileContentProps {
  dictionary: Dictionary
  locale: Locale
}

export async function ProfileContent({ dictionary, locale }: ProfileContentProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/settings`)
  }

  const profile = await getProfile(session.user.id)
  if (!profile) {
    redirect(`/${locale}/login`)
  }

  return <ProfileForm initial={profile} dictionary={dictionary} locale={locale} />
}
