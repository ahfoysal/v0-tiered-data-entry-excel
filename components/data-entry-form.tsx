"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import type { TierNode } from "@/app/page"

interface DataEntryFormProps {
  node: TierNode
  columns: string[]
  onUpdateNode: (updates: Partial<TierNode>) => void
}

export function DataEntryForm({ node, columns, onUpdateNode }: DataEntryFormProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState(node.name)

  const hasChildren = node.children.length > 0

  const calculateAggregatedData = (tierNode: TierNode): Record<string, number> => {
    if (tierNode.children.length === 0) {
      return tierNode.data
    }

    const aggregated: Record<string, number> = {}
    tierNode.children.forEach((child) => {
      const childData = calculateAggregatedData(child)
      Object.entries(childData).forEach(([key, value]) => {
        aggregated[key] = (aggregated[key] || 0) + value
      })
    })

    return aggregated
  }

  const displayData = hasChildren ? calculateAggregatedData(node) : node.data

  const updateName = (name: string) => {
    if (name.trim()) {
      onUpdateNode({ name: name.trim() })
      setIsEditingName(false)
    }
  }

  if (tempName !== node.name && !isEditingName) {
    setTempName(node.name)
  }

  const updateField = (fieldName: string, value: string) => {
    const numValue = Number.parseFloat(value) || 0
    onUpdateNode({
      data: {
        ...node.data,
        [fieldName]: numValue,
      },
    })
  }

  return (
    <div className="max-w-2xl">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-card-foreground mb-1">Tier Details</h2>
          <p className="text-sm text-muted-foreground">
            {hasChildren
              ? `This tier has ${node.children.length} children - values are auto-calculated`
              : "Enter numeric values for each column"}
          </p>
        </div>

        <div className="mb-6">
          <Label htmlFor="tier-name" className="text-sm font-medium">
            Tier Name
          </Label>
          <Input
            id="tier-name"
            value={isEditingName ? tempName : node.name}
            onChange={(e) => {
              setTempName(e.target.value)
              setIsEditingName(true)
            }}
            onBlur={() => {
              if (isEditingName) {
                updateName(tempName)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateName(tempName)
              } else if (e.key === "Escape") {
                setTempName(node.name)
                setIsEditingName(false)
              }
            }}
            className="mt-1.5"
            placeholder="e.g., CEO, Department Head, Team Lead"
            disabled={hasChildren}
          />
          <p className="text-xs text-muted-foreground mt-1.5">Tier names must be unique across all levels</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Data Values</Label>
            <span className="text-xs text-muted-foreground">{columns.length} columns</span>
          </div>

          {hasChildren ? (
            // Parent tier - show calculated values
            <div className="grid grid-cols-2 gap-4">
              {columns.map((columnName) => (
                <div key={columnName} className="space-y-1.5">
                  <Label htmlFor={columnName} className="text-xs text-muted-foreground">
                    {columnName}
                  </Label>
                  <div className="px-3 py-2 bg-secondary rounded-md border border-border">
                    <span className="text-sm font-semibold text-foreground">{displayData[columnName] || 0}</span>
                    <span className="text-xs text-muted-foreground ml-2">(calculated)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Leaf tier - editable inputs
            <div className="grid grid-cols-2 gap-4">
              {columns.map((columnName) => (
                <div key={columnName} className="space-y-1.5">
                  <Label htmlFor={columnName} className="text-xs text-muted-foreground">
                    {columnName}
                  </Label>
                  <Input
                    id={columnName}
                    type="number"
                    value={node.data[columnName] || 0}
                    onChange={(e) => updateField(columnName, e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Info Card */}
      <Card className="mt-4 p-4 bg-secondary">
        <p className="text-sm text-secondary-foreground">
          <strong>Tip:</strong>{" "}
          {hasChildren
            ? "Parent tiers automatically sum all their children's values. Only leaf nodes (without children) can be edited manually."
            : "This is a leaf node. Enter values manually. If you add children, this tier will auto-calculate their sum."}
        </p>
      </Card>
    </div>
  )
}
