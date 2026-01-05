"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface Field {
  id: string
  field_name: string
  field_type: string
  display_order: number
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

export function DataEntryPanel({ tier, fields, onUpdate }: { tier: Tier; fields: Field[]; onUpdate: () => void }) {
  const [values, setValues] = useState<Record<string, string | number>>({})
  const [allowChildCreation, setAllowChildCreation] = useState(tier.allow_child_creation)
  const [selectedColorField, setSelectedColorField] = useState<string>("")
  const [tierFields, setTierFields] = useState<Field[]>(fields)

  useEffect(() => {
    const dataMap: Record<string, string | number> = {}
    tier.data.forEach((d) => {
      const field = tierFields.find((f) => f.id === d.field_id)
      if (field?.field_type === "number") {
        dataMap[d.field_id] = d.value ?? 0
      } else if (field?.field_type === "color") {
        dataMap[d.field_id] = d.text_value ?? "#000000"
      } else {
        dataMap[d.field_id] = d.text_value ?? ""
      }
    })
    setValues(dataMap)
    setAllowChildCreation(tier.allow_child_creation)
  }, [tier, tierFields])

  const hasChildren = tier.children && tier.children.length > 0

  const calculateAggregatedData = (t: Tier): Record<string, string | number> => {
    if (!t.children || t.children.length === 0) {
      const result: Record<string, string | number> = {}
      t.data.forEach((d) => {
        const field = tierFields.find((f) => f.id === d.field_id)
        if (field?.field_type === "number") {
          result[d.field_id] = d.value ?? 0
        } else {
          result[d.field_id] = d.text_value ?? ""
        }
      })
      return result
    }

    const aggregated: Record<string, string | number> = {}
    t.children.forEach((child) => {
      const childData = calculateAggregatedData(child)
      Object.entries(childData).forEach(([fieldId, value]) => {
        const field = tierFields.find((f) => f.id === fieldId)
        if (field?.field_type === "number") {
          aggregated[fieldId] = ((aggregated[fieldId] as number) || 0) + (value as number)
        } else if (field?.field_type === "color") {
          aggregated[fieldId] = value
        } else {
          aggregated[fieldId] = `${t.children!.length} items`
        }
      })
    })
    return aggregated
  }

  const displayValues = hasChildren ? calculateAggregatedData(tier) : values

  const handleValueChange = async (fieldId: string, value: string, fieldType: string) => {
    setValues({ ...values, [fieldId]: value })

    try {
      const body =
        fieldType === "number"
          ? { field_id: fieldId, value: Number.parseFloat(value) || 0 }
          : { field_id: fieldId, text_value: value }

      await fetch(`/api/tiers/${tier.id}/data`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      onUpdate()
    } catch (error) {
      console.error("[v0] Update data failed:", error)
    }
  }

  const handleToggleChildCreation = async (checked: boolean) => {
    setAllowChildCreation(checked)
    try {
      await fetch(`/api/tiers/${tier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allow_child_creation: checked }),
      })
      onUpdate()
    } catch (error) {
      console.error("[v0] Update permission failed:", error)
    }
  }

  const colorField = tierFields.find((f) => f.field_type === "color" && values[f.id])
  const tierBgColor = colorField ? (values[colorField.id] as string) : "transparent"

  return (
    <div className="max-w-3xl">
      <Card className="p-6" style={{ backgroundColor: tierBgColor, opacity: 0.1 }}>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-1">{tier.name}</h2>
          <p className="text-sm text-muted-foreground">
            {hasChildren
              ? `Parent tier with ${tier.children!.length} children - values are auto-calculated`
              : "Leaf tier - enter values manually"}
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="allow-child-creation"
              checked={allowChildCreation}
              onCheckedChange={(checked) => handleToggleChildCreation(checked as boolean)}
            />
            <label htmlFor="allow-child-creation" className="text-sm cursor-pointer">
              Allow users to create child tiers under this tier
            </label>
          </div>
        </div>

        {tierFields.length === 0 ? (
          <Card className="p-8 text-center bg-secondary">
            <p className="text-muted-foreground">No fields defined yet. Admin users can add fields.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            <Label className="text-sm font-medium">Data Fields</Label>
            <div className="grid grid-cols-2 gap-4">
              {tierFields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <Label htmlFor={field.id} className="text-xs text-muted-foreground">
                    {field.field_name}
                    <span className="ml-1 text-xs">({field.field_type})</span>
                  </Label>
                  {hasChildren ? (
                    <div className="px-3 py-2 bg-destructive/10 rounded-md border border-destructive/20">
                      <span className="text-sm font-semibold">{displayValues[field.id] ?? "-"}</span>
                      <span className="text-xs text-muted-foreground ml-2">(calculated)</span>
                    </div>
                  ) : (
                    <>
                      {field.field_type === "color" ? (
                        <Input
                          id={field.id}
                          type="color"
                          value={(values[field.id] as string) || "#000000"}
                          onChange={(e) => handleValueChange(field.id, e.target.value, field.field_type)}
                        />
                      ) : (
                        <Input
                          id={field.id}
                          type={
                            field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"
                          }
                          value={values[field.id] ?? (field.field_type === "number" ? 0 : "")}
                          onChange={(e) => handleValueChange(field.id, e.target.value, field.field_type)}
                          placeholder={field.field_type === "number" ? "0" : `Enter ${field.field_name}`}
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card className="mt-4 p-4 bg-secondary">
        <p className="text-sm text-secondary-foreground">
          <strong>Note:</strong>{" "}
          {hasChildren
            ? "This tier automatically calculates the sum of all children's values (shown in red). Only leaf tiers can be edited directly."
            : "This is a leaf tier. Enter numeric values for each field. When you add children, this tier will auto-calculate their sum."}
        </p>
      </Card>
    </div>
  )
}
