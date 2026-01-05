"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, LogOut, Settings } from "lucide-react"
import { HierarchyTreeView } from "@/components/hierarchy-tree-view"
import { DataEntryPanel } from "@/components/data-entry-panel"
import { FieldManager } from "@/components/field-manager"

interface User {
  id: string
  email: string
  is_admin: boolean
}

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
  data: { field_id: string; value: number }[]
  children?: Tier[]
}

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
  const [fields, setFields] = useState<Field[]>([])
  const [tiers, setTiers] = useState<Tier[]>([])
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null)
  const [showFieldManager, setShowFieldManager] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [fieldsRes, tiersRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/fields`),
        fetch(`/api/projects/${projectId}/tiers`),
      ])

      const fieldsData = await fieldsRes.json()
      const tiersData = await tiersRes.json()

      setFields(fieldsData.fields || [])
      setTiers(buildTree(tiersData.tiers || []))
    } catch (error) {
      console.error("[v0] Load data failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const buildTree = (flatTiers: Tier[]): Tier[] => {
    const map = new Map<string, Tier>()
    flatTiers.forEach((tier) => {
      map.set(tier.id, { ...tier, children: [] })
    })

    const roots: Tier[] = []
    flatTiers.forEach((tier) => {
      const node = map.get(tier.id)!
      if (tier.parent_id) {
        const parent = map.get(tier.parent_id)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading workspace...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="outline" size="sm" className="gap-2 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
              Projects
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Hierarchy Workspace</h1>
              <p className="text-sm text-muted-foreground">
                {user.email} {user.is_admin ? "(Admin)" : "(User)"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {user.is_admin && (
              <Button onClick={() => setShowFieldManager(!showFieldManager)} variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Manage Fields
              </Button>
            )}
            <Button onClick={onLogout} variant="outline" className="gap-2 bg-transparent">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {showFieldManager && user.is_admin && (
        <FieldManager
          projectId={projectId}
          fields={fields}
          onUpdate={loadData}
          onClose={() => setShowFieldManager(false)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r border-border bg-card p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Hierarchy</h2>
          <HierarchyTreeView
            tiers={tiers}
            selectedTier={selectedTier}
            onSelectTier={setSelectedTier}
            projectId={projectId}
            onUpdate={loadData}
            fields={fields}
            user={user}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {selectedTier ? (
            <DataEntryPanel tier={selectedTier} fields={fields} onUpdate={loadData} />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              {tiers.length === 0
                ? user.is_admin
                  ? "Create a tier to get started"
                  : "No tiers available yet"
                : "Select a tier to view and edit data"}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
