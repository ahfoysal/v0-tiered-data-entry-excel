"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/login-form"
import { ProjectList } from "@/components/project-list"
import { HierarchyWorkspace } from "@/components/hierarchy-workspace"
import { UserManagement } from "@/components/user-management"
import { Button } from "@/components/ui/button"
import { LogOut, Users } from "lucide-react"

interface User {
  id: string
  email: string
  is_admin: boolean
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [view, setView] = useState<"projects" | "users">("projects")

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me")
      const data = await res.json()
      setUser(data.user)
    } catch (error) {
      console.error("[v0] Auth check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    setSelectedProjectId(null)
    setView("projects")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm onLogin={checkAuth} />
  }

  if (selectedProjectId) {
    return (
      <HierarchyWorkspace
        projectId={selectedProjectId}
        user={user}
        onBack={() => setSelectedProjectId(null)}
        onLogout={handleLogout}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Tiered Data Entry
            </h1>
            <p className="text-sm text-muted-foreground">
              Logged in as {user.email} {user.is_admin && "• Admin"}
            </p>
          </div>
          <div className="flex gap-2">
            {user.is_admin && (
              <Button
                onClick={() => setView(view === "projects" ? "users" : "projects")}
                variant="outline"
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                {view === "projects" ? "Manage Users" : "View Projects"}
              </Button>
            )}
            <Button onClick={handleLogout} variant="outline" className="gap-2 bg-transparent">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <div className="px-6 py-8 max-w-7xl mx-auto">
        {view === "users" ? (
          <UserManagement currentUserId={user.id} />
        ) : (
          <ProjectList onSelectProject={setSelectedProjectId} user={user} />
        )}
      </div>
    </div>
  )
}
