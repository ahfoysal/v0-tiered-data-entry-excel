"use client"

import { Card } from "@/components/ui/card"
import type { TierNode } from "@/app/page"
import { cn } from "@/lib/utils"

interface HeatMapViewProps {
  node: TierNode
  columns: string[]
  onSelectNode: (node: TierNode) => void
}

function calculateAggregatedData(node: TierNode): Record<string, number> {
  if (node.children.length === 0) {
    return node.data
  }

  const aggregated: Record<string, number> = {}

  // Sum all children's data
  node.children.forEach((child) => {
    const childData = calculateAggregatedData(child)
    Object.entries(childData).forEach(([key, value]) => {
      aggregated[key] = (aggregated[key] || 0) + value
    })
  })

  return aggregated
}

function getHeatmapColor(value: number, maxValue: number): string {
  if (maxValue === 0) return "bg-gray-100"

  const intensity = value / maxValue

  if (intensity === 0) return "bg-gray-100"
  if (intensity < 0.2) return "bg-emerald-200"
  if (intensity < 0.4) return "bg-emerald-300"
  if (intensity < 0.6) return "bg-emerald-400"
  if (intensity < 0.8) return "bg-emerald-500"
  return "bg-emerald-600"
}

export function HeatMapView({ node, columns, onSelectNode }: HeatMapViewProps) {
  const hasChildren = node.children.length > 0

  const displayData = hasChildren ? calculateAggregatedData(node) : node.data

  // Calculate max value for color scaling
  const maxValue = Math.max(...Object.values(displayData), 1)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-card-foreground mb-1">Heat Map</h2>
        <p className="text-sm text-muted-foreground">
          {hasChildren ? `Aggregated data from ${node.children.length} children` : "Direct tier data"}
        </p>
      </div>

      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{node.name}</span>
            <span>Total: {Object.values(displayData).reduce((a, b) => a + b, 0)}</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {columns.map((col) => {
              const value = displayData[col] || 0
              return (
                <div key={col} className="space-y-1">
                  <div className="text-xs font-medium text-center text-muted-foreground">{col}</div>
                  <div
                    className={cn(
                      "aspect-square rounded-lg flex items-center justify-center text-sm font-semibold transition-colors",
                      getHeatmapColor(value, maxValue),
                      value > maxValue * 0.5 ? "text-white" : "text-foreground",
                    )}
                  >
                    {value}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {hasChildren && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-card-foreground">Children Breakdown</h3>
          <div className="space-y-2">
            {node.children.map((child) => {
              const childData = calculateAggregatedData(child)
              const childMaxValue = Math.max(...Object.values(childData), 1)
              const childTotal = Object.values(childData).reduce((a, b) => a + b, 0)

              return (
                <Card
                  key={child.id}
                  className="p-3 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => onSelectNode(child)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{child.name}</span>
                      <span className="text-xs text-muted-foreground">Total: {childTotal}</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {columns.map((col) => {
                        const value = childData[col] || 0
                        return (
                          <div
                            key={col}
                            className={cn(
                              "aspect-square rounded flex items-center justify-center text-xs font-medium",
                              getHeatmapColor(value, childMaxValue),
                              value > childMaxValue * 0.5 ? "text-white" : "text-foreground",
                            )}
                            title={`${col}: ${value}`}
                          >
                            {value}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <Card className="p-3 bg-secondary">
        <div className="text-xs space-y-2">
          <div className="font-medium">Legend</div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[
                "bg-gray-100",
                "bg-emerald-200",
                "bg-emerald-300",
                "bg-emerald-400",
                "bg-emerald-500",
                "bg-emerald-600",
              ].map((color, i) => (
                <div key={i} className={cn("w-6 h-6 rounded", color)} />
              ))}
            </div>
            <span className="text-muted-foreground">Low → High</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
