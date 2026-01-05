import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    await requireAuth()
    const projects = await sql`
      SELECT p.*, u.email as created_by_email
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
    `
    return NextResponse.json({ projects })
  } catch (error) {
    console.error("[v0] Get projects error:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { name } = await request.json()

    const result = await sql`
      INSERT INTO projects (name, created_by)
      VALUES (${name}, ${user.id})
      RETURNING *
    `

    return NextResponse.json({ project: result[0] })
  } catch (error) {
    console.error("[v0] Create project error:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
