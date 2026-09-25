import { ArrowUp } from '@phosphor-icons/react'

import { focusRingClass } from '../styles/interactive'
import { pressableClass } from '../styles/motion'
import type { MovieSort, SortOrder } from '../types/movie'

const SORT_OPTIONS: { value: MovieSort; label: string }[] = [
  { value: 'title', label: 'Título' },
  { value: 'popularity', label: 'Popularidade' },
  { value: 'rating', label: 'Nota média' },
  { value: 'reviews_count', label: 'Nº de avaliações' },
  { value: 'recent', label: 'Adicionados recentemente' },
]

interface SortControlProps {
  sort: MovieSort
  order: SortOrder
  onSortChange: (sort: MovieSort) => void
  onOrderChange: (order: SortOrder) => void
}

function SortControl({ sort, order, onSortChange, onOrderChange }: SortControlProps) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={sort}
        onChange={(event) => onSortChange(event.target.value as MovieSort)}
        aria-label="Ordenar por"
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onOrderChange(order === 'asc' ? 'desc' : 'asc')}
        aria-label={order === 'asc' ? 'Ordem crescente, clique para inverter' : 'Ordem decrescente, clique para inverter'}
        title={order === 'asc' ? 'Crescente' : 'Decrescente'}
        className={`rounded-md border border-border bg-surface p-2 text-ink-muted hover:border-accent hover:text-ink ${pressableClass} ${focusRingClass}`}
      >
        <ArrowUp
          size={18}
          className={`transition-transform duration-200 ease-out motion-reduce:transition-none ${order === 'asc' ? 'rotate-0' : 'rotate-180'}`}
        />
      </button>
    </div>
  )
}

export default SortControl
