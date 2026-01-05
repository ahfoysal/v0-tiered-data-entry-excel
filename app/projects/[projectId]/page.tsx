"use client"

import { HierarchyWorkspace } from "@/components/hierarchy-workspace"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  is_admin: boolean
}

export default function ProjectPage({
  params,
}: {
  params: { projectId: string }
}) {
  const router = useRouter()

  const handleBack = () => {
    router.push("/")
  }

  const handleLogout = () => {
    fetch("/api/auth/logout", { method: "POST" }).then(() => {
      router.push("/login")
    })
  }

  return (
    <HierarchyWorkspace projectId={params.projectId} user={{} as User} onBack={handleBack} onLogout={handleLogout} />
  )
}
