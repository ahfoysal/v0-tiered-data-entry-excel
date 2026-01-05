"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronRight, ChevronDown, Plus, Trash2, Edit2, Check, X, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

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
  allow_field_management: boolean
  data: { field_id: string; value: number }[]
  children?: Tier[]
}

interface User {
  id: string
  email: string
  is_admin: boolean
}

interface HierarchyTreeViewProps {
  tiers: Tier[]
  selectedTier: Tier | null
  onSelectTier: (tier: Tier) => void
  projectId: string
  onUpdate: () => void
  fields: Field[]
  user: User
}

export function HierarchyTreeView({
  tiers,
  selectedTier,
  onSelectTier,
  projectId,
  onUpdate,
  fields,
  user,
}: HierarchyTreeViewProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [newTierName, setNewTierName] = useState("")
  const [allowChildCreation, setAllowChildCreation] = useState(false)
  const [allowFieldManagement, setAllowFieldManagement] = useState(false)
  const [draggedTier, setDraggedTier] = useState<Tier | null>(null)
  const [dragOverTier, setDragOverTier] = useState<Tier | null>(null)

  const handleCreateRootTier = async () => {
    if (!newTierName.trim()) return

    try {
      const res = await fetch(`/api/projects/${projectId}/tiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTierName.trim(),
          parent_id: null,
          allow_child_creation: allowChildCreation,
          allow_field_management: allowFieldManagement,
        }),
      })

      if (res.ok) {
        setNewTierName("")
        setAllowChildCreation(false)
        setAllowFieldManagement(false)
        setShowCreate(false)
        onUpdate()
      }
    } catch (error) {
      console.error("[v0] Create tier failed:", error)
    }
  }

  const handleDragStart = (e: React.DragEvent, tier: Tier) => {
    setDraggedTier(tier)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, targetTier: Tier) => {
    e.preventDefault()
    if (!draggedTier || draggedTier.id === targetTier.id) return

    try {
      const res = await fetch(`/api/tiers/${draggedTier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent_id: targetTier.id }),
      })

      if (res.ok) {
        setDraggedTier(null)
        onUpdate()
      }
    } catch (error) {
      console.error("[v0] Move tier failed:", error)
    }
  }

  return (
    <div className="space-y-2">
      {tiers.length === 0 && !showCreate && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <p className="mb-4">No tiers yet</p>
          {user.is_admin && (
            <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Root Tier
            </Button>
          )}
        </div>
      )}

      {showCreate && user.is_admin && (
        <div className="space-y-3 p-3 border border-border rounded-lg bg-card">
          <Input
            placeholder="Tier name"
            value={newTierName}
            onChange={(e) => setNewTierName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateRootTier()}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="allow-child"
              checked={allowChildCreation}
              onCheckedChange={(checked) => setAllowChildCreation(checked as boolean)}
            />
            <label htmlFor="allow-child" className="text-sm cursor-pointer">
              Allow users to create children
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="allow-field-mgmt"
              checked={allowFieldManagement}
              onCheckedChange={(checked) => setAllowFieldManagement(checked as boolean)}
            />
            <label htmlFor="allow-field-mgmt" className="text-sm cursor-pointer">
              Allow users to add/remove fields
            </label>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateRootTier} size="sm" className="flex-1">
              Create
            </Button>
            <Button onClick={() => setShowCreate(false)} size="sm" variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {tiers.length > 0 && !showCreate && user.is_admin && (
        <Button onClick={() => setShowCreate(true)} size="sm" variant="outline" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Add Root Tier
        </Button>
      )}

      {tiers.map((tier) => (
        <TierNode
          key={tier.id}
          tier={tier}
          selectedTier={selectedTier}
          onSelectTier={onSelectTier}
          projectId={projectId}
          onUpdate={onUpdate}
          level={0}
          fields={fields}
          user={user}
          onDragStart={handleDragStart}
          draggedTier={draggedTier}
          setDraggedTier={setDraggedTier}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          dragOverTier={dragOverTier}
          setDragOverTier={setDragOverTier}
        />
      ))}
    </div>
  )
}

function TierNode({
  tier,
  selectedTier,
  onSelectTier,
  projectId,
  onUpdate,
  level,
  fields,
  user,
  onDragStart,
  draggedTier,
  setDraggedTier,
  onDragOver,
  onDrop,
  dragOverTier,
  setDragOverTier,
}: {
  tier: Tier
  selectedTier: Tier | null
  onSelectTier: (tier: Tier) => void
  projectId: string
  onUpdate: () => void
  level: number
  fields: Field[]
  user: User
  onDragStart: (e: React.DragEvent, tier: Tier) => void
  draggedTier: Tier | null
  setDraggedTier: (tier: Tier | null) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, tier: Tier) => void
  dragOverTier: Tier | null
  setDragOverTier: (tier: Tier | null) => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(tier.name)
  const [showCreate, setShowCreate] = useState(false)
  const [newChildName, setNewChildName] = useState("")
  const [allowChildCreation, setAllowChildCreation] = useState(false)
  const [allowFieldManagement, setAllowFieldManagement] = useState(false)

  const hasChildren = tier.children && tier.children.length > 0
  const isSelected = selectedTier?.id === tier.id

  const handleUpdateName = async () => {
    if (!editName.trim() || editName === tier.name) {
      setIsEditing(false)
      return
    }

    try {
      const res = await fetch(`/api/tiers/${tier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      })

      if (res.ok) {
        setIsEditing(false)
        onUpdate()
      }
    } catch (error) {
      console.error("[v0] Update tier name failed:", error)
    }
  }

  const handleCreateChild = async () => {
    if (!newChildName.trim()) return

    try {
      const res = await fetch(`/api/projects/${projectId}/tiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newChildName.trim(),
          parent_id: tier.id,
          allow_child_creation: allowChildCreation,
          allow_field_management: allowFieldManagement,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setNewChildName("")
        setAllowChildCreation(false)
        setAllowFieldManagement(false)
        setShowCreate(false)
        onUpdate()
      } else {
        alert(data.error || "Failed to create child tier")
      }
    } catch (error) {
      console.error("[v0] Create child failed:", error)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${tier.name}" and all its children?`)) return

    try {
      const res = await fetch(`/api/tiers/${tier.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error("[v0] Delete tier failed:", error)
    }
  }

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, tier)}
        onDragOver={onDragOver}
        onDragEnter={() => setDragOverTier(tier)}
        onDragLeave={() => setDragOverTier(null)}
        onDrop={(e) => onDrop(e, tier)}
        className={cn(
          "group flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent transition-colors",
          isSelected && "bg-primary text-primary-foreground hover:bg-primary",
          draggedTier?.id === tier.id && "opacity-50",
          dragOverTier?.id === tier.id && "ring-2 ring-primary",
          user.is_admin ? "cursor-grab active:cursor-grabbing" : "",
        )}
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
      >
        {user.is_admin && (
          <GripVertical className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex h-4 w-4 items-center justify-center shrink-0"
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <div className="h-4 w-4" />
          )}
        </button>

        {isEditing ? (
          <div className="flex-1 flex items-center gap-1">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdateName()
                if (e.key === "Escape") {
                  setEditName(tier.name)
                  setIsEditing(false)
                }
              }}
              className="h-7 text-sm"
              autoFocus
            />
            <Button onClick={handleUpdateName} size="sm" variant="ghost" className="h-7 w-7 p-0">
              <Check className="h-3 w-3" />
            </Button>
            <Button
              onClick={() => {
                setEditName(tier.name)
                setIsEditing(false)
              }}
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            <button onClick={() => onSelectTier(tier)} className="flex-1 text-left text-sm font-medium truncate">
              {tier.name}
            </button>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              {user.is_admin && (
                <>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditing(true)
                    }}
                    size="sm"
                    variant={isSelected ? "secondary" : "ghost"}
                    className="h-6 w-6 p-0"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowCreate(!showCreate)
                    }}
                    size="sm"
                    variant={isSelected ? "secondary" : "ghost"}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete()
                    }}
                    size="sm"
                    variant={isSelected ? "secondary" : "ghost"}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
              {!user.is_admin && tier.allow_child_creation && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowCreate(!showCreate)
                  }}
                  size="sm"
                  variant={isSelected ? "secondary" : "ghost"}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {showCreate && (
        <div className="ml-8 mt-2 space-y-3 p-3 border border-border rounded-lg bg-card">
          <Input
            placeholder="Child tier name"
            value={newChildName}
            onChange={(e) => setNewChildName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateChild()}
          />
          {user.is_admin && (
            <>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`allow-child-${tier.id}`}
                  checked={allowChildCreation}
                  onCheckedChange={(checked) => setAllowChildCreation(checked as boolean)}
                />
                <label htmlFor={`allow-child-${tier.id}`} className="text-sm cursor-pointer">
                  Allow creating children
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`allow-field-mgmt-${tier.id}`}
                  checked={allowFieldManagement}
                  onCheckedChange={(checked) => setAllowFieldManagement(checked as boolean)}
                />
                <label htmlFor={`allow-field-mgmt-${tier.id}`} className="text-sm cursor-pointer">
                  Allow users to add/remove fields
                </label>
              </div>
            </>
          )}
          <div className="flex gap-2">
            <Button onClick={handleCreateChild} size="sm" className="flex-1">
              Create
            </Button>
            <Button onClick={() => setShowCreate(false)} size="sm" variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isExpanded && hasChildren && (
        <div>
          {tier.children!.map((child) => (
            <TierNode
              key={child.id}
              tier={child}
              selectedTier={selectedTier}
              onSelectTier={onSelectTier}
              projectId={projectId}
              onUpdate={onUpdate}
              level={level + 1}
              fields={fields}
              user={user}
              onDragStart={onDragStart}
              draggedTier={draggedTier}
              setDraggedTier={setDraggedTier}
              onDragOver={onDragOver}
              onDrop={onDrop}
              dragOverTier={dragOverTier}
              setDragOverTier={setDragOverTier}
            />
          ))}
        </div>
      )}
    </div>
  )
}
