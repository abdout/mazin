"use client"

import ProjectCreateForm from "@/components/platform/project/form"
import { useRouter } from "next/navigation"

export default function NewProjectPage() {
  const router = useRouter()

  return (
    <div className="h-full">
      <ProjectCreateForm
        onSuccess={async () => {
          router.push("/en/project")
        }}
      />
    </div>
  )
}
