"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronRight, ChevronDown, Plus, Trash2, Edit2, Check, X, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useLoading } from "@/contexts/loading-context"

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
  const [dragDirection, setDragDirection] = useState<"above" | "below" | null>(null)
  const { isLoading } = useLoading()

  const getTierColor = (tier: Tier) => {
    const colorField = fields.find((f) => f.field_type === "color")
    if (!colorField) return undefined

    const colorData = tier.data?.find((d) => d.field_id === colorField.id)
    return colorData?.value as string | undefined
  }

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
    e.dataTransfer.setData("text/html", tier.id)
  }

  const handleDragOver = (e: React.DragEvent, tier: Tier) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverTier(tier)

    // Determine if dragging above or below the target
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    setDragDirection(e.clientY < midpoint ? "above" : "below")
  }

  const handleDrop = async (e: React.DragEvent, targetTier: Tier) => {
    e.preventDefault()
    if (!draggedTier || draggedTier.id === targetTier.id) {
      setDraggedTier(null)
      setDragOverTier(null)
      setDragDirection(null)
      return
    }

    // Only allow reordering if tiers have the same parent
    if (draggedTier.parent_id !== targetTier.parent_id) {
      setDraggedTier(null)
      setDragOverTier(null)
      setDragDirection(null)
      return
    }

    try {
      const siblings = tiers.filter((t) => t.parent_id === targetTier.parent_id)
      let targetIndex = siblings.findIndex((t) => t.id === targetTier.id)

      // Adjust index based on drag direction
      if (dragDirection === "below") {
        targetIndex += 1
      }

      const res = await fetch(`/api/tiers/${draggedTier.id}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newIndex: Math.max(0, targetIndex),
          parentId: draggedTier.parent_id,
        }),
      })

      if (res.ok) {
        setDraggedTier(null)
        setDragOverTier(null)
        setDragDirection(null)
        onUpdate()
      }
    } catch (error) {
      console.error("[v0] Reorder tier failed:", error)
    }
  }

  const handleDragEnd = () => {
    setDraggedTier(null)
    setDragOverTier(null)
    setDragDirection(null)
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
            disabled={isLoading}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="allow-child"
              checked={allowChildCreation}
              onCheckedChange={(checked) => setAllowChildCreation(checked as boolean)}
              disabled={isLoading}
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
              disabled={isLoading}
            />
            <label htmlFor="allow-field-mgmt" className="text-sm cursor-pointer">
              Allow users to add/remove fields
            </label>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateRootTier} size="sm" className="flex-1" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create"}
            </Button>
            <Button
              onClick={() => setShowCreate(false)}
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {tiers.length > 0 && !showCreate && user.is_admin && (
        <Button
          onClick={() => setShowCreate(true)}
          size="sm"
          variant="outline"
          className="w-full gap-2"
          disabled={isLoading}
        >
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
          dragDirection={dragDirection}
          setDragDirection={setDragDirection}
          handleDragEnd={handleDragEnd} // Added handleDragEnd prop
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
  dragDirection,
  setDragDirection,
  handleDragEnd,
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
  onDragOver: (e: React.DragEvent, tier: Tier) => void
  onDrop: (e: React.DragEvent, tier: Tier) => void
  dragOverTier: Tier | null
  setDragOverTier: (tier: Tier | null) => void
  dragDirection: "above" | "below" | null
  setDragDirection: (direction: "above" | "below" | null) => void
  handleDragEnd: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(tier.name)
  const [showCreate, setShowCreate] = useState(false)
  const [newChildName, setNewChildName] = useState("")
  const [allowChildCreation, setAllowChildCreation] = useState(false)
  const [allowFieldManagement, setAllowFieldManagement] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isCreatingChild, setIsCreatingChild] = useState(false)
  const { isLoading } = useLoading()

  const hasChildren = tier.children && tier.children.length > 0
  const isSelected = selectedTier?.id === tier.id

  const tierColor = (() => {
    const colorField = fields.find((f) => f.field_type === "color")
    if (!colorField) return undefined
    const colorData = tier.data?.find((d) => d.field_id === colorField.id)
    return colorData?.value as string | undefined
  })()

  const handleUpdateName = async () => {
    if (!editName.trim() || editName === tier.name) {
      setIsEditing(false)
      return
    }

    setIsRenaming(true)
    const toastId = toast.loading(`Renaming "${tier.name}"...`)

    try {
      const res = await fetch(`/api/tiers/${tier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      })

      if (res.ok) {
        toast.dismiss(toastId)
        toast.success(`Tier renamed to "${editName}"`, {
          description: "Changes saved successfully",
        })
        setIsEditing(false)
        setIsRenaming(false)
        onUpdate()
      } else {
        toast.dismiss(toastId)
        toast.error("Failed to rename tier", {
          description: "Please try again",
        })
        setIsRenaming(false)
      }
    } catch (error) {
      console.error("[v0] Update tier name failed:", error)
      toast.dismiss(toastId)
      toast.error("Error renaming tier", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
      setIsRenaming(false)
    }
  }

  const handleCreateChild = async () => {
    if (!newChildName.trim()) return

    setIsCreatingChild(true)
    console.log("[v0] handleCreateChild called with name:", newChildName)
    const toastId = toast.loading(`Creating tier "${newChildName}"...`)

    try {
      console.log("[v0] Sending POST to /api/projects/${projectId}/tiers")
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

      console.log("[v0] Response status:", res.status)
      const data = await res.json()
      console.log("[v0] Response data:", data)

      if (res.ok) {
        console.log("[v0] Create successful, dismissing loading toast")
        toast.dismiss(toastId)
        toast.success(`Tier "${newChildName}" created`, {
          description: "Child tier added successfully",
        })
        setNewChildName("")
        setAllowChildCreation(false)
        setAllowFieldManagement(false)
        setShowCreate(false)
        setIsCreatingChild(false)
        onUpdate()
      } else {
        console.log("[v0] Create failed with error:", data.error)
        toast.dismiss(toastId)
        toast.error("Failed to create tier", {
          description: data.error || "Please try again",
        })
        setIsCreatingChild(false)
      }
    } catch (error) {
      console.error("[v0] Create child failed:", error)
      toast.dismiss(toastId)
      toast.error("Error creating tier", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
      setIsCreatingChild(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${tier.name}" and all its children?`)) return

    setIsDeleting(true)
    const toastId = toast.loading(`Deleting "${tier.name}"...`)

    try {
      const res = await fetch(`/api/tiers/${tier.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.dismiss(toastId)
        toast.success(`Tier deleted`, {
          description: `"${tier.name}" and all children removed`,
        })
        setIsDeleting(false)
        onUpdate()
      } else {
        toast.dismiss(toastId)
        toast.error("Failed to delete tier", {
          description: "Please try again",
        })
        setIsDeleting(false)
      }
    } catch (error) {
      console.error("[v0] Delete tier failed:", error)
      toast.dismiss(toastId)
      toast.error("Error deleting tier", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
      setIsDeleting(false)
    }
  }

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    const toastId = toast.loading(`Duplicating "${tier.name}"...`)

    try {
      const res = await fetch(`/api/tiers/${tier.id}`, {
        method: "POST",
      })

      if (res.ok) {
        toast.dismiss(toastId)
        toast.success(`Tier duplicated`, {
          description: `"${tier.name} Copy" created successfully`,
        })
        setIsDuplicating(false)
        onUpdate()
      } else {
        toast.dismiss(toastId)
        toast.error("Failed to duplicate tier", {
          description: "Please try again",
        })
        setIsDuplicating(false)
      }
    } catch (error) {
      console.error("[v0] Duplicate tier failed:", error)
      toast.dismiss(toastId)
      toast.error("Error duplicating tier", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
      setIsDuplicating(false)
    }
  }

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, tier)}
        onDragOver={(e) => onDragOver(e, tier)}
        onDragEnter={() => setDragOverTier(tier)}
        onDragLeave={() => setDragOverTier(null)}
        onDrop={(e) => onDrop(e, tier)}
        onDragEnd={handleDragEnd}
        className={cn(
          "group relative flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent transition-all duration-150",
          isSelected && "bg-primary text-primary-foreground hover:bg-primary",
          draggedTier?.id === tier.id && "opacity-50 bg-muted",
          dragOverTier?.id === tier.id && dragDirection === "above" && "border-t-2 border-primary",
          dragOverTier?.id === tier.id && dragDirection === "below" && "border-b-2 border-primary",
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
              disabled={isLoading || isRenaming}
            />
            <Button
              onClick={handleUpdateName}
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 bg-green-100 hover:bg-green-200 text-green-700"
              disabled={isLoading || isRenaming}
            >
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
              disabled={isLoading || isRenaming}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            <button
              onClick={() => onSelectTier(tier)}
              className="flex-1 text-left text-sm font-medium truncate inline-flex items-center px-2 py-1 rounded"
              style={tierColor ? { backgroundColor: tierColor, color: getContrastColor(tierColor) } : {}}
            >
              {tier.name}
              {tier.children && tier.children.length > 0 && (
                <span className="ml-2 text-xs opacity-60 font-normal">({tier.children.length})</span>
              )}
            </button>

            <div
              className="absolute right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto rounded-md p-1 shadow-sm"
              style={{
                backgroundColor: isSelected ? "hsl(var(--primary))" : "white",
              }}
            >
              {user.is_admin && (
                <>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditing(true)
                    }}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    style={{
                      color: isSelected ? "hsl(var(--primary-foreground))" : "currentColor",
                    }}
                    title="Edit tier name"
                    disabled={isLoading}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowCreate(!showCreate)
                    }}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    style={{
                      color: isSelected ? "hsl(var(--primary-foreground))" : "currentColor",
                    }}
                    title="Add child tier"
                    disabled={isLoading}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={async (e) => {
                      e.stopPropagation()
                      await handleDuplicate()
                    }}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    style={{
                      color: isSelected ? "hsl(var(--primary-foreground))" : "currentColor",
                    }}
                    title="Duplicate tier"
                    disabled={isLoading || isDuplicating}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3"
                    >
                      <rect x="3" y="3" width="8" height="8"></rect>
                      <path d="M13 3h8v8"></path>
                      <path d="M3 13v8h8"></path>
                      <rect x="13" y="13" width="8" height="8"></rect>
                    </svg>
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete()
                    }}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:text-destructive"
                    style={{
                      color: isSelected ? "hsl(var(--primary-foreground))" : "currentColor",
                    }}
                    title="Delete tier"
                    disabled={isLoading || isDeleting}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
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
            disabled={isLoading || isCreatingChild}
          />
          {user.is_admin && (
            <>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`allow-child-${tier.id}`}
                  checked={allowChildCreation}
                  onCheckedChange={(checked) => setAllowChildCreation(checked as boolean)}
                  disabled={isLoading || isCreatingChild}
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
                  disabled={isLoading || isCreatingChild}
                />
                <label htmlFor={`allow-field-mgmt-${tier.id}`} className="text-sm cursor-pointer">
                  Allow users to add/remove fields
                </label>
              </div>
            </>
          )}
          <div className="flex gap-2">
            <Button onClick={handleCreateChild} size="sm" className="flex-1" disabled={isLoading || isCreatingChild}>
              {isCreatingChild ? "Creating..." : "Create"}
            </Button>
            <Button
              onClick={() => setShowCreate(false)}
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={isLoading || isCreatingChild}
            >
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
              dragDirection={dragDirection}
              setDragDirection={setDragDirection}
              handleDragEnd={handleDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace("#", "")
  const r = Number.parseInt(hex.substring(0, 2), 16)
  const g = Number.parseInt(hex.substring(2, 4), 16)
  const b = Number.parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? "#000000" : "#FFFFFF"
}
