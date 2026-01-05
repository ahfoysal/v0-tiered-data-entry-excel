"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, Edit2, Upload } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface Team {
  id: string
  name: string
}

interface Employee {
  id: string
  employee_id: string
  full_name: string
  phone_number?: string
  gitlab_username?: string
  official_mail?: string
  role: string
  team_id: string
  team_name: string
  shift: string
  status: string
  is_project_lead: boolean
}

interface DropdownOptions {
  roles: { id: string; name: string }[]
  shifts: { id: string; name: string }[]
  statuses: { id: string; name: string }[]
}

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOptions>({
    roles: [],
    shifts: [],
    statuses: [],
  })
  const [importing, setImporting] = useState(false)
  const [importToastId, setImportToastId] = useState<string | number | null>(null)

  const [form, setForm] = useState({
    employee_id: "",
    full_name: "",
    phone_number: "",
    gitlab_username: "",
    official_mail: "",
    role: "",
    team_id: "",
    shift: "",
    status: "",
    is_project_lead: false,
  })

  useEffect(() => {
    fetchEmployees()
    fetchTeams()
    fetchDropdownOptions()
  }, [])

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees")
      const data = await res.json()
      setEmployees(data.employees || [])
    } catch (error) {
      console.error("[v0] Fetch employees error:", error)
      toast.error("Failed to load employees")
    }
  }

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams")
      const data = await res.json()
      setTeams(data.teams || [])
    } catch (error) {
      console.error("[v0] Fetch teams error:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDropdownOptions = async () => {
    try {
      const res = await fetch("/api/dropdowns")
      const data = await res.json()
      setDropdownOptions(data)
    } catch (error) {
      console.error("[v0] Fetch dropdowns error:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!form.employee_id || !form.full_name || !form.role || !form.team_id || !form.shift || !form.status) {
      toast.error("Please fill in all required fields")
      return
    }

    setCreating(true)
    const toastId = toast.loading("Creating employee...")

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      const data = await res.json()
      fetchEmployees()
      setForm({
        employee_id: "",
        full_name: "",
        phone_number: "",
        gitlab_username: "",
        official_mail: "",
        role: "",
        team_id: "",
        shift: "",
        status: "",
        is_project_lead: false,
      })
      setShowForm(false)
      toast.success("Employee created successfully", { id: toastId })
    } catch (error: any) {
      toast.error(error.message || "Failed to create employee", { id: toastId })
    } finally {
      setCreating(false)
    }
  }

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmployee) return

    // Validate required fields
    if (!form.employee_id || !form.full_name || !form.role || !form.team_id || !form.shift || !form.status) {
      toast.error("Please fill in all required fields")
      return
    }

    setCreating(true)
    const toastId = toast.loading("Updating employee...")

    try {
      const res = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      fetchEmployees()
      setEditingEmployee(null)
      setForm({
        employee_id: "",
        full_name: "",
        phone_number: "",
        gitlab_username: "",
        official_mail: "",
        role: "",
        team_id: "",
        shift: "",
        status: "",
        is_project_lead: false,
      })
      setShowForm(false)
      toast.success("Employee updated successfully", { id: toastId })
    } catch (error: any) {
      toast.error(error.message || "Failed to update employee", { id: toastId })
    } finally {
      setCreating(false)
    }
  }

  const handleStartEdit = (emp: Employee) => {
    setEditingEmployee(emp)
    setForm({
      employee_id: emp.employee_id,
      full_name: emp.full_name,
      phone_number: emp.phone_number || "",
      gitlab_username: emp.gitlab_username || "",
      official_mail: emp.official_mail || "",
      role: emp.role,
      team_id: emp.team_id,
      shift: emp.shift,
      status: emp.status,
      is_project_lead: emp.is_project_lead,
    })
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingEmployee(null)
    setShowForm(false)
    setForm({
      employee_id: "",
      full_name: "",
      phone_number: "",
      gitlab_username: "",
      official_mail: "",
      role: "",
      team_id: "",
      shift: "",
      status: "",
      is_project_lead: false,
    })
  }

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return

    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")

      setEmployees(employees.filter((e) => e.id !== id))
      toast.success("Employee deleted successfully")
    } catch (error) {
      toast.error("Failed to delete employee")
    }
  }

  const handleImportCSV = async (file: File) => {
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const importedEmployees = Array.isArray(json) ? json : json.data || []

      if (importedEmployees.length === 0) {
        toast.error("No employees found in file")
        return
      }

      setImporting(true)
      const toastId = toast.loading(`Importing 0 of ${importedEmployees.length} employees...`)
      setImportToastId(toastId)

      const res = await fetch("/api/employees/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employees: importedEmployees }),
      })

      if (!res.ok) {
        throw new Error("Failed to start import")
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.complete) {
                fetchEmployees()
                fetchTeams()
                fetchDropdownOptions()
                toast.success(
                  `Import complete: ${data.created} created, ${data.updated} updated, ${data.skipped} skipped${
                    data.errors?.length ? `, ${data.errors.length} errors` : ""
                  }`,
                  { id: toastId },
                )
              } else {
                toast.loading(`Importing ${data.current} of ${data.total} - ${data.message}`, { id: toastId })
              }
            } catch (e) {
              console.error("[v0] Error parsing stream:", e)
            }
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to import CSV")
    } finally {
      setImporting(false)
      setImportToastId(null)
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Employees</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
          <Button asChild className="gap-2" disabled={importing}>
            <label className="cursor-pointer flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {importing ? "Importing..." : "Import CSV"}
              <input
                type="file"
                accept=".csv,.json"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0]
                  if (selectedFile) handleImportCSV(selectedFile)
                }}
                className="hidden"
                disabled={importing}
              />
            </label>
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="p-6">
          <form onSubmit={editingEmployee ? handleEditEmployee : handleSubmit} className="space-y-4">
            {editingEmployee && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  Editing: <strong>{editingEmployee.full_name}</strong>
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Employee ID *</label>
                <Input
                  type="number"
                  placeholder="Employee ID"
                  value={form.employee_id}
                  onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Full Name *</label>
                <Input
                  placeholder="Full Name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone Number</label>
                <Input
                  type="tel"
                  placeholder="Phone Number"
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">GitLab Username</label>
                <Input
                  placeholder="GitLab Username"
                  value={form.gitlab_username}
                  onChange={(e) => setForm({ ...form, gitlab_username: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Official Mail</label>
                <Input
                  type="email"
                  placeholder="Official Mail"
                  value={form.official_mail}
                  onChange={(e) => setForm({ ...form, official_mail: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Role *</label>
                <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {dropdownOptions.roles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Team *</label>
                <Select value={form.team_id} onValueChange={(value) => setForm({ ...form, team_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Shift *</label>
                <Select value={form.shift} onValueChange={(value) => setForm({ ...form, shift: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Shift" />
                  </SelectTrigger>
                  <SelectContent>
                    {dropdownOptions.shifts.map((shift) => (
                      <SelectItem key={shift.id} value={shift.name}>
                        {shift.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status *</label>
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {dropdownOptions.statuses.map((status) => (
                      <SelectItem key={status.id} value={status.name}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.is_project_lead}
                onCheckedChange={(checked) => setForm({ ...form, is_project_lead: checked as boolean })}
              />
              <label className="text-sm font-medium">Project Lead</label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={creating}>
                {editingEmployee ? "Update Employee" : "Create Employee"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={creating}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b">
              <tr>
                <th className="text-left p-3">Employee ID</th>
                <th className="text-left p-3">Full Name</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Team</th>
                <th className="text-left p-3">Shift</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Project Lead</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b hover:bg-muted/50">
                  <td className="p-3">{emp.employee_id}</td>
                  <td className="p-3">{emp.full_name}</td>
                  <td className="p-3">{emp.role}</td>
                  <td className="p-3">{emp.team_name}</td>
                  <td className="p-3">{emp.shift}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        emp.status === "Permanent" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td className="p-3">{emp.is_project_lead ? "✓" : "-"}</td>
                  <td className="p-3 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(emp)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEmployee(emp.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
