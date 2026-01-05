import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth, getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params

    const tiers = await sql`
      SELECT * FROM tiers
      WHERE project_id = ${id}
      ORDER BY level, created_at
    `

    const tiersWithData = await Promise.all(
      tiers.map(async (tier: any) => {
        const tierData = await sql`
          SELECT field_id, value, text_value FROM tier_data
          WHERE tier_id = ${tier.id}
        `
        return {
          ...tier,
          data: tierData || [],
        }
      }),
    )

    return NextResponse.json({ tiers: tiersWithData })
  } catch (error) {
    console.error("[v0] Get tiers error:", error)
    return NextResponse.json({ error: "Failed to fetch tiers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    await requireAuth()
    const { id } = await params
    const { name, parent_id, allow_child_creation = true } = await request.json()

    if (parent_id && !user?.is_admin) {
      const parent = await sql`
        SELECT allow_child_creation FROM tiers WHERE id = ${parent_id}
      `
      if (parent[0] && !parent[0].allow_child_creation) {
        return NextResponse.json({ error: "Parent tier does not allow child creation" }, { status: 403 })
      }
    }

    const level = parent_id ? (await sql`SELECT level FROM tiers WHERE id = ${parent_id}`)[0].level + 1 : 0

    const result = await sql`
      INSERT INTO tiers (project_id, parent_id, name, level, allow_child_creation)
      VALUES (${id}, ${parent_id || null}, ${name}, ${level}, ${allow_child_creation})
      RETURNING *
    `

    return NextResponse.json({ tier: result[0] })
  } catch (error: any) {
    console.error("[v0] Create tier error:", error)
    return NextResponse.json({ error: error.message || "Failed to create tier" }, { status: 500 })
  }
}
