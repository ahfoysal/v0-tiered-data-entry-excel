import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await request.json()
    const { field_id, value, text_value } = body

    // Check if tier has children (if yes, can't edit data)
    const children = await sql`SELECT id FROM tiers WHERE parent_id = ${id} LIMIT 1`
    if (children.length > 0) {
      return NextResponse.json({ error: "Cannot edit parent tier data directly" }, { status: 400 })
    }

    if (text_value !== undefined) {
      // Store text value (string or date)
      await sql`
        INSERT INTO tier_data (tier_id, field_id, text_value)
        VALUES (${id}, ${field_id}, ${text_value})
        ON CONFLICT (tier_id, field_id) 
        DO UPDATE SET text_value = ${text_value}, updated_at = NOW()
      `
    } else {
      // Store numeric value
      await sql`
        INSERT INTO tier_data (tier_id, field_id, value)
        VALUES (${id}, ${field_id}, ${value})
        ON CONFLICT (tier_id, field_id) 
        DO UPDATE SET value = ${value}, updated_at = NOW()
      `
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update data" }, { status: 500 })
  }
}
