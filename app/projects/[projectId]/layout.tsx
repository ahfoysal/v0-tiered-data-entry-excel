"use client"

import type React from "react"

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { projectId: string }
}) {
  return <>{children}</>
}
