import { CircleNotch } from '@phosphor-icons/react'

import { dashboardCardClass } from '../../styles/card'

const cardClass = dashboardCardClass

interface StatTileProps {
  label: string
  value: string
  sublabel?: string
}

function StatTile({ label, value, sublabel }: StatTileProps) {
  return (
    <div className={cardClass}>
      <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{value}</p>
      {sublabel && <p className="mt-1 truncate text-xs text-ink-muted">{sublabel}</p>}
    </div>
  )
}

export function StatTileSkeleton() {
  return (
    <div className={`relative ${cardClass}`}>
      <div className="h-3 w-24 animate-pulse rounded bg-surface-muted" />
      <div className="mt-2 h-7 w-16 animate-pulse rounded bg-surface-muted" />
      <div className="absolute top-1/2 right-4 -translate-y-1/2">
        <CircleNotch
          size={20}
          weight="bold"
          className="text-ink-muted/40 motion-safe:animate-spin-fast"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

export default StatTile
