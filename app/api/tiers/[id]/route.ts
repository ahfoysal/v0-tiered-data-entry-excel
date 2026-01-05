import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await request.json()

    if (body.name !== undefined) {
      await sql`UPDATE tiers SET name = ${body.name}, updated_at = NOW() WHERE id = ${id}`
    }

    if (body.allow_child_creation !== undefined) {
      await sql`UPDATE tiers SET allow_child_creation = ${body.allow_child_creation}, updated_at = NOW() WHERE id = ${id}`
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update tier" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    await sql`DELETE FROM tiers WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete tier" }, { status: 500 })
  }
}
