"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, X } from "lucide-react"

interface ProjectSetupProps {
  onCreateProject: (projectName: string, columns: string[]) => void
}

export function ProjectSetup({ onCreateProject }: ProjectSetupProps) {
  const [projectName, setProjectName] = useState("")
  const [columns, setColumns] = useState<string[]>(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"])
  const [newColumn, setNewColumn] = useState("")

  const handleAddColumn = () => {
    if (newColumn.trim() && !columns.includes(newColumn.trim())) {
      setColumns([...columns, newColumn.trim()])
      setNewColumn("")
    }
  }

  const handleRemoveColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index))
  }

  const handleCreate = () => {
    if (projectName.trim() && columns.length > 0) {
      onCreateProject(projectName.trim(), columns)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">Create New Project</CardTitle>
          <CardDescription>
            Define your project name and fixed columns that will be used for all tiers in the hierarchy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              placeholder="e.g., Company Attendance Tracker"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Fixed Columns</Label>
            <p className="text-sm text-muted-foreground">
              These columns will be available for every tier in your hierarchy (e.g., days of the week for attendance)
            </p>

            <div className="flex gap-2">
              <Input
                placeholder="Add column name"
                value={newColumn}
                onChange={(e) => setNewColumn(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
              />
              <Button onClick={handleAddColumn} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {columns.map((col, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md"
                >
                  <span className="text-sm font-medium">{col}</span>
                  <button onClick={() => handleRemoveColumn(index)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleCreate}
            disabled={!projectName.trim() || columns.length === 0}
            size="lg"
            className="w-full"
          >
            Create Project
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
