import { CaretDown, Check } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

import { listDirectors } from '../api/directors'
import { focusRingClass } from '../styles/interactive'
import type { Genre } from '../types/movie'
import { translateGenreName } from '../utils/genreLabels'

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

// Bounds do dataset seedado (ver `backend/rocketlab.db`, tabela `dim_movies`):
// ano_lancamento vai de 2016 a 2029, não a história inteira do cinema.
const YEAR_MIN = 2016
const YEAR_MAX = 2029

const sliderThumbClass =
  'absolute inset-y-0 w-full cursor-pointer appearance-none bg-transparent pointer-events-none ' +
  '[&::-webkit-slider-runnable-track]:appearance-none [&::-moz-range-track]:appearance-none ' +
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 ' +
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full ' +
  '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:bg-surface ' +
  '[&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer ' +
  '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 ' +
  '[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 ' +
  '[&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:bg-surface [&::-moz-range-thumb]:shadow-sm ' +
  '[&::-moz-range-thumb]:cursor-pointer'

interface YearRangeSliderProps {
  fromValue: string
  toValue: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
}

function YearRangeSlider({ fromValue, toValue, onFromChange, onToChange }: YearRangeSliderProps) {
  const from = fromValue === '' ? YEAR_MIN : Number(fromValue)
  const to = toValue === '' ? YEAR_MAX : Number(toValue)

  function handleFromChange(nextValue: number) {
    const clamped = Math.min(nextValue, to)
    onFromChange(clamped <= YEAR_MIN ? '' : String(clamped))
  }

  function handleToChange(nextValue: number) {
    const clamped = Math.max(nextValue, from)
    onToChange(clamped >= YEAR_MAX ? '' : String(clamped))
  }

  const fromPercent = ((from - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 100
  const toPercent = ((to - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 100
  // Dá prioridade de z-index ao thumb mais próximo do fim, pra não ficar preso atrás do outro.
  const fromOnTop = from > YEAR_MIN + (YEAR_MAX - YEAR_MIN) / 2

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-medium text-ink">
        <span>{from}</span>
        <span>{to}</span>
      </div>
      <div className="relative h-4">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-border" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-accent"
          style={{ left: `${fromPercent}%`, right: `${100 - toPercent}%` }}
        />
        <input
          type="range"
          aria-label="Ano de lançamento mínimo"
          min={YEAR_MIN}
          max={YEAR_MAX}
          value={from}
          onChange={(event) => handleFromChange(Number(event.target.value))}
          className={`${sliderThumbClass} ${fromOnTop ? 'z-20' : 'z-10'}`}
        />
        <input
          type="range"
          aria-label="Ano de lançamento máximo"
          min={YEAR_MIN}
          max={YEAR_MAX}
          value={to}
          onChange={(event) => handleToChange(Number(event.target.value))}
          className={`${sliderThumbClass} ${fromOnTop ? 'z-10' : 'z-20'}`}
        />
      </div>
    </div>
  )
}

const RATING_MIN = 0
const RATING_MAX = 10
const RATING_STEP = 0.5

const singleThumbClass =
  'absolute inset-y-0 w-full cursor-pointer appearance-none bg-transparent ' +
  '[&::-webkit-slider-runnable-track]:appearance-none [&::-moz-range-track]:appearance-none ' +
  '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none ' +
  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent ' +
  '[&::-webkit-slider-thumb]:bg-surface [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer ' +
  '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full ' +
  '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:bg-surface [&::-moz-range-thumb]:shadow-sm ' +
  '[&::-moz-range-thumb]:cursor-pointer'

interface RatingMinSliderProps {
  value: string
  onChange: (value: string) => void
}

function RatingMinSlider({ value, onChange }: RatingMinSliderProps) {
  const numericValue = value === '' ? RATING_MIN : Number(value)

  function handleChange(nextValue: number) {
    onChange(nextValue <= RATING_MIN ? '' : String(nextValue))
  }

  const percent = ((numericValue - RATING_MIN) / (RATING_MAX - RATING_MIN)) * 100

  return (
    <div className="flex w-full flex-col gap-2">
      <span className="text-xs font-medium text-ink">
        {numericValue === RATING_MIN ? 'Todas as notas' : `A partir de ${numericValue}`}
      </span>
      <div className="relative h-4">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-border" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-accent"
          style={{ width: `${percent}%` }}
        />
        <input
          type="range"
          aria-label="Nota mínima"
          min={RATING_MIN}
          max={RATING_MAX}
          step={RATING_STEP}
          value={numericValue}
          onChange={(event) => handleChange(Number(event.target.value))}
          className={singleThumbClass}
        />
      </div>
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
        className={`flex w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm ${focusRingClass}`}
      >
        <span className={selectedGenreIds.length === 0 ? 'text-ink-muted' : 'text-ink'}>{summary}</span>
        <CaretDown size={14} className="shrink-0 text-ink-muted" />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-multiselectable="true"
          className="absolute top-full left-0 z-10 mt-1 max-h-64 w-full min-w-56 overflow-y-auto rounded-md border border-border bg-surface py-1 shadow-md"
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
                  className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm text-ink hover:bg-accent/10 ${focusRingClass}`}
                >
                  {translateGenreName(genre.nome_genero)}
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
        className={inputClass}
      />
      {showSuggestions && visibleSuggestions.length > 0 && (
        <ul className="absolute top-full left-0 z-10 mt-1 w-full min-w-max rounded-md border border-border bg-surface py-1 shadow-md">
          {visibleSuggestions.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => selectSuggestion(name)}
                className={`block w-full px-3 py-1.5 text-left text-sm whitespace-nowrap text-ink hover:bg-accent/10 ${focusRingClass}`}
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
  onRatingMinChange: (value: string) => void
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
  onRatingMinChange,
  hasActiveFilters,
  onClear,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <FilterGroup label="Gêneros">
          <GenreCombobox genres={genres} selectedGenreIds={selectedGenreIds} onToggleGenre={onToggleGenre} />
        </FilterGroup>

        <FilterGroup label="Diretor">
          <DirectorFilter value={director} onChange={onDirectorChange} />
        </FilterGroup>

        <FilterGroup label="Ano de lançamento">
          <YearRangeSlider
            fromValue={yearFrom}
            toValue={yearTo}
            onFromChange={onYearFromChange}
            onToChange={onYearToChange}
          />
        </FilterGroup>

        <FilterGroup label="Nota mínima (0-10)">
          <RatingMinSlider value={ratingMin} onChange={onRatingMinChange} />
        </FilterGroup>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className={`self-start rounded-md px-3 py-1.5 text-sm font-medium text-ink underline decoration-accent decoration-2 underline-offset-2 hover:decoration-accent-hover ${focusRingClass}`}
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}

export default FilterBar
