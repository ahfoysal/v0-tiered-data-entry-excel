import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth, getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    await requireAuth()

    // Get all templates (system templates + user templates)
    const templates = await sql`
      SELECT ft.*, COUNT(tf.id)::integer as field_count
      FROM field_templates ft
      LEFT JOIN template_fields tf ON ft.id = tf.template_id
      GROUP BY ft.id
      ORDER BY ft.is_system DESC, ft.created_at DESC
    `

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("[v0] Get templates error:", error)
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user?.is_admin && !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { name, description, fields } = await request.json()

    if (!name.trim()) {
      return NextResponse.json({ error: "Template name required" }, { status: 400 })
    }

    // Create template
    const result = await sql`
      INSERT INTO field_templates (name, description, created_by, is_system)
      VALUES (${name}, ${description || null}, ${user?.id || null}, false)
      RETURNING *
    `

    const templateId = result[0].id

    // Add fields
    if (fields && fields.length > 0) {
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i]
        await sql`
          INSERT INTO template_fields (template_id, field_name, field_type, field_options, display_order)
          VALUES (${templateId}, ${field.field_name}, ${field.field_type}, ${field.field_options || null}, ${i})
        `
      }
    }

    return NextResponse.json({ template: result[0] })
  } catch (error: any) {
    console.error("[v0] Create template error:", error)
    return NextResponse.json({ error: error.message || "Failed to create template" }, { status: 500 })
  }
}
