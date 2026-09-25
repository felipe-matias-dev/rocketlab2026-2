import { X } from '@phosphor-icons/react'

import { focusRingClass } from '../styles/interactive'
import type { Genre } from '../types/movie'
import { translateGenreName } from '../utils/genreLabels'

export interface ActiveFilterChipsProps {
  genres: Genre[] | null
  selectedGenreIds: string[]
  onToggleGenre: (genreId: string) => void
  director: string
  onDirectorChange: (value: string) => void
  yearFrom: string
  yearTo: string
  onYearFromChange: (value: string) => void
  onYearToChange: (value: string) => void
  ratingMin: string
  onRatingMinChange: (value: string) => void
  onClearAll: () => void
}

interface Chip {
  key: string
  label: string
  onRemove: () => void
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface py-1 pr-1 pl-3 text-xs font-medium text-ink">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover filtro: ${label}`}
        className={`flex h-4 w-4 items-center justify-center rounded-full text-ink-muted hover:bg-accent/10 hover:text-accent ${focusRingClass}`}
      >
        <X size={12} weight="bold" />
      </button>
    </span>
  )
}

function ActiveFilterChips({
  genres,
  selectedGenreIds,
  onToggleGenre,
  director,
  onDirectorChange,
  yearFrom,
  yearTo,
  onYearFromChange,
  onYearToChange,
  ratingMin,
  onRatingMinChange,
  onClearAll,
}: ActiveFilterChipsProps) {
  const chips: Chip[] = []

  for (const genreId of selectedGenreIds) {
    const genre = genres?.find((candidate) => candidate.sk_genre_id === genreId)
    chips.push({
      key: `genre-${genreId}`,
      label: genre ? translateGenreName(genre.nome_genero) : 'Gênero',
      onRemove: () => onToggleGenre(genreId),
    })
  }

  if (director !== '') {
    chips.push({
      key: 'director',
      label: `Diretor: ${director}`,
      onRemove: () => onDirectorChange(''),
    })
  }

  if (yearFrom !== '' || yearTo !== '') {
    let label: string
    if (yearFrom !== '' && yearTo !== '') label = `Ano: ${yearFrom}–${yearTo}`
    else if (yearFrom !== '') label = `Ano: a partir de ${yearFrom}`
    else label = `Ano: até ${yearTo}`

    chips.push({
      key: 'year',
      label,
      onRemove: () => {
        onYearFromChange('')
        onYearToChange('')
      },
    })
  }

  if (ratingMin !== '') {
    chips.push({
      key: 'rating',
      label: `Nota: a partir de ${ratingMin}`,
      onRemove: () => onRatingMinChange(''),
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Chip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className={`rounded-md px-2 py-1 text-xs font-medium text-ink underline decoration-accent decoration-2 underline-offset-2 hover:decoration-accent-hover ${focusRingClass}`}
      >
        Limpar tudo
      </button>
    </div>
  )
}

export default ActiveFilterChips
