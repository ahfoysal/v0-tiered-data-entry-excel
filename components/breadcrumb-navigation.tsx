"use client"
import { ChevronRight } from "lucide-react"

interface BreadcrumbItem {
  label: string
  id?: string
  onClick?: () => void
  isActive?: boolean
}

export function BreadcrumbNavigation({
  items,
  loading = false,
}: {
  items: BreadcrumbItem[]
  loading?: boolean
}) {
  return (
    <div className="flex items-center gap-2 px-6 py-3 bg-card border-b border-border overflow-x-auto">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2 whitespace-nowrap">
          <button
            onClick={item.onClick}
            disabled={!item.onClick || loading}
            className={`text-sm font-medium transition-colors ${
              item.isActive
                ? "text-foreground font-semibold"
                : item.onClick
                  ? "text-muted-foreground hover:text-foreground cursor-pointer"
                  : "text-muted-foreground cursor-default"
            } ${loading && item.onClick ? "opacity-50" : ""}`}
          >
            {item.label}
          </button>
          {index < items.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
        </div>
      ))}
    </div>
  )
}
