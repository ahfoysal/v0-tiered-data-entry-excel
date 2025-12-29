import * as XLSX from "xlsx"
import type { Project, TierNode } from "@/app/page"

export async function importFromExcel(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })

        if (workbook.SheetNames.length === 0) {
          throw new Error("No sheets found in Excel file")
        }

        const allTiersData: Array<{
          name: string
          path: string[]
          data: Record<string, number>
        }> = []

        let projectName = "Imported Project"
        let columns: string[] = []

        // Parse all sheets to collect tier data
        workbook.SheetNames.forEach((sheetName, index) => {
          const sheet = workbook.Sheets[sheetName]
          const sheetData = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 })

          if (sheetData.length < 2) return

          let headerRowIndex = 0
          let dataRowIndex = 1

          const firstRow = sheetData[0]
          if (firstRow && firstRow[0] && String(firstRow[0]).includes("NOTE:")) {
            // This is a parent sheet with warning note
            headerRowIndex = 2 // Headers are in row 3 (index 2)
            dataRowIndex = 3 // Data is in row 4 (index 3)
          }

          if (sheetData.length <= dataRowIndex) return

          const headers = sheetData[headerRowIndex]
          const row = sheetData[dataRowIndex]

          // Extract tier information
          const tierNameIndex = headers.indexOf("Tier Name")
          const hierarchyPathIndex = headers.indexOf("Hierarchy Path")

          if (tierNameIndex === -1 || hierarchyPathIndex === -1) return

          const tierName = row[tierNameIndex]
          const hierarchyPath = row[hierarchyPathIndex]

          if (!tierName || !hierarchyPath) return

          // Parse hierarchy path
          const pathArray = hierarchyPath.split(" > ").map((p: string) => p.trim())

          // Extract data columns (all columns except Tier Name and Hierarchy Path)
          const dataColumns = headers.filter((h: string) => h && h !== "Tier Name" && h !== "Hierarchy Path")

          if (index === 0) {
            columns = dataColumns
            // First tier name could be project name
            projectName = pathArray[0] || "Imported Project"
          }

          const tierData: Record<string, number> = {}
          dataColumns.forEach((col: string) => {
            const colIndex = headers.indexOf(col)
            const cellValue = row[colIndex]
            tierData[col] = Number(cellValue) || 0
          })

          allTiersData.push({
            name: tierName,
            path: pathArray,
            data: tierData,
          })
        })

        if (columns.length === 0) {
          throw new Error("No data columns found in Excel file")
        }

        const rootTierData = allTiersData.find((t) => t.path.length === 1)

        const rootNode: TierNode = {
          id: "root",
          name: rootTierData?.name || projectName,
          data: rootTierData?.data || columns.reduce((acc, col) => ({ ...acc, [col]: 0 }), {}),
          children: [],
        }

        // Build the tree structure
        const nodeMap = new Map<string, TierNode>()
        nodeMap.set(rootNode.name, rootNode)

        // Sort tiers by path length to ensure parents are created before children
        allTiersData.sort((a, b) => a.path.length - b.path.length)

        allTiersData.forEach(({ name, path, data }) => {
          if (path.length === 1) return // Skip root as it's already created

          const parentPath = path.slice(0, -1)
          const parentName = parentPath[parentPath.length - 1]
          const parent = nodeMap.get(parentName)

          if (parent) {
            const newNode: TierNode = {
              id: `${Date.now()}-${Math.random()}`,
              name,
              data,
              children: [],
            }
            parent.children.push(newNode)
            nodeMap.set(name, newNode)
          }
        })

        const project: Project = {
          name: projectName,
          columns,
          rootNode,
        }

        resolve(project)
      } catch (error) {
        console.error("[v0] Import error:", error)
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsBinaryString(file)
  })
}
