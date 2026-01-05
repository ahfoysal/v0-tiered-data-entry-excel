"use client"

import { useState } from "react"
import { Button } from "@chakra-ui/react"
import { Plus, ChevronLeft } from "react-feather"
import type { User } from "@/types" // Assuming User type is defined in "@/types"

export function HierarchyWorkspace({
  projectId,
  user,
  onBack,
  onLogout,
}: {
  projectId: string
  user: User
  onBack: () => void
  onLogout: () => void
}) {
  const [isCreatingRootTier, setIsCreatingRootTier] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTier, setSelectedTier] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleCreateRootTier = () => {
    // Logic to create root tier
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold">Hierarchy</h2>
      <div className="flex gap-2">
        {user.is_admin && (
          <Button
            onClick={handleCreateRootTier}
            size="sm"
            variant="outline"
            disabled={isCreatingRootTier || isLoading}
            className="gap-1 bg-transparent"
          >
            <Plus className="h-3 w-3" />
            {isCreatingRootTier
              ? selectedTier
                ? "Creating Child..."
                : "Creating..."
              : selectedTier
                ? "Add Child"
                : "Add Root Tier"}
          </Button>
        )}
        <Button onClick={onBack} variant="ghost" size="sm" className="h-6 w-6 p-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
