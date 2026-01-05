"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronRight, ChevronDown, Plus, Trash2, Edit2, ArrowUp, ArrowDown, ArrowRight, ArrowLeft } from "lucide-react"
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
  is_draggable?: boolean
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

  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`expanded-tiers-${projectId}`)
      return saved ? new Set(JSON.parse(saved)) : new Set<string>()
    }
    return new Set<string>()
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`expanded-tiers-${projectId}`, JSON.stringify(Array.from(expandedTiers)))
    }
  }, [expandedTiers, projectId])

  const toggleExpanded = (tierId: string) => {
    const newExpanded = new Set(expandedTiers)
    if (newExpanded.has(tierId)) {
      newExpanded.delete(tierId)
    } else {
      newExpanded.add(tierId)
    }
    setExpandedTiers(newExpanded)
  }

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
    if (!tier.is_draggable) {
      e.preventDefault()
      return
    }
    setDraggedTier(tier)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/html", tier.id)
  }

  const handleDragOver = (e: React.DragEvent, tier: Tier) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverTier(tier)

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    setDragDirection(e.clientY < midpoint ? "above" : "below")
  }

  const handleDrop = async (e: React.DragEvent, targetTier: Tier) => {
    e.preventDefault()
    console.log("[v0] Drop event - draggedTier:", draggedTier?.name, "targetTier:", targetTier.name)

    if (!draggedTier || draggedTier.id === targetTier.id) {
      console.log("[v0] Invalid drop - same tier or no dragged tier")
      setDraggedTier(null)
      setDragOverTier(null)
      setDragDirection(null)
      return
    }

    try {
      let newParentId = draggedTier.parent_id
      let targetIndex = 0

      // If dropping on a different parent, make the target tier the new parent
      if (draggedTier.parent_id !== targetTier.parent_id) {
        console.log("[v0] Moving to different parent - making targetTier the parent")
        newParentId = targetTier.id
        targetIndex = 0
      } else {
        // Same parent - reorder within siblings
        console.log("[v0] Reordering within same parent")
        const siblings = tiers.filter((t) => t.parent_id === targetTier.parent_id)
        targetIndex = siblings.findIndex((t) => t.id === targetTier.id)

        if (dragDirection === "below") {
          targetIndex += 1
        }
      }

      console.log("[v0] Sending reorder request:", { newParentId, targetIndex, draggedTierId: draggedTier.id })

      const res = await fetch(`/api/tiers/${draggedTier.id}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newIndex: Math.max(0, targetIndex),
          parentId: draggedTier.parent_id,
          newParentId: newParentId,
        }),
      })

      console.log("[v0] Reorder response status:", res.status)

      if (res.ok) {
        console.log("[v0] Reorder successful")
        toast.success("Tier moved successfully")
        setDraggedTier(null)
        setDragOverTier(null)
        setDragDirection(null)
        onUpdate()
      } else {
        const error = await res.json()
        console.error("[v0] Reorder failed:", error)
        toast.error("Failed to move tier: " + error.error)
      }
    } catch (error) {
      console.error("[v0] Move tier failed:", error)
      toast.error("Error moving tier")
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
          handleDragEnd={handleDragEnd}
          isExpanded={expandedTiers.has(tier.id)}
          onToggleExpanded={toggleExpanded}
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
  isExpanded,
  onToggleExpanded,
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
  isExpanded: boolean
  onToggleExpanded: (tierId: string) => void
}) {
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
  const [showReorderMenu, setShowReorderMenu] = useState(false)
  const { isLoading, setIsLoading } = useLoading()

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

  const handleMoveUp = async () => {
    const siblings = (
      tier.parent_id
        ? window.tiers.filter((t) => t.parent_id === tier.parent_id)
        : window.tiers.filter((t) => !t.parent_id)
    ).sort((a, b) => (a.display_order || 0) - (b.display_order || 0))

    const currentIndex = siblings.findIndex((s) => s.id === tier.id)
    if (currentIndex <= 0) return

    const newIndex = currentIndex - 1
    setIsLoading(true)

    try {
      const response = await fetch(`/api/tiers/${tier.id}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newIndex,
          parentId: tier.parent_id,
        }),
      })

      if (response.ok) {
        toast.success(`${tier.name} moved up`)
        onUpdate()
        setShowReorderMenu(false)
      } else {
        toast.error("Failed to move tier up")
      }
    } catch (error) {
      console.error("[v0] Move up error:", error)
      toast.error("Error moving tier up")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMoveDown = async () => {
    const siblings = (
      tier.parent_id
        ? window.tiers.filter((t) => t.parent_id === tier.parent_id)
        : window.tiers.filter((t) => !t.parent_id)
    ).sort((a, b) => (a.display_order || 0) - (b.display_order || 0))

    const currentIndex = siblings.findIndex((s) => s.id === tier.id)
    if (currentIndex >= siblings.length - 1) return

    const newIndex = currentIndex + 1
    setIsLoading(true)

    try {
      const response = await fetch(`/api/tiers/${tier.id}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newIndex,
          parentId: tier.parent_id,
        }),
      })

      if (response.ok) {
        toast.success(`${tier.name} moved down`)
        onUpdate()
        setShowReorderMenu(false)
      } else {
        toast.error("Failed to move tier down")
      }
    } catch (error) {
      console.error("[v0] Move down error:", error)
      toast.error("Error moving tier down")
    } finally {
      setIsLoading(false)
    }
  }

  const handleIndent = async () => {
    const siblings = (
      tier.parent_id
        ? window.tiers.filter((t) => t.parent_id === tier.parent_id)
        : window.tiers.filter((t) => !t.parent_id)
    ).sort((a, b) => (a.display_order || 0) - (b.display_order || 0))

    const currentIndex = siblings.findIndex((s) => s.id === tier.id)
    if (currentIndex === 0) {
      toast.error("Cannot indent first tier")
      return
    }

    const newParentId = siblings[currentIndex - 1].id
    setIsLoading(true)

    try {
      const response = await fetch(`/api/tiers/${tier.id}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newIndex: 0,
          parentId: tier.parent_id,
          newParentId,
        }),
      })

      if (response.ok) {
        toast.success(`${tier.name} moved under ${siblings[currentIndex - 1].name}`)
        onUpdate()
        setShowReorderMenu(false)
      } else {
        toast.error("Failed to indent tier")
      }
    } catch (error) {
      console.error("[v0] Indent error:", error)
      toast.error("Error indenting tier")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDedent = async () => {
    if (!tier.parent_id) {
      toast.error("Cannot dedent root tier")
      return
    }

    const parent = window.tiers.find((t) => t.id === tier.parent_id)
    if (!parent || !parent.parent_id) {
      toast.error("Cannot dedent to root level")
      return
    }

    const siblings = window.tiers
      .filter((t) => t.parent_id === parent.parent_id)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))

    const parentIndex = siblings.findIndex((s) => s.id === parent.id)
    const newIndex = parentIndex + 1

    setIsLoading(true)

    try {
      const response = await fetch(`/api/tiers/${tier.id}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newIndex,
          parentId: tier.parent_id,
          newParentId: parent.parent_id,
        }),
      })

      if (response.ok) {
        toast.success(`${tier.name} moved to parent level`)
        onUpdate()
        setShowReorderMenu(false)
      } else {
        toast.error("Failed to dedent tier")
      }
    } catch (error) {
      console.error("[v0] Dedent error:", error)
      toast.error("Error dedenting tier")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex items-center gap-1 p-2 rounded hover:bg-accent/50 group relative",
          isSelected && "bg-primary/10 border-l-2 border-primary",
        )}
        onDragStart={(e) => onDragStart(e, tier)}
        onDragOver={(e) => onDragOver(e, tier)}
        onDrop={(e) => onDrop(e, tier)}
        onDragEnd={handleDragEnd}
        draggable={tier.is_draggable ?? true}
        style={{ paddingLeft: `${level * 16}px` }}
      >
        {hasChildren && (
          <button onClick={() => onToggleExpanded(tier.id)} className="p-0.5 hover:bg-accent rounded">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectTier(tier)}>
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleUpdateName}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdateName()
                if (e.key === "Escape") {
                  setEditName(tier.name)
                  setIsEditing(false)
                }
              }}
              disabled={isLoading || isRenaming}
              autoFocus
              className="h-7"
            />
          ) : (
            <div className="truncate text-sm">
              {tier.name}
              {hasChildren && <span className="text-xs text-muted-foreground ml-1">({tier.children?.length})</span>}
            </div>
          )}
        </div>

        {/* Action buttons - unchanged from existing code */}
        {user.is_admin && (
          <div className="absolute right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto rounded-md p-1 shadow-sm">
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
              onClick={async (e) => {
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
            <Button
              onClick={(e) => {
                e.stopPropagation()
                setShowReorderMenu(!showReorderMenu)
              }}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              style={{
                color: isSelected ? "hsl(var(--primary-foreground))" : "currentColor",
              }}
              title="Reorder tier"
              disabled={isLoading}
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
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Button>
          </div>
        )}
      </div>

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
              isExpanded={isExpanded}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      )}

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

      {showReorderMenu && (
        <div className="absolute left-full top-0 ml-2 bg-white border border-border rounded-md shadow-lg z-50 flex flex-col gap-1 p-1">
          <Button
            onClick={(e) => {
              e.stopPropagation()
              handleMoveUp()
            }}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 hover:bg-accent"
            title="Move up"
            disabled={isLoading}
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              handleMoveDown()
            }}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 hover:bg-accent"
            title="Move down"
            disabled={isLoading}
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              handleIndent()
            }}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 hover:bg-accent"
            title="Indent (move under previous)"
            disabled={isLoading}
          >
            <ArrowRight className="h-3 w-3" />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              handleDedent()
            }}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 hover:bg-accent"
            title="Dedent (move to parent level)"
            disabled={isLoading}
          >
            <ArrowLeft className="h-3 w-3" />
          </Button>
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
