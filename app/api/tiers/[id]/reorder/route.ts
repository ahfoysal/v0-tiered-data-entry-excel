import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.is_admin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { newIndex, parentId } = await request.json()

    const sql = neon(process.env.DATABASE_URL!)

    const siblings = await sql`
      SELECT id, display_order FROM tiers 
      WHERE parent_id IS NOT DISTINCT FROM ${parentId || null}
      ORDER BY display_order ASC
    `

    if (!siblings.length) {
      return Response.json({ error: "No siblings found" }, { status: 400 })
    }

    const tierIdx = siblings.findIndex((s: any) => s.id === id)
    if (tierIdx === -1) {
      return Response.json({ error: "Tier not found" }, { status: 404 })
    }

    const newSiblings = siblings.filter((s: any) => s.id !== id)
    newSiblings.splice(newIndex, 0, { id })

    for (let i = 0; i < newSiblings.length; i++) {
      await sql`UPDATE tiers SET display_order = ${i} WHERE id = ${newSiblings[i].id}`
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] Reorder tier error:", error)
    return Response.json({ error: "Failed to reorder tier" }, { status: 500 })
  }
}
