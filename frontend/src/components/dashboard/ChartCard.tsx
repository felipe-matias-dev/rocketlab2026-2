import { CircleNotch } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

import { dashboardCardClass } from '../../styles/card'

const cardClass = `${dashboardCardClass} sm:p-6`

interface ChartCardProps {
  title: string
  children: ReactNode
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className={cardClass}>
      <h2 className="mb-4 text-sm font-semibold text-ink">{title}</h2>
      {children}
    </div>
  )
}

export function ChartCardSkeleton({ title }: { title: string }) {
  return (
    <div className={cardClass}>
      <h2 className="mb-4 text-sm font-semibold text-ink">{title}</h2>
      <div className="relative flex h-56 w-full items-center justify-center rounded bg-surface-muted">
        <div className="absolute inset-0 animate-pulse rounded bg-surface-muted" />
        <CircleNotch
          size={28}
          weight="bold"
          className="relative text-ink-muted/40 motion-safe:animate-spin-fast"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

export default ChartCard
