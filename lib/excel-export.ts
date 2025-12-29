import * as XLSX from "xlsx"
import type { TierNode } from "@/app/page"

export function exportToExcel(rootNode: TierNode) {
  const workbook = XLSX.utils.book_new()

  // Collect all tiers with their paths and generate sheet names
  const collectTiers = (
    node: TierNode,
    path: string[] = [],
    allTiers: Array<{ node: TierNode; path: string[]; sheetName: string }> = [],
  ): Array<{ node: TierNode; path: string[]; sheetName: string }> => {
    const currentPath = [...path, node.name]

    const sheetIndex = allTiers.length + 1
    const sheetName = `${sheetIndex}. ${node.name}`.substring(0, 31)

    allTiers.push({ node, path: currentPath, sheetName })

    node.children.forEach((child) => {
      collectTiers(child, currentPath, allTiers)
    })

    return allTiers
  }

  const allTiers = collectTiers(rootNode)

  const nodeToSheetMap = new Map<string, string>()
  allTiers.forEach(({ node, sheetName }) => {
    nodeToSheetMap.set(node.id, sheetName)
  })

  // Create a worksheet for each tier
  allTiers.forEach(({ node, path, sheetName }) => {
    // Create headers from data keys
    const headers = ["Tier Name", "Hierarchy Path", ...Object.keys(node.data)]
    const hasChildren = node.children.length > 0

    let dataRow: any[]

    if (hasChildren) {
      dataRow = [
        node.name,
        path.join(" > "),
        ...Object.keys(node.data).map((key, colIndex) => {
          const childFormulas = node.children
            .map((child) => {
              const childSheetName = nodeToSheetMap.get(child.id)
              if (!childSheetName) return null
              const colLetter = XLSX.utils.encode_col(colIndex + 2)
              const escapedSheetName = childSheetName.includes(" ") ? `'${childSheetName}'` : childSheetName
              return `${escapedSheetName}!${colLetter}2`
            })
            .filter(Boolean)

          if (childFormulas.length > 0) {
            return { f: childFormulas.join("+") }
          }
          return 0
        }),
      ]
    } else {
      dataRow = [node.name, path.join(" > "), ...Object.values(node.data)]
    }

    let wsData: any[][]
    if (hasChildren) {
      const noteRow = [
        "⚠️ NOTE: Please do not edit data in this sheet. Values are calculated from child sheets.",
        "",
        ...Object.keys(node.data).map(() => ""),
      ]
      wsData = [noteRow, [], headers, dataRow] // Note, blank row, headers, data
    } else {
      wsData = [headers, dataRow]
    }

    const worksheet = XLSX.utils.aoa_to_sheet(wsData)

    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1")
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        if (!worksheet[cellAddress]) continue

        const headerRow = hasChildren ? 2 : 0
        const dataRowIndex = hasChildren ? 3 : 1
        const noteRowIndex = 0

        const isHeader = R === headerRow
        const isTierNameCol = C === 0
        const isHierarchyCol = C === 1
        const isParentDataCell = R === dataRowIndex && C >= 2 && hasChildren
        const isNoteRow = R === noteRowIndex && hasChildren

        // Add red background for headers and parent cells
        if (isHeader || (isTierNameCol && R >= headerRow) || (isHierarchyCol && R >= headerRow) || isParentDataCell) {
          if (!worksheet[cellAddress].s) {
            worksheet[cellAddress].s = {}
          }
          worksheet[cellAddress].s.fill = {
            patternType: "solid",
            fgColor: { rgb: "FFCCCC" },
          }
        }

        if (isNoteRow) {
          if (!worksheet[cellAddress].s) {
            worksheet[cellAddress].s = {}
          }
          worksheet[cellAddress].s.fill = {
            patternType: "solid",
            fgColor: { rgb: "FFFF99" },
          }
          worksheet[cellAddress].s.font = {
            bold: true,
          }
        }
      }
    }

    if (hasChildren) {
      if (!worksheet["!merges"]) worksheet["!merges"] = []
      worksheet["!merges"].push({
        s: { r: 0, c: 0 },
        e: { r: 0, c: headers.length - 1 },
      })
    }

    // Set column widths
    const colWidths = headers.map((header) => ({
      wch: Math.max(header.length + 2, 15),
    }))
    worksheet["!cols"] = colWidths

    let counter = 1
    let finalSheetName = sheetName
    while (workbook.SheetNames.includes(finalSheetName)) {
      const suffix = ` (${counter})`
      finalSheetName = sheetName.substring(0, 31 - suffix.length) + suffix
      counter++
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, finalSheetName)
  })

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })

  // Download file
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `hierarchy-data-${new Date().toISOString().split("T")[0]}.xlsx`
  link.click()
  window.URL.revokeObjectURL(url)
}
