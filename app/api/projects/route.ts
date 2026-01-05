import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const MAX_RETRIES = 3
const RETRY_DELAY = 500

async function executeWithRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await fn()
  } catch (error: any) {
    if (error.message?.includes("Too Many Requests") && retries > 0) {
      const backoffDelay = RETRY_DELAY * (MAX_RETRIES - retries + 1)
      console.log(`[v0] Rate limited, retrying after ${backoffDelay}ms...`)
      await delay(backoffDelay)
      return executeWithRetry(fn, retries - 1)
    }
    throw error
  }
}

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
    console.log("[v0] POST /api/projects - Creating project")
    const user = await requireAuth()
    const { name, template, teamId, fields, columns, teamSource } = await request.json()

    console.log("[v0] Request data:", { name, template, teamId, fields, columns, teamSource })

    const projectResult = await sql`
      INSERT INTO projects (name, created_by)
      VALUES (${name}, ${user.id})
      RETURNING *
    `
    const project = projectResult[0]
    console.log("[v0] Project created:", project.id)

    if (template === "team-based" && teamId && fields) {
      console.log("[v0] Creating team-based hierarchy...")
      await createTeamBasedHierarchy(project.id, teamId, fields)
    } else if (template === "custom" && teamSource && fields) {
      console.log("[v0] Creating custom hierarchy with teamSource:", teamSource)
      await createCustomHierarchy(project.id, teamSource === "all" ? null : teamSource, fields)
    } else {
      console.log("[v0] Creating simple project with no hierarchy")
    }

    console.log("[v0] Project creation complete, returning:", project.id)
    return NextResponse.json({ project })
  } catch (error) {
    console.error("[v0] Create project error:", error)
    return NextResponse.json({ error: "Failed to create project", details: String(error) }, { status: 500 })
  }
}

async function createTeamBasedHierarchy(projectId: string, teamId: string, fieldTemplateIds: string[]) {
  try {
    const membersData = await executeWithRetry(async () => {
      return await sql`
        SELECT e.id, e.employee_id, e.full_name, e.phone_number, e.gitlab_username, e.official_mail, r.name as role_name, e.role
        FROM users e
        LEFT JOIN roles r ON e.role = r.name
        WHERE e.team_id = ${teamId}::uuid
        ORDER BY e.role, e.full_name
      `
    })

    // Create team tier
    const teamTierResult = await executeWithRetry(async () => {
      return await sql`
        INSERT INTO tiers (project_id, name, level, allow_child_creation)
        VALUES (${projectId}, 'Team', 1, true)
        RETURNING *
      `
    })
    const teamTierId = teamTierResult[0].id

    // Group members by role
    const membersByRole: Record<string, any[]> = {}
    membersData.forEach((member: any) => {
      const roleName = member.role_name || "Unassigned"
      if (!membersByRole[roleName]) {
        membersByRole[roleName] = []
      }
      membersByRole[roleName].push(member)
    })

    // Create role tiers and member entries
    for (const [roleName, members] of Object.entries(membersByRole)) {
      await delay(300)

      const roleTierResult = await executeWithRetry(async () => {
        return await sql`
          INSERT INTO tiers (project_id, parent_id, name, level, allow_child_creation)
          VALUES (${projectId}, ${teamTierId}, ${roleName}, 2, false)
          RETURNING *
        `
      })
      const roleTierId = roleTierResult[0].id

      // Create member tiers with pre-populated fields
      for (const member of members) {
        await delay(300)
        await createMemberTier(projectId, roleTierId, member, fieldTemplateIds)
      }
    }
  } catch (error) {
    console.error("[v0] Create team hierarchy error:", error)
    throw error
  }
}

async function createCustomHierarchy(projectId: string, teamId: string | null, fieldTemplateIds: string[]) {
  try {
    console.log("[v0] Creating custom hierarchy for project:", projectId)

    let teamsData: any[] = []

    if (teamId && teamId !== "all" && teamId !== "") {
      teamsData = await executeWithRetry(async () => {
        return await sql`
          SELECT id, name FROM teams WHERE id = ${teamId}::uuid
        `
      })
    } else {
      teamsData = await executeWithRetry(async () => {
        return await sql`
          SELECT id, name FROM teams ORDER BY name
        `
      })
    }

    if (!teamsData || teamsData.length === 0) {
      console.log("[v0] No teams found for custom hierarchy")
      return
    }

    for (const team of teamsData) {
      console.log("[v0] Processing team:", team.name)

      // Fetch all members for this team
      const membersData = await executeWithRetry(async () => {
        return await sql`
          SELECT e.id, e.employee_id, e.full_name, e.phone_number, e.gitlab_username, e.official_mail, r.name as role_name, e.role
          FROM users e
          LEFT JOIN roles r ON e.role = r.name
          WHERE e.team_id = ${team.id}::uuid
          ORDER BY e.role, e.full_name
        `
      })

      if (membersData.length === 0) continue

      // Create team tier
      const teamTierResult = await executeWithRetry(async () => {
        return await sql`
          INSERT INTO tiers (project_id, name, level, allow_child_creation)
          VALUES (${projectId}, ${team.name}, 1, true)
          RETURNING id
        `
      })
      const teamTierId = teamTierResult[0].id
      console.log("[v0] Created team tier:", team.name)

      // Group members by role
      const membersByRole: Record<string, any[]> = {}
      membersData.forEach((member: any) => {
        const roleName = member.role_name || "Unassigned"
        if (!membersByRole[roleName]) {
          membersByRole[roleName] = []
        }
        membersByRole[roleName].push(member)
      })

      const roleNames = Object.keys(membersByRole)
      const roleTiersResult = await executeWithRetry(async () => {
        const values = roleNames.map(
          (role) => `(${projectId}::uuid, '${teamTierId}', '${role.replace(/'/g, "''")}', 2, false)`,
        )
        return await sql.unsafe(`
          INSERT INTO tiers (project_id, parent_id, name, level, allow_child_creation)
          VALUES ${values.join(", ")}
          RETURNING id, name
        `)
      })

      console.log("[v0] Bulk created", roleNames.length, "role tiers")

      const roleTiers = Array.isArray(roleTiersResult) ? roleTiersResult : [roleTiersResult]

      for (const roleTier of roleTiers) {
        const members = membersByRole[roleTier.name]
        if (!members || members.length === 0) continue

        await delay(100)

        const memberInsertValues = members
          .map((m) => `(${projectId}::uuid, '${roleTier.id}', '${m.full_name.replace(/'/g, "''")}', 3, false)`)
          .join(", ")

        const memberTiersResult = await executeWithRetry(async () => {
          return await sql.unsafe(`
            INSERT INTO tiers (project_id, parent_id, name, level, allow_child_creation)
            VALUES ${memberInsertValues}
            RETURNING id
          `)
        })

        const memberTiers = Array.isArray(memberTiersResult) ? memberTiersResult : [memberTiersResult]
        console.log("[v0] Bulk created", memberTiers.length, "member tiers for role:", roleTier.name)

        if (fieldTemplateIds && fieldTemplateIds.length > 0) {
          const templateFieldsResult = await executeWithRetry(async () => {
            return await sql`
              SELECT id, field_name, field_type, field_options, display_order FROM template_fields 
              WHERE template_id = ANY(${fieldTemplateIds}::uuid[])
              ORDER BY display_order
            `
          })

          if (templateFieldsResult && templateFieldsResult.length > 0) {
            const fieldInserts = []
            for (const memberTier of memberTiers) {
              for (const field of templateFieldsResult) {
                fieldInserts.push(
                  `(${memberTier.id}::uuid, '${field.field_name.replace(/'/g, "''")}', '${field.field_type}', ${field.field_options ? `'${JSON.stringify(field.field_options).replace(/'/g, "''")}'` : "null"}, ${field.display_order || 0})`,
                )
              }
            }

            if (fieldInserts.length > 0) {
              await executeWithRetry(async () => {
                return await sql.unsafe(`
                  INSERT INTO tier_fields (tier_id, field_name, field_type, field_options, display_order)
                  VALUES ${fieldInserts.join(", ")}
                `)
              })
              console.log("[v0] Bulk inserted", fieldInserts.length, "fields for role:", roleTier.name)
            }
          }
        }
      }
    }

    console.log("[v0] Custom hierarchy created successfully")
  } catch (error) {
    console.error("[v0] Create custom hierarchy error:", error)
    throw error
  }
}

async function createMemberTier(projectId: string, parentTierId: string, member: any, fieldTemplateIds: string[]) {
  try {
    const memberTierResult = await executeWithRetry(async () => {
      return await sql`
        INSERT INTO tiers (project_id, parent_id, name, level, allow_child_creation)
        VALUES (${projectId}, ${parentTierId}, ${member.full_name}, 3, false)
        RETURNING *
      `
    })
    const memberTierId = memberTierResult[0].id
    console.log("[v0] Created member tier:", memberTierId, "for:", member.full_name)

    for (const templateId of fieldTemplateIds) {
      const templateFieldsResult = await executeWithRetry(async () => {
        return await sql`
          SELECT id, field_name, field_type, field_options, display_order FROM template_fields WHERE template_id = ${templateId}::uuid
          ORDER BY display_order
        `
      })

      for (const field of templateFieldsResult) {
        if (!field.field_type) {
          console.warn("[v0] Template field", field.field_name, "has no field_type, skipping")
          continue
        }

        await delay(200)

        await executeWithRetry(async () => {
          return await sql`
            INSERT INTO tier_fields (tier_id, field_name, field_type, field_options, display_order)
            VALUES (${memberTierId}, ${field.field_name}, ${field.field_type}, ${field.field_options || null}, ${field.display_order || 0})
          `
        })
        console.log("[v0] Added field:", field.field_name, "type:", field.field_type, "to member tier:", memberTierId)
      }
    }
  } catch (error) {
    console.error("[v0] Create member tier error:", error)
    throw error
  }
}
