"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import { TeamsTreeView } from "./teams-tree-view"

interface Team {
  id: string
  name: string
}

export function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [newTeamName, setNewTeamName] = useState("")
  const [creating, setCreating] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchTeams()
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    try {
      const res = await fetch("/api/auth/me")
      const data = await res.json()
      setIsAdmin(data.user?.is_admin || false)
    } catch (error) {
      console.error("[v0] Admin check failed:", error)
    }
  }

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams")
      const data = await res.json()
      setTeams(data.teams || [])
    } catch (error) {
      console.error("[v0] Fetch teams error:", error)
      toast.error("Failed to load teams")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeamName.trim()) {
      toast.error("Team name is required")
      return
    }

    setCreating(true)
    const toastId = toast.loading("Creating team...")

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      const data = await res.json()
      setTeams([...teams, data.team])
      setNewTeamName("")
      toast.success("Team created successfully", { id: toastId })
    } catch (error: any) {
      toast.error(error.message || "Failed to create team", { id: toastId })
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return

    try {
      const res = await fetch(`/api/teams/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")

      setTeams(teams.filter((t) => t.id !== id))
      toast.success("Team deleted successfully")
    } catch (error) {
      toast.error("Failed to delete team")
    }
  }

  if (loading) return <div className="text-center py-8">Loading teams...</div>

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Create Team</h2>
        <Card className="p-6">
          <form onSubmit={handleCreateTeam} className="flex gap-2 mb-6">
            <Input
              placeholder="Enter team name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              disabled={creating}
            />
            <Button type="submit" disabled={creating} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          </form>

          <div className="space-y-2">
            {teams.map((team) => (
              <div key={team.id} className="flex items-center justify-between p-3 border rounded-md">
                <span className="font-medium">{team.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTeam(team.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <TeamsTreeView isAdmin={isAdmin} />
      </div>
    </div>
  )
}
