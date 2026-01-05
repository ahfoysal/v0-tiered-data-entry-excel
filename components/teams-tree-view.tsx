"use client"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Mail, Phone, Badge, Edit2 } from "lucide-react"

interface TeamMember {
  id: string
  full_name: string
  email: string
  role: string
  employee_id: string
  status: string
  phone_number: string
  is_project_lead: boolean
}

interface Team {
  id: string
  name: string
  member_count: number
  membersByRole: Record<string, TeamMember[]>
}

interface TeamsTreeViewProps {
  onEditMember?: (member: TeamMember) => void
  isAdmin: boolean
}

const roleColors: Record<string, string> = {
  "Frontend Developer": "bg-blue-100 text-blue-800",
  "Backend Developer": "bg-purple-100 text-purple-800",
  "AI Developer": "bg-pink-100 text-pink-800",
  "UI-UX Designer": "bg-green-100 text-green-800",
  "Flutter Developer": "bg-orange-100 text-orange-800",
}

export function TeamsTreeView({ onEditMember, isAdmin }: TeamsTreeViewProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())
  const [expandedRoles, setExpandedRoles] = useState<Map<string, Set<string>>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams/members")
      if (!res.ok) throw new Error("Failed to fetch teams")

      const data = await res.json()
      setTeams(data.teams)

      // Expand first 4 teams by default (departments)
      const firstFour = new Set(data.teams.slice(0, 4).map((t: Team) => t.id))
      setExpandedTeams(firstFour)
    } catch (error) {
      console.error("[v0] Fetch teams error:", error)
      toast.error("Failed to load teams")
    } finally {
      setLoading(false)
    }
  }

  const toggleTeam = (teamId: string) => {
    const newExpanded = new Set(expandedTeams)
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId)
    } else {
      newExpanded.add(teamId)
    }
    setExpandedTeams(newExpanded)
  }

  const toggleRole = (teamId: string, role: string) => {
    const teamRoles = new Map(expandedRoles)
    if (!teamRoles.has(teamId)) {
      teamRoles.set(teamId, new Set())
    }
    const roleSet = teamRoles.get(teamId)!
    if (roleSet.has(role)) {
      roleSet.delete(role)
    } else {
      roleSet.add(role)
    }
    setExpandedRoles(teamRoles)
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading teams...</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">Team Structure</h2>

      <div className="space-y-2">
        {teams.map((team) => (
          <div key={team.id} className="border rounded-lg overflow-hidden">
            {/* Team Header - Shows count by default */}
            <div
              onClick={() => toggleTeam(team.id)}
              className="flex items-center gap-3 p-4 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors border-b"
            >
              {expandedTeams.has(team.id) ? (
                <ChevronDown className="h-5 w-5 text-primary flex-shrink-0" />
              ) : (
                <ChevronRight className="h-5 w-5 text-primary flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{team.name}</h3>
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                {team.member_count} member{team.member_count !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Team Content - Shows role groups */}
            {expandedTeams.has(team.id) && (
              <div className="bg-background">
                {Object.entries(team.membersByRole).map(([role, members]) => (
                  <div key={role} className="border-t">
                    {/* Role Header */}
                    <div
                      onClick={() => toggleRole(team.id, role)}
                      className="flex items-center gap-3 p-3 pl-8 bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    >
                      {expandedRoles.get(team.id)?.has(role) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${roleColors[role] || "bg-gray-100 text-gray-800"}`}
                      >
                        {role}
                      </span>
                      <div className="text-xs text-muted-foreground ml-auto">
                        {members.length} member{members.length !== 1 ? "s" : ""}
                      </div>
                    </div>

                    {/* Members List */}
                    {expandedRoles.get(team.id)?.has(role) && (
                      <div className="bg-card">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-start gap-3 p-3 pl-12 border-t hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm truncate">{member.full_name}</p>
                                {member.is_project_lead && <Badge className="text-xs flex-shrink-0">Lead</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground">ID: {member.employee_id}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Mail className="h-3 w-3" />
                                <a href={`mailto:${member.email}`} className="truncate hover:underline">
                                  {member.email}
                                </a>
                              </div>
                              {member.phone_number && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <span>{member.phone_number}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    member.status === "Permanent"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {member.status}
                                </span>
                              </div>
                            </div>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEditMember?.(member)
                                }}
                                className="h-8 w-8 p-0 flex-shrink-0"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
