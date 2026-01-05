"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/login-form"
import { ProjectList } from "@/components/project-list"
import { HierarchyWorkspace } from "@/components/hierarchy-workspace"
import { UserManagement } from "@/components/user-management"
import { TeamManagement } from "@/components/team-management"
import { EmployeeManagement } from "@/components/employee-management"
import { Button } from "@/components/ui/button"
import { LogOut, Users, Users2, Building2, FileText } from "lucide-react"

interface User {
  id: string
  email: string
  is_admin: boolean
  user_role?: string
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [adminView, setAdminView] = useState<"projects" | "users" | "teams" | "employees">("projects")

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
    setAdminView("projects")
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

  const isAdmin = user.is_admin || user.user_role === "admin"
  const isEmployee = !isAdmin || user.user_role === "user"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Tiered Data Entry
            </h1>
            <p className="text-sm text-muted-foreground">
              Logged in as {user.email} {isAdmin && "• Admin"} {isEmployee && "• Employee"}
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button
                  onClick={() => setAdminView("projects")}
                  variant={adminView === "projects" ? "default" : "outline"}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Projects</span>
                </Button>
                <Button
                  onClick={() => setAdminView("teams")}
                  variant={adminView === "teams" ? "default" : "outline"}
                  className="gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Teams
                </Button>
                <Button
                  onClick={() => setAdminView("employees")}
                  variant={adminView === "employees" ? "default" : "outline"}
                  className="gap-2"
                >
                  <Users2 className="h-4 w-4" />
                  Employees
                </Button>
                <Button
                  onClick={() => setAdminView("users")}
                  variant={adminView === "users" ? "default" : "outline"}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Users
                </Button>
              </>
            )}
            {isEmployee && !isAdmin && (
              <Button
                onClick={() => setAdminView("projects")}
                variant={adminView === "projects" ? "default" : "outline"}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                <span>Projects</span>
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
        {adminView === "users" && isAdmin && <UserManagement currentUserId={user.id} />}
        {adminView === "teams" && isAdmin && <TeamManagement />}
        {adminView === "employees" && isAdmin && <EmployeeManagement />}
        {adminView === "projects" && <ProjectList onSelectProject={setSelectedProjectId} user={user} />}
      </div>
    </div>
  )
}
