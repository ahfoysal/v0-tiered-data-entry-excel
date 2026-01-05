import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log("[v0] Login attempt with email:", email)

    const users = await sql`
      SELECT id, email, is_admin, password_hash 
      FROM users 
      WHERE email = ${email}
    `

    const user = users[0]

    if (!user) {
      console.log("[v0] User not found:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("[v0] User found, verifying password")
    console.log("[v0] Stored hash:", user.password_hash.substring(0, 20) + "...")
    console.log("[v0] Password to check:", password)

    const isValidPassword = user.password_hash === password

    console.log("[v0] Simple comparison result:", isValidPassword)

    if (!isValidPassword) {
      console.log("[v0] Password invalid")
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("[v0] Password valid, setting cookie for user:", user.id)

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("user_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    console.log("[v0] Cookie set successfully")

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, is_admin: user.is_admin },
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
