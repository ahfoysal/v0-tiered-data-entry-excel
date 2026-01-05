"use client"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Upload, X } from "lucide-react"
import { toast } from "sonner"

interface Field {
  id: string
  field_name: string
  field_type: string
  display_order: number
  field_options?: string
}

interface Template {
  id: string
  name: string
}

export function FieldManager({
  tierId,
  fields: initialFields,
  onUpdate,
}: {
  tierId: string
  fields: Field[]
  onUpdate: () => void
}) {
  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldType, setNewFieldType] = useState("string")
  const [newFieldOptions, setNewFieldOptions] = useState("")
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showTemplateImport, setShowTemplateImport] = useState(false)
  const [fields, setFields] = useState<Field[]>(initialFields)

  useEffect(() => {
    const loadData = async () => {
      try {
        const templatesRes = await fetch("/api/field-templates")
        if (templatesRes.ok) {
          const data = await templatesRes.json()
          setTemplates(data.templates || [])
        }
        setFields(initialFields)
      } catch (error) {
        console.error("[v0] Error loading data:", error)
      }
    }
    loadData()
  }, [tierId, initialFields])

  const handleAddField = async () => {
    if (!newFieldName.trim()) return

    const toastId = toast.loading("Creating new field...")
    setLoading(true)
    try {
      const res = await fetch(`/api/tiers/${tierId}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_name: newFieldName,
          field_type: newFieldType,
          field_options: newFieldType === "dropdown" ? newFieldOptions : null,
          display_order: fields.length,
        }),
      })

      if (!res.ok) throw new Error("Failed to add field")

      toast.dismiss(toastId)
      toast.success(`Field "${newFieldName}" created successfully`)

      setNewFieldName("")
      setNewFieldOptions("")
      setNewFieldType("string")
      setShowAddForm(false)
      onUpdate()
    } catch (error) {
      console.error("[v0] Error adding field:", error)
      toast.dismiss(toastId)
      toast.error("Failed to add field")
    } finally {
      setLoading(false)
    }
  }

  const handleImportTemplate = async (templateId: string) => {
    const loadingToastId = toast.loading("Importing template...")
    setLoading(true)
    try {
      const res = await fetch(`/api/tiers/${tierId}/import-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to import template")
      }

      toast.dismiss(loadingToastId)
      toast.success("Template imported successfully!")
      setShowTemplateImport(false)
      onUpdate()
    } catch (error) {
      toast.dismiss(loadingToastId)
      toast.error("Failed to import template: " + error)
      console.error("[v0] Error importing template:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm("Delete this field?")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/tiers/${tierId}/fields/${fieldId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete field")

      setFields(fields.filter((f) => f.id !== fieldId))
      onUpdate()
    } catch (error) {
      console.error("[v0] Error deleting field:", error)
      alert("Failed to delete field")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-b border-border bg-secondary p-4 mb-6">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Button
              onClick={() => setShowTemplateImport(!showTemplateImport)}
              variant="outline"
              size="sm"
              title="Import from template"
              disabled={loading}
              className="gap-1"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>

            {/* Template import side drawer */}
            {showTemplateImport && templates.length > 0 && (
              <div className="fixed inset-0 z-40">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/20" onClick={() => setShowTemplateImport(false)} />
                {/* Side drawer */}
                <div className="absolute right-0 top-0 bottom-0 w-80 bg-card border-l border-border shadow-xl z-50 flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="font-semibold">Select Template</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setShowTemplateImport(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleImportTemplate(template.id)}
                        disabled={loading}
                        className="w-full text-left text-sm px-3 py-2 rounded hover:bg-muted disabled:opacity-50 transition-colors"
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Add field button */}
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              variant="outline"
              size="sm"
              title="Add new field"
              disabled={loading}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>

        {showAddForm && (
          <div className="mb-4 p-3 bg-muted rounded-lg space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Field name (e.g., Monday, Task Name)"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
              <Select value={newFieldType} onValueChange={setNewFieldType} disabled={loading}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="color">Color</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="dropdown">Dropdown</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="time">Time</SelectItem>
                  <SelectItem value="datetime">DateTime</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newFieldType === "dropdown" && (
              <div>
                <label className="text-xs font-medium block mb-1">Options (one per line)</label>
                <Textarea
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                  value={newFieldOptions}
                  onChange={(e) => setNewFieldOptions(e.target.value)}
                  disabled={loading}
                  className="min-h-20"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleAddField} disabled={loading || !newFieldName.trim()} className="gap-1">
                <Plus className="h-4 w-4" />
                Create Field
              </Button>
              <Button onClick={() => setShowAddForm(false)} variant="outline" disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
