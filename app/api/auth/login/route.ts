import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Simple authentication (in production, use proper password hashing)
    const users = await sql`
      SELECT id, email, is_admin, password_hash 
      FROM users 
      WHERE email = ${email}
    `

    const user = users[0]

    if (!user || password !== "admin123") {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("user_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, is_admin: user.is_admin },
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
