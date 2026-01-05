import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params

    // Fetch all tier data
    const data = await sql`
      SELECT tier_id, field_id, value, text_value, created_at, updated_at
      FROM tier_data
      WHERE tier_id = ${id}
    `

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("[v0] Data fetch error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch data" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await request.json()
    const { field_id, value, text_value } = body

    console.log("[v0] Data save request:", { tier_id: id, field_id, value, text_value })

    if (text_value !== undefined) {
      // Store text value (string or date)
      await sql`
        INSERT INTO tier_data (tier_id, field_id, text_value)
        VALUES (${id}, ${field_id}, ${text_value})
        ON CONFLICT (tier_id, field_id) 
        DO UPDATE SET text_value = ${text_value}, updated_at = NOW()
      `
      console.log("[v0] Text value saved successfully")
    } else {
      // Store numeric value
      await sql`
        INSERT INTO tier_data (tier_id, field_id, value)
        VALUES (${id}, ${field_id}, ${value})
        ON CONFLICT (tier_id, field_id) 
        DO UPDATE SET value = ${value}, updated_at = NOW()
      `
      console.log("[v0] Numeric value saved successfully")
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Data save error:", error)
    return NextResponse.json({ error: error.message || "Failed to update data" }, { status: 500 })
  }
}
