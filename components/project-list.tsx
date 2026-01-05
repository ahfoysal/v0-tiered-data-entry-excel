"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Zap } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Project {
  id: string
  name: string
  created_at: string
  created_by_email: string
}

interface User {
  id: string
  email: string
  is_admin: boolean
}

const TEMPLATES = {
  blank: { name: "Blank Project", fields: [] },
  attendance: {
    name: "Attendance Tracker",
    fields: [
      { field_name: "Monday", field_type: "number" },
      { field_name: "Tuesday", field_type: "number" },
      { field_name: "Wednesday", field_type: "number" },
      { field_name: "Thursday", field_type: "number" },
      { field_name: "Friday", field_type: "number" },
      { field_name: "Saturday", field_type: "number" },
      { field_name: "Sunday", field_type: "number" },
    ],
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

export function ProjectList({ onSelectProject, user }: { onSelectProject: (id: string) => void; user: User }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof TEMPLATES>("blank")

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
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName.trim(),
          templateFields: TEMPLATES[selectedTemplate].fields,
        }),
      })

      const data = await res.json()
      if (data.project) {
        await loadProjects()
        setNewProjectName("")
        setSelectedTemplate("blank")
        setShowCreate(false)
      }
    } catch (error) {
      console.error("[v0] Create project failed:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading projects...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Your Projects</h2>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {showCreate && (
        <Card className="p-4 mb-6">
          <div className="space-y-3">
            <Input
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
            />
            <div className="flex gap-2">
              <Select value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as keyof typeof TEMPLATES)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blank">Blank Project</SelectItem>
                  <SelectItem value="attendance">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Attendance Tracker
                    </div>
                  </SelectItem>
                  <SelectItem value="taskManagement">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Task Management
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateProject}>Create</Button>
              <Button onClick={() => setShowCreate(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {projects.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>No projects yet. Create one to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="p-4 hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onSelectProject(project.id)}
            >
              <h3 className="font-semibold text-lg">{project.name}</h3>
              <p className="text-sm text-muted-foreground">
                Created by {project.created_by_email} on {new Date(project.created_at).toLocaleDateString()}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
