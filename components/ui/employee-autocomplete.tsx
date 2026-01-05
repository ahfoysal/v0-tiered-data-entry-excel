"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface Employee {
  id: string
  employee_id: string
  full_name: string
}

interface EmployeeAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function EmployeeAutocomplete({ value, onChange, placeholder, disabled }: EmployeeAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Load all employees on mount
  useEffect(() => {
    loadEmployees()
  }, [])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Filter employees when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEmployees(employees.slice(0, 50)) // Show first 50 employees
    } else {
      const filtered = employees.filter(
        (emp) =>
          (emp.employee_id && emp.employee_id.includes(searchTerm)) ||
          (emp.full_name && emp.full_name.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredEmployees(filtered.slice(0, 50)) // Limit to 50 results
    }
  }, [searchTerm, employees])

  const loadEmployees = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/employees")
      if (res.ok) {
        const data = await res.json()
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.error("[v0] Load employees error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (employee: Employee) => {
    const displayValue = `${employee.employee_id || ""} - ${employee.full_name || ""}`
    onChange(displayValue)
    setSearchTerm("")
    setShowDropdown(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    onChange(newValue)
    setShowDropdown(true)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder || "Search employee by ID or name..."}
          disabled={disabled || loading}
          className="pl-9"
        />
      </div>

      {showDropdown && filteredEmployees.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredEmployees.map((employee) => (
            <button
              key={employee.id}
              onClick={() => handleSelect(employee)}
              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm"
            >
              <div className="font-medium">{employee.employee_id || "No ID"}</div>
              <div className="text-xs text-muted-foreground">{employee.full_name || "No Name"}</div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && searchTerm && filteredEmployees.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg px-3 py-2 text-sm text-muted-foreground">
          No employees found
        </div>
      )}
    </div>
  )
}
