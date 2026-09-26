import { Link } from 'react-router-dom'

import { focusRingClass } from '../../styles/interactive'

export interface RankingItem {
  key: string
  href?: string
  title: string
  value: string
  subvalue?: string
}

interface RankingListProps {
  items: RankingItem[]
  emptyMessage: string
}

function RankingList({ items, emptyMessage }: RankingListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-muted">{emptyMessage}</p>
  }

  return (
    <ol className="divide-y divide-border">
      {items.map((item, index) => {
        const content = (
          <>
            <span className="w-6 shrink-0 text-sm font-medium tabular-nums text-ink-muted">{index + 1}</span>
            <span className="flex-1 truncate text-sm text-ink">{item.title}</span>
            <span className="shrink-0 text-right text-sm font-medium tabular-nums text-ink">
              {item.value}
              {item.subvalue && (
                <span className="ml-1.5 text-xs font-normal text-ink-muted">{item.subvalue}</span>
              )}
            </span>
          </>
        )

        return (
          <li key={item.key}>
            {item.href ? (
              <Link
                to={item.href}
                className={`flex items-center gap-3 rounded-md py-2 hover:text-accent ${focusRingClass}`}
              >
                {content}
              </Link>
            ) : (
              <div className="flex items-center gap-3 py-2">{content}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default RankingList
