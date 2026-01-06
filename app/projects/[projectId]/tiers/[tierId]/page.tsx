"use client"

import { HierarchyWorkspace } from "@/components/hierarchy-workspace"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { User } from "@/types/user"

export default function TierPage({
  params,
}: {
  params: Promise<{ projectId: string; tierId: string }>
}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [tierId, setTierId] = useState<string | null>(null)

  useEffect(() => {
    const resolveParams = async () => {
      try {
        const { projectId, tierId } = await params
        setProjectId(projectId)
        setTierId(tierId)
      } catch (error) {
        console.error("[v0] Failed to resolve params:", error)
        router.push("/")
      }
    }
    resolveParams()
  }, [params, router])

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
    if (projectId) {
      router.push(`/projects/${projectId}`)
    }
  }

  const handleLogout = () => {
    fetch("/api/auth/logout", { method: "POST" }).then(() => {
      router.push("/login")
    })
  }

  if (loading || !projectId || !tierId) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <HierarchyWorkspace
      projectId={projectId}
      initialTierId={tierId}
      user={user as User}
      onBack={handleBack}
      onLogout={handleLogout}
    />
  )
}
