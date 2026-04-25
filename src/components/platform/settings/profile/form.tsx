// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Dictionary } from "@/components/internationalization/types"

import { updateProfile } from "./actions"
import type { ProfileDTO } from "../types"

type Locale = "ar" | "en"

interface ProfileFormProps {
  initial: ProfileDTO
  dictionary: Dictionary
  locale: Locale
}

export function ProfileForm({ initial, dictionary, locale: _locale }: ProfileFormProps) {
  const t = dictionary.settings?.profileTab
  const [name, setName] = React.useState(initial.name ?? "")
  const [email, setEmail] = React.useState(initial.email)
  const [phone, setPhone] = React.useState(initial.phone ?? "")
  const [image, setImage] = React.useState(initial.image ?? "")
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({})
  const [saving, startTransition] = React.useTransition()

  const onSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setFieldErrors({})
      startTransition(async () => {
        const res = await updateProfile({
          name: name.trim(),
          // OAuth users: the action ignores email changes anyway; send what we show.
          email: initial.isOAuth ? undefined : email.trim(),
          phone: phone.trim(),
          image: image.trim(),
        })
        if (res.ok) {
          toast.success(t?.saved ?? "Profile updated")
        } else if (res.issues) {
          setFieldErrors(res.issues)
          toast.error(t?.errorInvalid ?? "Please fix the errors and try again")
        } else {
          toast.error(t?.errorSave ?? "Could not save — please try again")
        }
      })
    },
    [name, email, phone, image, initial.isOAuth, t]
  )

  const fieldError = (key: string) => fieldErrors[key]?.[0]

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{t?.title ?? "Profile"}</CardTitle>
          <CardDescription>
            {t?.description ??
              "Update your personal information — visible across the app."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="profile-name">{t?.nameLabel ?? "Full name"}</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t?.namePlaceholder}
              aria-invalid={!!fieldError("name")}
              disabled={saving}
            />
            {fieldError("name") ? (
              <p className="text-xs text-destructive">{fieldError("name")}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-email">{t?.emailLabel ?? "Email"}</Label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!fieldError("email")}
              disabled={saving || initial.isOAuth}
            />
            <p className="text-xs text-muted-foreground">
              {initial.isOAuth
                ? dictionary.settings?.profileTab?.emailHelp?.replace(
                    "re-verification",
                    "your provider"
                  ) ?? "Managed by your sign-in provider."
                : t?.emailHelp ?? ""}
            </p>
            {fieldError("email") ? (
              <p className="text-xs text-destructive">{fieldError("email")}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-phone">{t?.phoneLabel ?? "Phone"}</Label>
            <Input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t?.phonePlaceholder}
              aria-invalid={!!fieldError("phone")}
              disabled={saving}
              dir="ltr"
            />
            {fieldError("phone") ? (
              <p className="text-xs text-destructive">{fieldError("phone")}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-image">{t?.imageLabel ?? "Avatar URL"}</Label>
            <Input
              id="profile-image"
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder={t?.imagePlaceholder ?? "https://…"}
              aria-invalid={!!fieldError("image")}
              disabled={saving}
              dir="ltr"
            />
            {fieldError("image") ? (
              <p className="text-xs text-destructive">{fieldError("image")}</p>
            ) : null}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? t?.saving ?? "Saving…" : t?.save ?? "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
