// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import type { Dictionary } from "@/components/internationalization/types"
import { auth } from "@/auth"

import { getCompanySettings } from "./queries"
import { OrganizationForm } from "./form"

type Locale = "ar" | "en"

interface OrganizationContentProps {
  dictionary: Dictionary
  locale: Locale
}

export async function OrganizationContent({ dictionary, locale }: OrganizationContentProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/settings/organization`)
  }

  const settings = await getCompanySettings(session.user.id)
  return <OrganizationForm initial={settings} dictionary={dictionary} locale={locale} />
}
