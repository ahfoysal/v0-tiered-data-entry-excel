"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { UserPlus, Trash2, Shield, ShieldOff } from "lucide-react"

interface User {
  id: string
  email: string
  is_admin: boolean
  created_at: string
}

export function UserManagement({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<User[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const res = await fetch("/api/users")
    const data = await res.json()
    setUsers(data.users || [])
  }

  const handleAddUser = async () => {
    if (!email || !password) return

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, is_admin: isAdmin }),
    })

    if (res.ok) {
      setEmail("")
      setPassword("")
      setIsAdmin(false)
      setShowAddForm(false)
      loadUsers()
    } else {
      const data = await res.json()
      alert(data.error || "Failed to create user")
    }
  }

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_admin: !currentStatus }),
    })

    if (res.ok) {
      loadUsers()
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    const res = await fetch(`/api/users/${userId}`, {
      method: "DELETE",
    })

    if (res.ok) {
      loadUsers()
    } else {
      const data = await res.json()
      alert(data.error || "Failed to delete user")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">User Management</h2>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {showAddForm && (
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold">Create New User</h3>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_admin"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="is_admin">Make this user an admin</Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddUser}>Create User</Button>
            <Button onClick={() => setShowAddForm(false)} variant="outline">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{user.email}</div>
                <div className="text-sm text-muted-foreground">
                  {user.is_admin ? "Admin" : "User"} • Created {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={user.id === currentUserId}
                >
                  {user.is_admin ? (
                    <>
                      <ShieldOff className="h-4 w-4" />
                      Remove Admin
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Make Admin
                    </>
                  )}
                </Button>
                {user.id !== currentUserId && (
                  <Button
                    onClick={() => handleDeleteUser(user.id)}
                    variant="outline"
                    size="sm"
                    className="gap-2 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
