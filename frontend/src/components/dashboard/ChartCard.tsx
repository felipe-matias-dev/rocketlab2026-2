import { CircleNotch } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

const cardClass =
  'rounded-md bg-surface p-4 shadow-[0_4px_8px_rgba(28,25,23,0.06),0_20px_32px_-8px_rgba(28,25,23,0.18)] ring-1 ring-black/5 sm:p-6'

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
