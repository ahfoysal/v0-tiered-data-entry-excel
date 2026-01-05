"use client"

import { HierarchyWorkspace } from "@/components/hierarchy-workspace"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { User } from "@/types/user"

export default function TierPage({
  params,
}: {
  params: { projectId: string; tierId: string }
}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me")
        const data = await response.json()
        setUser(data.user || ({} as User))
      } catch (error) {
        console.error("[v0] Failed to fetch user:", error)
        setUser({} as User)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleBack = () => {
    router.push(`/projects/${params.projectId}`)
  }

  const handleLogout = () => {
    fetch("/api/auth/logout", { method: "POST" }).then(() => {
      router.push("/login")
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <HierarchyWorkspace
      projectId={params.projectId}
      initialTierId={params.tierId}
      user={user as User}
      onBack={handleBack}
      onLogout={handleLogout}
    />
  )
}
