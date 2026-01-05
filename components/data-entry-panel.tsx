"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface Field {
  id: string
  field_name: string
  field_type: string
  display_order: number
  field_options?: string
}

interface Tier {
  id: string
  name: string
  parent_id: string | null
  level: number
  allow_child_creation: boolean
  background_color?: string
  data: { field_id: string; value: number | null; text_value: string | null }[]
  children?: Tier[]
}

export function DataEntryPanel({
  tier,
  fields,
  onUpdate,
  fieldLoading,
}: { tier: Tier; fields: Field[]; onUpdate: () => void; fieldLoading?: boolean }) {
  const [values, setValues] = useState<Record<string, string | number>>({})
  const [loading, setLoading] = useState(false)
  const [savingFieldId, setSavingFieldId] = useState<string | null>(null)
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    const loadTierData = async () => {
      try {
        const res = await fetch(`/api/tiers/${tier.id}/data`)

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`)
        }

        // Check if response is actually JSON before parsing
        const contentType = res.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Invalid response format - expected JSON")
        }

        const data = await res.json()

        const dataMap: Record<string, string | number> = {}
        data.data?.forEach((d: any) => {
          const field = fields.find((f) => f.id === d.field_id)
          if (field?.field_type === "number") {
            dataMap[d.field_id] = d.value ?? 0
          } else if (field?.field_type === "color") {
            dataMap[d.field_id] = d.text_value ?? "#000000"
          } else {
            dataMap[d.field_id] = d.text_value ?? ""
          }
        })
        setValues(dataMap)
      } catch (error) {
        console.error("[v0] Failed to load tier data:", error)
        // Fallback to tier.data if API fails
        const dataMap: Record<string, string | number> = {}
        tier.data.forEach((d) => {
          const field = fields.find((f) => f.id === d.field_id)
          if (field?.field_type === "number") {
            dataMap[d.field_id] = d.value ?? 0
          } else if (field?.field_type === "color") {
            dataMap[d.field_id] = d.text_value ?? "#000000"
          } else {
            dataMap[d.field_id] = d.text_value ?? ""
          }
        })
        setValues(dataMap)
      }
    }

    loadTierData()
  }, [tier.id, fields])

  const colorField = fields.find((f) => f.field_type === "color" && values[f.id])
  const tierBgColor = colorField ? (values[colorField.id] as string) : "transparent"

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm("Delete this field?")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/tiers/${tier.id}/fields?fieldId=${fieldId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete field")
      onUpdate()
    } catch (error) {
      console.error("[v0] Error deleting field:", error)
      alert("Failed to delete field")
    } finally {
      setLoading(false)
    }
  }

  const handleValueChange = async (fieldId: string, value: string, fieldType: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }))

    if (debounceTimers.current[fieldId]) {
      clearTimeout(debounceTimers.current[fieldId])
    }

    debounceTimers.current[fieldId] = setTimeout(async () => {
      console.log("[v0] Field change detected:", { fieldId, value, fieldType })
      setSavingFieldId(fieldId)

      try {
        const body =
          fieldType === "number"
            ? { field_id: fieldId, value: Number.parseFloat(value) || 0 }
            : { field_id: fieldId, text_value: value }

        console.log("[v0] Saving to database:", body)

        const res = await fetch(`/api/tiers/${tier.id}/data`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

        const data = await res.json()
        console.log("[v0] Save response:", { ok: res.ok, status: res.status, data })

        if (!res.ok) throw new Error(data.error || "Failed to save")
      } catch (error) {
        console.error("[v0] Update data failed:", error)
        alert("Failed to save. Please try again.")
      } finally {
        setSavingFieldId(null)
        delete debounceTimers.current[fieldId]
      }
    }, 500)
  }

  if (fieldLoading) {
    return (
      <div className="max-w-3xl">
        <Card className="p-6 flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading fields...</div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <Card className="p-6" style={{ backgroundColor: tierBgColor ? `${tierBgColor}15` : "transparent" }}>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-1">{tier.name}</h2>
          <p className="text-sm text-muted-foreground">
            Enter data for this tier. All fields are independent - child and parent tiers have their own data.
          </p>
        </div>

        {fields.length === 0 ? (
          <Card className="p-8 text-center bg-secondary">
            <p className="text-muted-foreground">No fields defined yet. Only admins can add fields.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            <Label className="text-sm font-medium">Data Fields</Label>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {fields.map((field) => (
                <div key={field.id} className="border rounded-lg p-4 bg-card relative">
                  {savingFieldId === field.id && (
                    <div className="absolute top-2 right-12 opacity-60">
                      <div className="animate-spin">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" opacity="0.25" />
                          <path d="M4 12a8 8 0 0 1 8-8" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Label htmlFor={field.id} className="text-sm font-medium block">
                        {field.field_name}
                        <span className="ml-2 text-xs text-muted-foreground">({field.field_type})</span>
                      </Label>
                    </div>
                    <button
                      onClick={() => handleDeleteField(field.id)}
                      disabled={loading}
                      className="p-1 hover:bg-destructive/10 rounded disabled:opacity-50"
                      title="Delete field"
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                  {field.field_type === "color" ? (
                    <Input
                      id={field.id}
                      type="color"
                      className="h-12 cursor-pointer"
                      value={(values[field.id] as string) || "#000000"}
                      onChange={(e) => handleValueChange(field.id, e.target.value, field.field_type)}
                    />
                  ) : field.field_type === "number" ? (
                    <Input
                      id={field.id}
                      type="number"
                      className="h-10 text-base"
                      value={values[field.id] ?? 0}
                      onChange={(e) => handleValueChange(field.id, e.target.value, field.field_type)}
                      placeholder="0"
                    />
                  ) : field.field_type === "date" ? (
                    <Input
                      id={field.id}
                      type="date"
                      className="h-10 text-base"
                      value={values[field.id] as string}
                      onChange={(e) => handleValueChange(field.id, e.target.value, field.field_type)}
                    />
                  ) : field.field_type === "time" ? (
                    <Input
                      id={field.id}
                      type="time"
                      className="h-10 text-base"
                      value={values[field.id] as string}
                      onChange={(e) => handleValueChange(field.id, e.target.value, field.field_type)}
                    />
                  ) : field.field_type === "datetime" ? (
                    <Input
                      id={field.id}
                      type="datetime-local"
                      className="h-10 text-base"
                      value={values[field.id] as string}
                      onChange={(e) => handleValueChange(field.id, e.target.value, field.field_type)}
                    />
                  ) : field.field_type === "email" ? (
                    <Input
                      id={field.id}
                      type="email"
                      className="h-10 text-base"
                      value={values[field.id] as string}
                      onChange={(e) => handleValueChange(field.id, e.target.value, field.field_type)}
                      placeholder="example@email.com"
                    />
                  ) : field.field_type === "phone" ? (
                    <Input
                      id={field.id}
                      type="tel"
                      className="h-10 text-base"
                      value={values[field.id] as string}
                      onChange={(e) => handleValueChange(field.id, e.target.value, field.field_type)}
                      placeholder="+1 (555) 000-0000"
                    />
                  ) : field.field_type === "checkbox" ? (
                    <div className="flex items-center gap-2">
                      <input
                        id={field.id}
                        type="checkbox"
                        className="w-5 h-5 cursor-pointer rounded"
                        checked={(values[field.id] as string) === "true"}
                        onChange={(e) =>
                          handleValueChange(field.id, e.target.checked ? "true" : "false", field.field_type)
                        }
                      />
                      <Label htmlFor={field.id} className="cursor-pointer font-normal">
                        Checked
                      </Label>
                    </div>
                  ) : field.field_type === "textarea" ? (
                    <textarea
                      id={field.id}
                      className="w-full h-24 p-3 border rounded-lg bg-background text-base"
                      value={values[field.id] as string}
                      onChange={(e) => handleValueChange(field.id, e.target.value, field.field_type)}
                      placeholder={`Enter ${field.field_name}`}
                    />
                  ) : field.field_type === "dropdown" ? (
                    <select
                      id={field.id}
                      className="h-10 w-full px-3 border rounded-lg bg-background text-base"
                      value={(values[field.id] as string) || ""}
                      onChange={(e) => handleValueChange(field.id, e.target.value, field.field_type)}
                    >
                      <option value="">Select an option</option>
                      {field.field_options
                        ?.split("\n")
                        .map((option: string) => option.trim())
                        .filter((option: string) => option.length > 0)
                        .map((option: string) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <Input
                      id={field.id}
                      type="text"
                      className="h-10 text-base"
                      value={values[field.id] as string}
                      onChange={(e) => handleValueChange(field.id, e.target.value, field.field_type)}
                      placeholder={`Enter ${field.field_name}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
