"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { X, Copy, Check } from "lucide-react"
import { EmployeeAutocomplete } from "@/components/ui/employee-autocomplete"
import { MultiEmployeeSelect } from "@/components/ui/multi-employee-select"

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
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null)
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    const loadTierData = async () => {
      try {
        const res = await fetch(`/api/tiers/${tier.id}/data`)

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`)
        }

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

      const field = fields.find((f) => f.id === fieldId)
      const fieldName = field?.field_name || "Field"

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

        toast.success(`${fieldName} is updated`, {
          duration: 2000,
        })
      } catch (error) {
        console.error("[v0] Update data failed:", error)
        toast.error(`Failed to update ${fieldName}`, {
          duration: 2000,
        })
      } finally {
        setSavingFieldId(null)
        delete debounceTimers.current[fieldId]
      }
    }, 500)
  }

  const handleCopyCode = async (fieldId: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedFieldId(fieldId)
      toast.success("Code copied to clipboard")
      setTimeout(() => setCopiedFieldId(null), 2000)
    } catch (error) {
      console.error("[v0] Copy failed:", error)
      toast.error("Failed to copy code")
    }
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
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-1">{tier.name}</h2>
          <p className="text-sm text-muted-foreground">
            Enter data for this tier. All fields are independent - child and parent tiers have their own data.
          </p>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No fields defined yet. Only admins can add fields.</p>
          </div>
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
                  ) : field.field_type === "code" ? (
                    <div className="relative">
                      <textarea
                        id={field.id}
                        className="w-full h-32 p-3 pr-12 border rounded-lg bg-muted text-base font-mono"
                        value={values[field.id] as string}
                        onChange={(e) => handleValueChange(field.id, e.target.value, field.field_type)}
                        placeholder="Enter code snippet..."
                        spellCheck={false}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                        onClick={() => handleCopyCode(field.id, (values[field.id] as string) || "")}
                        title="Copy code"
                      >
                        {copiedFieldId === field.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
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
                  ) : field.field_type === "employee" ? (
                    <EmployeeAutocomplete
                      value={(values[field.id] as string) || ""}
                      onChange={(value) => handleValueChange(field.id, value, field.field_type)}
                      placeholder="Search employee by ID or name..."
                    />
                  ) : field.field_type === "multi-employee" ? (
                    <MultiEmployeeSelect
                      value={(values[field.id] as string) || ""}
                      onChange={(value) => handleValueChange(field.id, value, field.field_type)}
                      placeholder="Search to add employees..."
                    />
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
