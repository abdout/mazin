"use client"

import ProjectCreateForm from "@/components/platform/project/form"
import { useRouter, useParams } from "next/navigation"

export default function NewProjectPage() {
  const router = useRouter()
  const params = useParams<{ lang: string }>()
  const lang = params?.lang ?? "ar"

  return (
    <div className="h-full">
      <ProjectCreateForm
        onSuccess={async () => {
          router.push(`/${lang}/project`)
        }}
      />
    </div>
  )
}
