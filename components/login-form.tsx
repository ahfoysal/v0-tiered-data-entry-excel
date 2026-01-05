"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Lock, Mail, Users } from "lucide-react"
import { toast } from "sonner"

export function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [loginType, setLoginType] = useState<"email" | "employee">("email")
  const [email, setEmail] = useState("admin@example.com")
  const [employeeId, setEmployeeId] = useState("")
  const [password, setPassword] = useState("admin123")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const toastId = toast.loading("Signing in...")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginType === "email" ? email : undefined,
          employeeId: loginType === "employee" ? employeeId : undefined,
          password,
          loginType,
        }),
      })

      const data = await res.json()

      if (data.success) {
        const identifier = loginType === "email" ? email : employeeId
        toast.success(`Welcome back! 👋`, {
          id: toastId,
        })
        setTimeout(() => onLogin(), 500)
      } else {
        setError(data.error || "Login failed")
        toast.error(data.error || "Please check your credentials", {
          id: toastId,
        })
      }
    } catch (err) {
      setError("Network error")
      toast.error("Network error - please check your connection", {
        id: toastId,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Tiered Data Entry
          </h1>
          <p className="text-muted-foreground">Manage complex hierarchical data with ease</p>
        </div>

        {/* Login Card */}
        <Card className="border border-border/50 shadow-xl backdrop-blur-sm bg-card/80">
          <CardContent className="pt-8 pb-8">
            <div className="mb-6 flex gap-2">
              <Button
                type="button"
                variant={loginType === "email" ? "default" : "outline"}
                onClick={() => setLoginType("email")}
                className="flex-1"
              >
                <Mail className="w-4 h-4 mr-2" />
                Admin
              </Button>
              <Button
                type="button"
                variant={loginType === "employee" ? "default" : "outline"}
                onClick={() => setLoginType("employee")}
                className="flex-1"
              >
                <Users className="w-4 h-4 mr-2" />
                Employee
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  {error}
                </div>
              )}

              {loginType === "email" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      Email
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="bg-input/50 border-border/30 focus:border-primary/50 h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      Password
                    </label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-input/50 border-border/30 focus:border-primary/50 h-11"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      Employee ID
                    </label>
                    <Input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="e.g., EMP001"
                      className="bg-input/50 border-border/30 focus:border-primary/50 h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      Password
                    </label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-input/50 border-border/30 focus:border-primary/50 h-11"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Default: 123456</p>
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold rounded-lg transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center pt-2">
                {loginType === "email"
                  ? "Demo: admin@example.com / admin123"
                  : "Use your Employee ID with default password: 123456"}
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">© 2026 Tiered Data Entry. All rights reserved.</p>
      </div>
    </div>
  )
}
