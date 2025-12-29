"use client"

import type React from "react"

import { useState } from "react"
import { HierarchyTree } from "@/components/hierarchy-tree"
import { DataEntryForm } from "@/components/data-entry-form"
import { HeatMapView } from "@/components/heatmap-view"
import { ProjectSetup } from "@/components/project-setup"
import { Button } from "@/components/ui/button"
import { FileDown, FileUp } from "lucide-react"
import { exportToExcel } from "@/lib/excel-export"
import { importFromExcel } from "@/lib/excel-import"

export interface TierNode {
  id: string
  name: string
  data: Record<string, number> // Fixed columns with numeric values
  children: TierNode[]
}

export interface Project {
  name: string
  columns: string[] // e.g., ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  rootNode: TierNode
}

export default function HierarchyDataEntry() {
  const [project, setProject] = useState<Project | null>(null)
  const [selectedNode, setSelectedNode] = useState<TierNode | null>(null)

  const handleCreateProject = (projectName: string, columns: string[]) => {
    const initialNode: TierNode = {
      id: "1",
      name: "Root",
      data: columns.reduce((acc, col) => ({ ...acc, [col]: 0 }), {}),
      children: [],
    }

    setProject({
      name: projectName,
      columns,
      rootNode: initialNode,
    })
    setSelectedNode(initialNode)
  }

  const isNameUnique = (name: string, excludeId?: string, node?: TierNode): boolean => {
    if (!project || !node) return true
    if (node.id !== excludeId && node.name.toLowerCase() === name.toLowerCase()) {
      return false
    }
    return node.children.every((child) => isNameUnique(name, excludeId, child))
  }

  const updateNode = (nodeId: string, updates: Partial<TierNode>, node?: TierNode): TierNode | null => {
    if (!project || !node) return null

    if (updates.name !== undefined) {
      if (!isNameUnique(updates.name, nodeId, project.rootNode)) {
        alert(`The name "${updates.name}" is already in use. Please choose a unique name.`)
        return node
      }
    }

    if (node.id === nodeId) {
      const updatedNode = { ...node, ...updates }
      if (selectedNode?.id === nodeId) {
        setSelectedNode(updatedNode)
      }
      return updatedNode
    }

    return {
      ...node,
      children: node.children
        .map((child) => updateNode(nodeId, updates, child))
        .filter((n): n is TierNode => n !== null),
    }
  }

  const addChildNode = (parentId: string) => {
    if (!project) return

    let counter = 1
    let newName = "New Tier"
    while (!isNameUnique(newName, undefined, project.rootNode)) {
      newName = `New Tier ${counter}`
      counter++
    }

    const newNode: TierNode = {
      id: Date.now().toString(),
      name: newName,
      data: project.columns.reduce((acc, col) => ({ ...acc, [col]: 0 }), {}),
      children: [],
    }

    const addChild = (node: TierNode): TierNode => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [...node.children, newNode],
        }
      }
      return {
        ...node,
        children: node.children.map(addChild),
      }
    }

    setProject({
      ...project,
      rootNode: addChild(project.rootNode),
    })
    setSelectedNode(newNode)
  }

  const deleteNode = (nodeId: string) => {
    if (!project || nodeId === project.rootNode.id) return

    const removeNode = (node: TierNode): TierNode => {
      return {
        ...node,
        children: node.children.filter((child) => child.id !== nodeId).map(removeNode),
      }
    }

    setProject({
      ...project,
      rootNode: removeNode(project.rootNode),
    })
    setSelectedNode(project.rootNode)
  }

  const handleExport = () => {
    if (!project) return
    exportToExcel(project.rootNode)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const importedProject = await importFromExcel(file)
      setProject(importedProject)
      setSelectedNode(importedProject.rootNode)
    } catch (error) {
      alert(`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }

    // Reset input
    event.target.value = ""
  }

  if (!project) {
    return <ProjectSetup onCreateProject={handleCreateProject} />
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-card-foreground">{project.name}</h1>
            <p className="text-sm text-muted-foreground">Hierarchical data with heatmap visualization</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => document.getElementById("excel-import")?.click()}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <FileUp className="h-4 w-4" />
              Import Excel
            </Button>
            <input id="excel-import" type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
            <Button onClick={handleExport} size="lg" className="gap-2">
              <FileDown className="h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Tree View */}
        <div className="w-80 border-r border-border bg-card p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">Hierarchy</h2>
          <HierarchyTree
            node={project.rootNode}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
            onAddChild={addChildNode}
            onDeleteNode={deleteNode}
          />
        </div>

        {/* Middle Panel - Data Entry */}
        <div className="flex-1 overflow-y-auto bg-background p-6">
          {selectedNode && (
            <DataEntryForm
              node={selectedNode}
              columns={project.columns}
              onUpdateNode={(updates) => {
                const updated = updateNode(selectedNode.id, updates, project.rootNode)
                if (updated) {
                  setProject({ ...project, rootNode: updated })
                }
              }}
            />
          )}
        </div>

        {/* Right Panel - Heatmap */}
        <div className="w-96 border-l border-border bg-card p-6 overflow-y-auto">
          {selectedNode && <HeatMapView node={selectedNode} columns={project.columns} onSelectNode={setSelectedNode} />}
        </div>
      </div>
    </div>
  )
}
