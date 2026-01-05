"use client"

import { HierarchyWorkspace } from "@/components/hierarchy-workspace"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const userData = await res.json()
          setUser(userData.user)
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("[v0] Failed to fetch user:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleBack = () => {
    router.push("/")
  }

  const handleLogout = () => {
    fetch("/api/auth/logout", { method: "POST" }).then(() => {
      router.push("/login")
    })
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <HierarchyWorkspace projectId={params.projectId} user={user} onBack={handleBack} onLogout={handleLogout} />
}
