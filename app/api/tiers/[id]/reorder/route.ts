import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.is_admin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { newIndex, parentId, newParentId } = await request.json()

    console.log("[v0] Reorder tier:", { id, newIndex, parentId, newParentId })

    const sql = neon(process.env.DATABASE_URL!)

    const oldSiblings = await sql`
      SELECT id, display_order FROM tiers 
      WHERE parent_id IS NOT DISTINCT FROM ${parentId || null}
      ORDER BY display_order ASC
    `

    console.log("[v0] Old siblings:", oldSiblings)

    if (!oldSiblings.length) {
      return Response.json({ error: "No siblings found in old parent" }, { status: 400 })
    }

    const tierIdx = oldSiblings.findIndex((s: any) => s.id === id)
    if (tierIdx === -1) {
      return Response.json({ error: "Tier not found in siblings" }, { status: 404 })
    }

    if (newParentId !== undefined && newParentId !== parentId) {
      console.log("[v0] Moving tier to new parent:", newParentId)
      await sql`UPDATE tiers SET parent_id = ${newParentId || null} WHERE id = ${id}`
    }

    const updatedOldSiblings = oldSiblings.filter((s: any) => s.id !== id)

    for (let i = 0; i < updatedOldSiblings.length; i++) {
      await sql`UPDATE tiers SET display_order = ${i} WHERE id = ${updatedOldSiblings[i].id}`
    }

    if (newParentId !== undefined && newParentId !== parentId) {
      const newSiblings = await sql`
        SELECT id, display_order FROM tiers 
        WHERE parent_id IS NOT DISTINCT FROM ${newParentId || null}
        ORDER BY display_order ASC
      `

      const reorderedNewSiblings = [...newSiblings]
      reorderedNewSiblings.splice(newIndex, 0, { id })

      for (let i = 0; i < reorderedNewSiblings.length; i++) {
        await sql`UPDATE tiers SET display_order = ${i} WHERE id = ${reorderedNewSiblings[i].id}`
      }
    }

    console.log("[v0] Reorder completed successfully")
    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] Reorder tier error:", error)
    return Response.json({ error: "Failed to reorder tier" }, { status: 500 })
  }
}
