"use client"

import { Spinner } from "@/components/ui/spinner"

export function LoadingOverlay({
  isLoading,
  message = "Loading...",
}: {
  isLoading: boolean
  message?: string
}) {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-8 flex flex-col items-center gap-4">
        <Spinner />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
