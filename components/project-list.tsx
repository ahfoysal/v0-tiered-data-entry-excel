"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Copy, Trash2, Calendar, UserIcon, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useLoading } from "@/contexts/loading-context"
import { ProjectSetup } from "@/components/project-setup"

interface Project {
  id: string
  name: string
  created_at: string
  created_by_email: string
}

interface AppUser {
  id: string
  email: string
  is_admin: boolean
}

const TEMPLATES = {
  blank: { name: "Blank Project", fields: [] },
  attendance: {
    name: "Attendance Tracker",
    fields: Array.from({ length: 31 }, (_, i) => ({
      field_name: `Day ${i + 1}`,
      field_type: "number",
    })),
  },
  taskManagement: {
    name: "Task Management",
    fields: [
      { field_name: "Task Name", field_type: "string" },
      { field_name: "Duration", field_type: "number" },
      { field_name: "Start Date", field_type: "date" },
      { field_name: "End Date", field_type: "date" },
      { field_name: "Status", field_type: "string" },
      { field_name: "Assigned To", field_type: "string" },
    ],
  },
}

export function ProjectList({ onSelectProject, user }: { onSelectProject: (id: string) => void; user: AppUser }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { isLoading: globalLoading, setIsLoading } = useLoading()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const res = await fetch("/api/projects")
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error("[v0] Load projects failed:", error)
      toast.error("Failed to load projects")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (
    projectName: string,
    columns: string[],
    options?: { template?: string; teamId?: string; teamSource?: string; fields?: string[] },
  ) => {
    setIsCreating(true)
    setIsLoading(true)
    const toastId = toast.loading(`Creating project "${projectName}"...`)

    try {
      const payload: any = {
        name: projectName.trim(),
      }

      if (options?.template === "team-based") {
        payload.template = "team-based"
        payload.teamId = options.teamId
        payload.fields = options.fields
        payload.columns = columns
      } else if (options?.template === "custom") {
        payload.template = "custom"
        payload.teamSource = options.teamSource
        payload.teamId = options.teamSource === "all" ? undefined : options.teamId
        payload.fields = options.fields
        payload.columns = columns
      } else {
        payload.templateFields = TEMPLATES["blank"].fields
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (data.project) {
        await loadProjects()
        setShowCreateModal(false)
        toast.success(`Project "${projectName}" created successfully! 🎉`, {
          id: toastId,
        })
      } else {
        toast.error("Failed to create project", { id: toastId })
      }
    } catch (error) {
      console.error("[v0] Create project failed:", error)
      toast.error("Failed to create project", { id: toastId })
    } finally {
      setIsCreating(false)
      setIsLoading(false)
    }
  }

  const handleDuplicateProject = async (projectId: string, projectName: string) => {
    setIsLoading(true)
    const toastId = toast.loading(`Duplicating "${projectName}"...`)

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${projectName} (Copy)` }),
      })

      if (res.ok) {
        await loadProjects()
        toast.success(`"${projectName}" duplicated successfully! ✨`, {
          id: toastId,
        })
      } else {
        toast.error("Failed to duplicate project", { id: toastId })
      }
    } catch (error) {
      console.error("[v0] Duplicate project failed:", error)
      toast.error("Failed to duplicate project", { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Delete project "${projectName}"? This cannot be undone.`)) return

    setIsLoading(true)
    const toastId = toast.loading(`Deleting "${projectName}"...`)

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        await loadProjects()
        toast.success(`"${projectName}" deleted successfully ✓`, {
          id: toastId,
        })
      } else {
        toast.error("Failed to delete project", { id: toastId })
      }
    } catch (error) {
      console.error("[v0] Delete project failed:", error)
      toast.error("Failed to delete project", { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-muted-foreground animate-pulse">Loading projects...</div>
      </div>
    )
  }

  return (
    <div className={`max-w-5xl mx-auto ${globalLoading ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Your Projects</h2>
            <p className="text-muted-foreground mt-1">Manage and organize your data entry projects</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={globalLoading}
            className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Create Project Section */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <ProjectSetup onCreateProject={handleCreateProject} />
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-to-br from-muted/50 to-muted/20 border-dashed">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-muted mb-4">
            <Sparkles className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-lg">No projects yet</p>
          <p className="text-muted-foreground text-sm mt-1">Click "New Project" to create your first one</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="p-6 hover:shadow-lg hover:border-primary/30 cursor-pointer transition-all duration-200 border border-border/50 bg-card/50 backdrop-blur-sm group"
            >
              <div
                onClick={() => !globalLoading && onSelectProject(project.id)}
                className="flex items-center justify-between flex-1"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      {project.created_by_email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(project.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {user.is_admin && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-border/30">
                  <Button
                    onClick={() => handleDuplicateProject(project.id, project.name)}
                    disabled={globalLoading}
                    size="sm"
                    variant="outline"
                    className="gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </Button>
                  <Button
                    onClick={() => handleDeleteProject(project.id, project.name)}
                    disabled={globalLoading}
                    size="sm"
                    variant="outline"
                    className="gap-2 text-destructive hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
