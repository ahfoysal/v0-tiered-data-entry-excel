"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronDown, Plus, Trash2 } from "lucide-react"
import type { TierNode } from "@/app/page"
import { cn } from "@/lib/utils"

interface HierarchyTreeProps {
  node: TierNode
  selectedNode: TierNode
  onSelectNode: (node: TierNode) => void
  onAddChild: (parentId: string) => void
  onDeleteNode: (nodeId: string) => void
  level?: number
}

export function HierarchyTree({
  node,
  selectedNode,
  onSelectNode,
  onAddChild,
  onDeleteNode,
  level = 0,
}: HierarchyTreeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(node.name)

  const hasChildren = node.children.length > 0
  const isSelected = selectedNode.id === node.id

  if (editName !== node.name && !isEditing) {
    setEditName(node.name)
  }

  return (
    <div className="select-none">
      <div
        className={cn(
          "group flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent transition-colors",
          isSelected && "bg-primary text-primary-foreground hover:bg-primary",
        )}
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
      >
        <button onClick={() => setIsExpanded(!isExpanded)} className="flex h-4 w-4 items-center justify-center">
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

        <button
          onClick={() => onSelectNode(node)}
          onDoubleClick={() => setIsEditing(true)}
          className="flex-1 text-left text-sm font-medium"
        >
          {node.name}
        </button>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onAddChild(node.id)
            }}
            size="sm"
            variant={isSelected ? "secondary" : "ghost"}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
          {level > 0 && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteNode(node.id)
              }}
              size="sm"
              variant={isSelected ? "secondary" : "ghost"}
              className="h-6 w-6 p-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {isExpanded &&
        hasChildren &&
        node.children.map((child) => (
          <HierarchyTree
            key={child.id}
            node={child}
            selectedNode={selectedNode}
            onSelectNode={onSelectNode}
            onAddChild={onAddChild}
            onDeleteNode={onDeleteNode}
            level={level + 1}
          />
        ))}
    </div>
  )
}
