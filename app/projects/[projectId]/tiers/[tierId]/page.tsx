"use client"

import { HierarchyWorkspace } from "@/components/hierarchy-workspace"
import { useRouter } from "next/navigation"
import type { User } from "@/types/user" // Declare or import the User type

export default function TierPage({
  params,
}: {
  params: { projectId: string; tierId: string }
}) {
  const router = useRouter()

  const handleBack = () => {
    router.push(`/projects/${params.projectId}`)
  }

  const handleLogout = () => {
    fetch("/api/auth/logout", { method: "POST" }).then(() => {
      router.push("/login")
    })
  }

  return (
    <HierarchyWorkspace
      projectId={params.projectId}
      initialTierId={params.tierId}
      user={{} as User}
      onBack={handleBack}
      onLogout={handleLogout}
    />
  )
}
