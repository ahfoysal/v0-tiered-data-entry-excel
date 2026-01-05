interface Tier {
  id: string
  level: number
  name: string
}

export function getTierColor(tier: Tier): string {
  const colors = [
    "#e0e7ff", // indigo
    "#fce7f3", // pink
    "#dbeafe", // blue
    "#dcfce7", // green
    "#fef3c7", // amber
    "#f3e8ff", // purple
    "#e0f2fe", // cyan
    "#fecaca", // red
  ]

  return colors[tier.level % colors.length]
}
