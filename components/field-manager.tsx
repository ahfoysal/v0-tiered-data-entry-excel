"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus } from "lucide-react"

interface Field {
  id: string
  field_name: string
  field_type: string
  display_order: number
}

export function FieldManager({
  projectId,
  fields,
  onUpdate,
  onClose,
}: {
  projectId: string
  fields: Field[]
  onUpdate: () => void
  onClose: () => void
}) {
  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldType, setNewFieldType] = useState("number")
  const [loading, setLoading] = useState(false)

  const handleAddField = async () => {
    if (!newFieldName.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field_name: newFieldName.trim(), field_type: newFieldType }),
      })

      if (res.ok) {
        setNewFieldName("")
        setNewFieldType("number")
        onUpdate()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to add field")
      }
    } catch (error) {
      console.error("[v0] Add field failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm("Delete this field? All data for this field will be lost.")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/fields?fieldId=${fieldId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error("[v0] Delete field failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-b border-border bg-secondary p-4">
      <Card className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Field Manager</h3>
            <p className="text-sm text-muted-foreground">Add or remove data fields for this project (admin only)</p>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="New field name (e.g., Monday, Task Name)"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddField()}
              disabled={loading}
              className="flex-1"
            />
            <Select value={newFieldType} onValueChange={setNewFieldType} disabled={loading}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="color">Color</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddField} disabled={loading || !newFieldName.trim()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Field
            </Button>
          </div>

          {fields.length === 0 ? (
            <Card className="p-8 text-center bg-muted">
              <p className="text-muted-foreground">No fields yet. Add your first field above.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-medium">Current Fields ({fields.length})</div>
              <div className="grid gap-2">
                {fields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                    <div>
                      <span className="font-medium">{field.field_name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({field.field_type})</span>
                    </div>
                    <Button
                      onClick={() => handleDeleteField(field.id)}
                      variant="ghost"
                      size="sm"
                      disabled={loading}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
