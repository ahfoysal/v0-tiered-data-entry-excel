import { cookies } from "next/headers"
import { sql } from "./db"
import type { NextRequest } from "next/server"

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value
  console.log("[v0] getCurrentUser - userId from cookie:", userId)

  if (!userId) return null

  const users = await sql`
    SELECT id, email, is_admin, user_role FROM users WHERE id = ${userId}
  `
  console.log("[v0] getCurrentUser - found users:", users)

  return users[0] || null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (!user.is_admin) {
    throw new Error("Admin access required")
  }
  return user
}

export async function getUserFromRequest(request: NextRequest) {
  const userId = request.cookies.get("user_id")?.value
  console.log("[v0] getUserFromRequest - userId from cookie:", userId)

  if (!userId) return null

  const users = await sql`
    SELECT id, email, is_admin, user_role FROM users WHERE id = ${userId}
  `
  console.log("[v0] getUserFromRequest - found users:", users)

  return users[0] || null
}
