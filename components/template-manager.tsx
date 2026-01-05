"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"

interface Template {
  id: string
  name: string
  description?: string
  field_count: number
}

interface Field {
  id: string
  field_name: string
  field_type: string
  field_options?: string
}

export function TemplateManager({ user }: { user: { is_admin: boolean } }) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateDesc, setNewTemplateDesc] = useState("")
  const [loading, setLoading] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)
  const [templateFields, setTemplateFields] = useState<Field[]>([])
  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldType, setNewFieldType] = useState("string")

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/field-templates")
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error("[v0] Load templates error:", error)
    }
  }

  const loadTemplateFields = async (id: string) => {
    try {
      const res = await fetch(`/api/field-templates/${id}/fields`)
      const data = await res.json()
      setTemplateFields(data.fields || [])
      setEditingTemplate(id)
    } catch (error) {
      console.error("[v0] Load template fields error:", error)
    }
  }

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/field-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplateName,
          description: newTemplateDesc,
        }),
      })
      if (res.ok) {
        setNewTemplateName("")
        setNewTemplateDesc("")
        loadTemplates()
      }
    } catch (error) {
      console.error("[v0] Create template error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/field-templates/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        loadTemplates()
        if (editingTemplate === id) {
          setEditingTemplate(null)
        }
      }
    } catch (error) {
      console.error("[v0] Delete template error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddField = async () => {
    if (!newFieldName.trim() || !editingTemplate) return
    try {
      const res = await fetch(`/api/field-templates/${editingTemplate}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_name: newFieldName,
          field_type: newFieldType,
        }),
      })
      if (res.ok) {
        setNewFieldName("")
        setNewFieldType("string")
        loadTemplateFields(editingTemplate)
      }
    } catch (error) {
      console.error("[v0] Add field error:", error)
    }
  }

  const handleRemoveField = async (fieldId: string) => {
    if (!editingTemplate) return
    try {
      const res = await fetch(`/api/field-templates/${editingTemplate}/fields/${fieldId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        loadTemplateFields(editingTemplate)
      }
    } catch (error) {
      console.error("[v0] Remove field error:", error)
    }
  }

  if (!user.is_admin) {
    return null
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Field Templates (Admin Only)</h3>
          <p className="text-sm text-muted-foreground">Create and manage reusable field templates</p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Template name (e.g., Attendance)"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button onClick={handleCreateTemplate} disabled={loading || !newTemplateName.trim()} className="gap-2">
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </div>

          {templates.length === 0 ? (
            <Card className="p-8 text-center bg-muted">
              <p className="text-muted-foreground">No templates yet. Create your first template above.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-medium">Templates ({templates.length})</div>
              <div className="grid gap-2">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                    <div>
                      <span className="font-medium">{template.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({template.field_count} fields)</span>
                      {template.description && (
                        <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => loadTemplateFields(template.id)}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteTemplate(template.id)}
                        variant="ghost"
                        size="sm"
                        disabled={loading}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-96 overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Template Fields</h3>
              <Button onClick={() => setEditingTemplate(null)} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Field name"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="string">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="time">Time</option>
                  <option value="datetime">Date & Time</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="url">URL</option>
                  <option value="color">Color</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="textarea">Text Area</option>
                  <option value="employee">Employee</option>
                  <option value="multi-employee">Multi Employee</option>
                  <option value="code">Code Snippet</option>
                </select>
                <Button onClick={handleAddField} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              {templateFields.map((field) => (
                <div key={field.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                  <div>
                    <span className="font-medium">{field.field_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">({field.field_type})</span>
                  </div>
                  <Button
                    onClick={() => handleRemoveField(field.id)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
