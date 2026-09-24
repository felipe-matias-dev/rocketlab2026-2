import { CaretLeft, CaretRight } from '@phosphor-icons/react'

import { focusRingClass } from '../styles/interactive'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

const WINDOW_SIZE = 5

type PageItem = number | 'ellipsis-start' | 'ellipsis-end'

function getPageItems(page: number, totalPages: number): PageItem[] {
  const start = Math.min(Math.max(page - 2, 1), Math.max(totalPages - WINDOW_SIZE + 1, 1))
  const end = Math.min(start + WINDOW_SIZE - 1, totalPages)

  const items: PageItem[] = []
  if (start > 1) {
    items.push(1)
    if (start > 2) items.push('ellipsis-start')
  }
  for (let p = start; p <= end; p++) items.push(p)
  if (end < totalPages) {
    if (end < totalPages - 1) items.push('ellipsis-end')
    items.push(totalPages)
  }
  return items
}

const arrowButtonClass =
  `flex min-h-11 items-center gap-1 rounded-md border border-border px-3.5 py-2 text-sm text-ink transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border ${focusRingClass}`

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-label="Paginação">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={arrowButtonClass}
      >
        <CaretLeft size={16} />
        Anterior
      </button>

      {getPageItems(page, totalPages).map((item, index) =>
        typeof item === 'number' ? (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={
              item === page
                ? `flex min-h-11 min-w-11 items-center justify-center rounded-md border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-ink ${focusRingClass}`
                : `flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent ${focusRingClass}`
            }
          >
            {item}
          </button>
        ) : (
          <span key={`${item}-${index}`} className="px-1 text-sm text-ink-muted">
            …
          </span>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={arrowButtonClass}
      >
        Próxima
        <CaretRight size={16} />
      </button>
    </nav>
  )
}

export default Pagination
