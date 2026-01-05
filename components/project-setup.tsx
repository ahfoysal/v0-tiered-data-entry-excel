"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ProjectSetupProps {
  onCreateProject: (
    projectName: string,
    columns: string[],
    options?: { template?: string; teamId?: string; teamSource?: string; fields?: string[]; roles?: string[] },
  ) => void
}

export function ProjectSetup({ onCreateProject }: ProjectSetupProps) {
  const [projectName, setProjectName] = useState("")
  const [columns, setColumns] = useState<string[]>(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"])
  const [newColumn, setNewColumn] = useState("")
  const [template, setTemplate] = useState<"simple" | "team-based" | "custom" | "role-based">("simple")
  const [teams, setTeams] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [teamSource, setTeamSource] = useState<"all" | "specific">("all")
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [fieldTemplates, setFieldTemplates] = useState<any[]>([])

  useEffect(() => {
    if (template === "team-based" || template === "custom" || template === "role-based") {
      fetchTeams()
    }
    if (template === "custom" || template === "role-based") {
      fetchFieldTemplates()
    }
    if (template === "role-based") {
      fetchRoles()
    }
  }, [template])

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams")
      const data = await res.json()
      setTeams(data.teams || [])
    } catch (error) {
      console.error("Failed to fetch teams:", error)
    }
  }

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/dropdowns")
      const data = await res.json()
      setRoles(data.roles || [])
    } catch (error) {
      console.error("Failed to fetch roles:", error)
    }
  }

  const fetchFieldTemplates = async () => {
    try {
      const res = await fetch("/api/field-templates")
      const data = await res.json()
      setFieldTemplates(data.templates || [])
    } catch (error) {
      console.error("Failed to fetch field templates:", error)
    }
  }

  const handleAddColumn = () => {
    if (newColumn.trim() && !columns.includes(newColumn.trim())) {
      setColumns([...columns, newColumn.trim()])
      setNewColumn("")
    }
  }

  const handleRemoveColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index))
  }

  const handleCreate = async () => {
    if (!projectName.trim()) {
      alert("Please enter a project name")
      return
    }

    if (template === "simple") {
      // No validation needed - just project name
    } else if (
      (template === "team-based" || template === "custom" || template === "role-based") &&
      selectedFields.length === 0
    ) {
      alert("Please select at least one field template")
      return
    }

    if (template === "team-based" && !selectedTeamId) {
      alert("Please select a team")
      return
    }

    if (template === "custom" && teamSource === "specific" && !selectedTeamId) {
      alert("Please select a team")
      return
    }

    if (template === "role-based" && selectedRoles.length === 0) {
      alert("Please select at least one role")
      return
    }

    if (template === "role-based" && teamSource === "specific" && !selectedTeamId) {
      alert("Please select a team")
      return
    }

    setLoading(true)
    try {
      if (template === "simple") {
        await onCreateProject(projectName.trim(), columns)
      } else if (template === "team-based") {
        await onCreateProject(projectName.trim(), columns, {
          template: "team-based",
          teamId: selectedTeamId,
          fields: selectedFields,
        })
      } else if (template === "custom") {
        await onCreateProject(projectName.trim(), columns, {
          template: "custom",
          teamSource: teamSource === "all" ? "all" : selectedTeamId,
          fields: selectedFields,
        })
      } else if (template === "role-based") {
        await onCreateProject(projectName.trim(), columns, {
          template: "role-based",
          teamSource: teamSource === "all" ? "all" : selectedTeamId,
          roles: selectedRoles,
          fields: selectedFields,
        })
      }
    } catch (error) {
      console.error("Error creating project:", error)
      alert("Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">Create New Project</CardTitle>
          <CardDescription>
            Choose how to structure your project - simple, team-based, custom blueprint, or role-based
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Project Template</Label>
            <div className="flex flex-col gap-2">
              <Button
                variant={template === "simple" ? "default" : "outline"}
                onClick={() => setTemplate("simple")}
                className="justify-start"
              >
                Simple
              </Button>
              <Button
                variant={template === "team-based" ? "default" : "outline"}
                onClick={() => setTemplate("team-based")}
                className="justify-start"
              >
                Team-Based
              </Button>
              <Button
                variant={template === "custom" ? "default" : "outline"}
                onClick={() => setTemplate("custom")}
                className="justify-start"
              >
                Custom Blueprint (All Roles)
              </Button>
              <Button
                variant={template === "role-based" ? "default" : "outline"}
                onClick={() => setTemplate("role-based")}
                className="justify-start"
              >
                Role-Based Blueprint (Specific Roles)
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              placeholder="e.g., Company Attendance Tracker"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          {template === "simple" ? (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Simple project created with just the name. Add fields and structure after creation.
              </p>
            </div>
          ) : template === "team-based" ? (
            <>
              <div className="space-y-3">
                <Label>Select Team</Label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">Choose a team...</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <Label>Select Fields to Include</Label>
                <p className="text-sm text-muted-foreground">These fields will be pre-populated for each team member</p>
                <div className="grid grid-cols-2 gap-2">
                  {fieldTemplates.map((template) => (
                    <label key={template.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(template.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFields([...selectedFields, template.id])
                          } else {
                            setSelectedFields(selectedFields.filter((f) => f !== template.id))
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {template.name} <span className="text-xs text-muted-foreground">({template.field_type})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : template === "role-based" ? (
            <>
              <div className="space-y-3">
                <Label>Team Source</Label>
                <div className="flex gap-2">
                  <Button
                    variant={teamSource === "all" ? "default" : "outline"}
                    onClick={() => setTeamSource("all")}
                    className="flex-1"
                  >
                    All Teams
                  </Button>
                  <Button
                    variant={teamSource === "specific" ? "default" : "outline"}
                    onClick={() => setTeamSource("specific")}
                    className="flex-1"
                  >
                    Specific Team
                  </Button>
                </div>
              </div>

              {teamSource === "specific" && (
                <div className="space-y-3">
                  <Label>Select Team</Label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="">Choose a team...</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-3">
                <Label>Select Roles to Include</Label>
                <p className="text-sm text-muted-foreground">
                  Only members with these roles will be included in the project
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {roles.map((role) => (
                    <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRoles([...selectedRoles, role.name])
                          } else {
                            setSelectedRoles(selectedRoles.filter((r) => r !== role.name))
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{role.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Select Field Templates to Include in Member Tiers</Label>
                <p className="text-sm text-muted-foreground">
                  These field templates will be added to each member tier for data entry
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {fieldTemplates.map((template) => (
                    <label key={template.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(template.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFields([...selectedFields, template.id])
                          } else {
                            setSelectedFields(selectedFields.filter((f) => f !== template.id))
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {template.name} <span className="text-xs text-muted-foreground">({template.field_type})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <Label>Team Source</Label>
                <div className="flex gap-2">
                  <Button
                    variant={teamSource === "all" ? "default" : "outline"}
                    onClick={() => setTeamSource("all")}
                    className="flex-1"
                  >
                    All Teams
                  </Button>
                  <Button
                    variant={teamSource === "specific" ? "default" : "outline"}
                    onClick={() => setTeamSource("specific")}
                    className="flex-1"
                  >
                    Specific Team
                  </Button>
                </div>
              </div>

              {teamSource === "specific" && (
                <div className="space-y-3">
                  <Label>Select Team</Label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="">Choose a team...</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-3">
                <Label>Select Field Templates to Include in Member Tiers</Label>
                <p className="text-sm text-muted-foreground">
                  These field templates will be added to each member tier for data entry
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {fieldTemplates.map((template) => (
                    <label key={template.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(template.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFields([...selectedFields, template.id])
                          } else {
                            setSelectedFields(selectedFields.filter((f) => f !== template.id))
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {template.name} <span className="text-xs text-muted-foreground">({template.field_type})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <Button
            onClick={handleCreate}
            disabled={
              !projectName.trim() ||
              ((template === "team-based" || template === "custom" || template === "role-based") &&
                selectedFields.length === 0) ||
              (template === "team-based" && !selectedTeamId) ||
              (template === "custom" && teamSource === "specific" && !selectedTeamId) ||
              (template === "role-based" && selectedRoles.length === 0) ||
              (template === "role-based" && teamSource === "specific" && !selectedTeamId) ||
              loading
            }
            size="lg"
            className="w-full"
          >
            {loading ? "Creating..." : "Create Project"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
