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
      <div className="h-56 w-full animate-pulse rounded bg-surface-muted" />
    </div>
  )
}

export default ChartCard
