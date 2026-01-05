"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useLoading } from "@/contexts/loading-context"
import type { Tier } from "@/types"
import { getTierColor } from "@/utils/getTierColor" // Import getTierColor function

interface Field {
  id: string
  field_name: string
  field_type: string
  display_order: number
}

interface User {
  id: string
  email: string
  is_admin: boolean
}

interface HierarchyTreeViewProps {
  projectId: string
  tiers: Tier[]
  selectedTierId: string | null
  onSelectTier: (tierId: string) => void
  onUpdate: () => void
  user: User
}

export function HierarchyTreeView({
  projectId,
  tiers,
  onUpdate,
  selectedTierId,
  onSelectTier,
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
  const router = useRouter()

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
          selectedTierId={selectedTierId}
          onSelectTier={onSelectTier}
          onUpdate={onUpdate}
          user={user}
          projectId={projectId}
          onToggleExpanded={toggleExpanded}
          expandedTiers={expandedTiers}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          handleDragEnd={handleDragEnd}
          tiers={tiers} // Added tiers prop for reorder functions
        />
      ))}
    </div>
  )
}

interface TierNodeProps {
  tier: Tier
  level?: number
  selectedTierId: string | null
  onSelectTier: (tierId: string) => void
  onUpdate: () => void
  user: User
  projectId: string
  onToggleExpanded: (tierId: string) => void
  expandedTiers: Set<string>
  handleDragStart: (e: React.DragEvent, tier: Tier) => void
  handleDragOver: (e: React.DragEvent, tier: Tier) => void
  handleDrop: (e: React.DragEvent, targetTier: Tier) => void
  handleDragEnd: () => void
  tiers: Tier[] // Added tiers prop for reorder functions
}

function TierNode({
  tier,
  level = 0,
  selectedTierId,
  onSelectTier,
  onUpdate,
  user,
  projectId,
  onToggleExpanded,
  expandedTiers,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  tiers, // Added tiers to destructuring
}: TierNodeProps) {
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
  const isSelected = selectedTierId === tier.id
  const isExpanded = expandedTiers.has(tier.id)

  const tierColor = getTierColor(tier)

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

    if (!tier?.id) {
      toast.error("Cannot create tier", {
        description: "Parent tier ID is missing",
      })
      return
    }

    setIsCreatingChild(true)
    console.log("[v0] handleCreateChild called with name:", newChildName, "parent_id:", tier.id)
    const toastId = toast.loading(`Creating tier "${newChildName}"...`)

    try {
      const url = `/api/projects/${projectId}/tiers`
      console.log("[v0] Sending POST to", url, "with parent_id:", tier.id)
      const res = await fetch(url, {
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
        toast.dismiss(toastId)
        toast.success(`Tier "${newChildName}" created`, {
          description: "Child tier added successfully",
        })
        setNewChildName("")
        setAllowChildCreation(false)
        setAllowFieldManagement(false)
        setShowCreate(false)
        setIsCreatingChild(false)
        if (data.tier?.id) {
          onToggleExpanded(tier.id)
          onSelectTier(data.tier.id)
        }
        onUpdate()
      } else {
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

      const data = await res.json()

      if (res.ok) {
        toast.dismiss(toastId)
        toast.success(`Tier duplicated`, {
          description: `"${tier.name} Copy" created successfully`,
        })
        if (data.tier?.id) {
          if (tier.parent_id) {
            onToggleExpanded(tier.parent_id)
          }
          onSelectTier(data.tier.id)
        }
        setIsDuplicating(false)
        onUpdate()
      } else {
        toast.dismiss(toastId)
        toast.error("Failed to duplicate tier", {
          description: data.error || "Please try again",
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
    const parentTier = tier.parent_id ? tiers.find((t) => t.id === tier.parent_id) : null
    const siblings = parentTier ? parentTier.children : tiers.filter((t) => !t.parent_id)
    const currentIndex = siblings.findIndex((s: Tier) => s.id === tier.id)
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
    const parentTier = tier.parent_id ? tiers.find((t) => t.id === tier.parent_id) : null
    const siblings = parentTier ? parentTier.children : tiers.filter((t) => !t.parent_id)
    const currentIndex = siblings.findIndex((s: Tier) => s.id === tier.id)
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
    const parentTier = tier.parent_id ? tiers.find((t) => t.id === tier.parent_id) : null
    const siblings = parentTier ? parentTier.children : tiers.filter((t) => !t.parent_id)
    const currentIndex = siblings.findIndex((s: Tier) => s.id === tier.id)
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

    const parent = tiers.find((t) => t.id === tier.parent_id)
    if (!parent || !parent.parent_id) {
      toast.error("Cannot dedent to root level")
      return
    }

    const grandparent = tiers.find((t) => t.id === parent.parent_id)
    if (!grandparent) {
      toast.error("Cannot find parent tier")
      return
    }

    const siblings = grandparent.children || []
    const parentIndex = siblings.findIndex((s: Tier) => s.id === parent.id)
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
    <div className="relative">
      {level > 0 && (
        <div
          className="absolute left-2 top-0 bottom-0 border-l border-border"
          style={{
            height: "100%",
            top: "-8px",
          }}
        />
      )}

      <div className="flex gap-1 relative">
        {/* Horizontal connector from vertical line */}
        {level > 0 && (
          <div
            className="absolute left-2 top-6 border-t border-border"
            style={{
              width: "12px",
              height: "1px",
            }}
          />
        )}

        <div className="flex-shrink-0 w-6 flex items-center justify-center relative">
          {tier.children && tier.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpanded(tier.id)
              }}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center hover:bg-primary/10 rounded transition-all duration-200 text-primary hover:scale-110"
              title="Toggle children"
            >
              {expandedTiers.has(tier.id) ? (
                <ChevronDown className="h-5 w-5 font-bold" />
              ) : (
                <ChevronRight className="h-5 w-5 font-bold" />
              )}
            </button>
          )}
          {!tier.children || (tier.children.length === 0 && <div className="flex-shrink-0 w-5" />)}
        </div>

        <div
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 cursor-pointer group relative",
            isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted/50",
          )}
          onClick={() => onSelectTier(tier.id)}
          onDoubleClick={() => setIsEditing(true)}
          onDragStart={(e) => handleDragStart(e, tier)}
          onDragOver={(e) => handleDragOver(e, tier)}
          onDrop={(e) => handleDrop(e, tier)}
          onDragEnd={handleDragEnd}
          draggable={tier.is_draggable !== false}
        >
          {isEditing ? (
            <div className="flex gap-1 items-center">
              <Input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdateName()
                  if (e.key === "Escape") setIsEditing(false)
                }}
                onClick={(e) => e.stopPropagation()}
                disabled={isRenaming}
                className="h-6 text-sm"
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleUpdateName}
                disabled={isRenaming}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => {
                  setIsEditing(false)
                  setEditName(tier.name)
                }}
                disabled={isRenaming}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 truncate">
                <span className="font-medium">{tier.name}</span>
                {tier.children && tier.children.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">({tier.children?.length || 0})</span>
                )}
              </div>

              {!isEditing && user.is_admin && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {tier.children && tier.children.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowReorderMenu(!showReorderMenu)
                      }}
                      disabled={isLoading}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowCreate(!showCreate)
                    }}
                    disabled={isCreatingChild}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditing(true)
                    }}
                    disabled={isRenaming}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDuplicate()
                    }}
                    disabled={isDuplicating}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete()
                    }}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Reorder menu */}
          {showReorderMenu && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg p-2 z-10">
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start gap-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  handleMoveUp()
                }}
              >
                <ArrowUp className="h-3 w-3" />
                Move Up
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start gap-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  handleMoveDown()
                }}
              >
                <ArrowDown className="h-3 w-3" />
                Move Down
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start gap-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  handleIndent()
                }}
              >
                <ArrowRight className="h-3 w-3" />
                Indent
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start gap-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDedent()
                }}
              >
                <ArrowLeft className="h-3 w-3" />
                Dedent
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Create child form */}
      {showCreate && (
        <div className="ml-6 space-y-2 mt-2 p-3 border border-border rounded-lg bg-card">
          <Input
            placeholder="Child tier name"
            value={newChildName}
            onChange={(e) => setNewChildName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateChild()}
            disabled={isCreatingChild}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id={`child-allow-${tier.id}`}
              checked={allowChildCreation}
              onCheckedChange={(checked) => setAllowChildCreation(checked as boolean)}
              disabled={isCreatingChild}
            />
            <label htmlFor={`child-allow-${tier.id}`} className="text-xs cursor-pointer">
              Allow child creation
            </label>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateChild} size="sm" className="flex-1" disabled={isCreatingChild}>
              {isCreatingChild ? "Creating..." : "Create"}
            </Button>
            <Button
              onClick={() => setShowCreate(false)}
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={isCreatingChild}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Render children */}
      {isExpanded && tier.children && tier.children.length > 0 && (
        <div className="ml-3">
          {tier.children?.map((child: Tier) => (
            <TierNode
              key={child.id}
              tier={child}
              level={level + 1}
              selectedTierId={selectedTierId}
              onSelectTier={onSelectTier}
              onUpdate={onUpdate}
              user={user}
              projectId={projectId}
              onToggleExpanded={onToggleExpanded}
              expandedTiers={expandedTiers}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
              handleDragEnd={handleDragEnd}
              tiers={tiers} // Pass tiers to child TierNodes
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
