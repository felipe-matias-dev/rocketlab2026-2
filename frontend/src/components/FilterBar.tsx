import { CaretDown, Check } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

import { listDirectors } from '../api/directors'
import type { Genre } from '../types/movie'

const inputClass =
  'w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none'

const DIRECTOR_SUGGESTIONS_DEBOUNCE_MS = 300

interface FilterGroupProps {
  label: string
  children: React.ReactNode
}

function FilterGroup({ label, children }: FilterGroupProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </div>
  )
}

interface RangeInputsProps {
  fromValue: string
  toValue: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  fromLabel: string
  toLabel: string
  min?: number
  max?: number
  step?: number
}

function RangeInputs({
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  fromLabel,
  toLabel,
  min,
  max,
  step,
}: RangeInputsProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        inputMode="decimal"
        value={fromValue}
        onChange={(event) => onFromChange(event.target.value)}
        placeholder={fromLabel}
        aria-label={fromLabel}
        min={min}
        max={max}
        step={step}
        className={`${inputClass} w-20`}
      />
      <span className="text-ink-muted">–</span>
      <input
        type="number"
        inputMode="decimal"
        value={toValue}
        onChange={(event) => onToChange(event.target.value)}
        placeholder={toLabel}
        aria-label={toLabel}
        min={min}
        max={max}
        step={step}
        className={`${inputClass} w-20`}
      />
    </div>
  )
}

interface GenreComboboxProps {
  genres: Genre[] | null
  selectedGenreIds: string[]
  onToggleGenre: (genreId: string) => void
}

function GenreCombobox({ genres, selectedGenreIds, onToggleGenre }: GenreComboboxProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const summary =
    selectedGenreIds.length === 0
      ? 'Todos os gêneros'
      : `${selectedGenreIds.length} selecionado${selectedGenreIds.length > 1 ? 's' : ''}`

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-48 items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
      >
        <span className={selectedGenreIds.length === 0 ? 'text-ink-muted' : 'text-ink'}>{summary}</span>
        <CaretDown size={14} className="shrink-0 text-ink-muted" />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-multiselectable="true"
          className="absolute top-full left-0 z-10 mt-1 max-h-64 w-56 overflow-y-auto rounded-md border border-border bg-surface py-1 shadow-md"
        >
          {genres === null && <li className="px-3 py-1.5 text-sm text-ink-muted">Carregando...</li>}
          {genres?.map((genre) => {
            const selected = selectedGenreIds.includes(genre.sk_genre_id)
            return (
              <li key={genre.sk_genre_id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => onToggleGenre(genre.sk_genre_id)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm text-ink hover:bg-accent/10"
                >
                  {genre.nome_genero}
                  {selected && <Check size={14} className="shrink-0 text-accent" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

interface DirectorFilterProps {
  value: string
  onChange: (value: string) => void
}

function DirectorFilter({ value, onChange }: DirectorFilterProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const trimmed = value.trim()
    if (trimmed.length < 2) return

    let cancelled = false
    const timeoutId = setTimeout(() => {
      listDirectors({ q: trimmed, limit: 8 })
        .then((result) => {
          if (!cancelled) setSuggestions(result)
        })
        .catch(() => {
          if (!cancelled) setSuggestions([])
        })
    }, DIRECTOR_SUGGESTIONS_DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [value])

  // Deriva a visibilidade em vez de limpar `suggestions` sincronamente no efeito:
  // evita mostrar sugestões de uma busca anterior quando o texto atual ficou curto.
  const visibleSuggestions = value.trim().length >= 2 ? suggestions : []

  function selectSuggestion(name: string) {
    clearTimeout(blurTimeoutRef.current)
    onChange(name)
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => {
          blurTimeoutRef.current = setTimeout(() => setShowSuggestions(false), 150)
        }}
        placeholder="Buscar diretor..."
        aria-label="Filtrar por diretor"
        className={`${inputClass} w-48`}
      />
      {showSuggestions && visibleSuggestions.length > 0 && (
        <ul className="absolute top-full left-0 z-10 mt-1 w-full min-w-max rounded-md border border-border bg-surface py-1 shadow-md">
          {visibleSuggestions.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => selectSuggestion(name)}
                className="block w-full px-3 py-1.5 text-left text-sm whitespace-nowrap text-ink hover:bg-accent/10"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export interface FilterBarProps {
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
  ratingMax: string
  onRatingMinChange: (value: string) => void
  onRatingMaxChange: (value: string) => void
  hasActiveFilters: boolean
  onClear: () => void
}

function FilterBar({
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
  ratingMax,
  onRatingMinChange,
  onRatingMaxChange,
  hasActiveFilters,
  onClear,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-md border border-border bg-surface p-4">
      <FilterGroup label="Gêneros">
        <GenreCombobox genres={genres} selectedGenreIds={selectedGenreIds} onToggleGenre={onToggleGenre} />
      </FilterGroup>

      <FilterGroup label="Diretor">
        <DirectorFilter value={director} onChange={onDirectorChange} />
      </FilterGroup>

      <FilterGroup label="Ano de lançamento">
        <RangeInputs
          fromValue={yearFrom}
          toValue={yearTo}
          onFromChange={onYearFromChange}
          onToChange={onYearToChange}
          fromLabel="De"
          toLabel="Até"
          min={1888}
          max={2100}
        />
      </FilterGroup>

      <FilterGroup label="Nota média (0-10)">
        <RangeInputs
          fromValue={ratingMin}
          toValue={ratingMax}
          onFromChange={onRatingMinChange}
          onToChange={onRatingMaxChange}
          fromLabel="De"
          toLabel="Até"
          min={0}
          max={10}
          step={0.5}
        />
      </FilterGroup>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-accent hover:underline"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}

export default FilterBar
