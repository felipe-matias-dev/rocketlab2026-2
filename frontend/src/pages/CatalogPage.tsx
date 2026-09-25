import { Funnel } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

import { listMovies } from '../api/movies'
import { listGenres } from '../api/genres'
import { ApiError } from '../api/client'
import ActiveFilterChips from '../components/ActiveFilterChips'
import FilterBar from '../components/FilterBar'
import MovieCard, { MovieCardSkeleton } from '../components/MovieCard'
import Pagination from '../components/Pagination'
import SearchBar from '../components/SearchBar'
import SortControl from '../components/SortControl'
import { focusRingClass } from '../styles/interactive'
import type { Genre, MovieListItem, MovieSort, SortOrder } from '../types/movie'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 400

interface TextFilters {
  q: string
  director: string
  yearFrom: string
  yearTo: string
  ratingMin: string
}

const EMPTY_TEXT_FILTERS: TextFilters = {
  q: '',
  director: '',
  yearFrom: '',
  yearTo: '',
  ratingMin: '',
}

interface CatalogData {
  key: string
  movies: MovieListItem[]
  total: number
}

function CatalogGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {children}
    </div>
  )
}

function filterKey(
  page: number,
  genreIds: string[],
  filters: TextFilters,
  sort: MovieSort,
  order: SortOrder,
): string {
  return JSON.stringify({ page, genreIds, filters, sort, order })
}

function CatalogPage() {
  const [textInput, setTextInput] = useState<TextFilters>(EMPTY_TEXT_FILTERS)
  const [textFilters, setTextFilters] = useState<TextFilters>(EMPTY_TEXT_FILTERS)
  const [genreIds, setGenreIds] = useState<string[]>([])
  const [genres, setGenres] = useState<Genre[] | null>(null)
  const [sort, setSort] = useState<MovieSort>('title')
  const [order, setOrder] = useState<SortOrder>('desc')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<CatalogData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    listGenres()
      .then(setGenres)
      .catch(() => setGenres([]))
  }, [])

  // Debounce: só promove textInput -> textFilters (o que de fato dispara a busca)
  // depois que o usuário para de digitar, e volta pra página 1.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTextFilters(textInput)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeoutId)
  }, [textInput])

  useEffect(() => {
    let cancelled = false

    listMovies({
      page,
      page_size: PAGE_SIZE,
      q: textFilters.q || undefined,
      genre_ids: genreIds.length > 0 ? genreIds : undefined,
      director: textFilters.director || undefined,
      year_from: textFilters.yearFrom ? Number(textFilters.yearFrom) : undefined,
      year_to: textFilters.yearTo ? Number(textFilters.yearTo) : undefined,
      rating_min: textFilters.ratingMin ? Number(textFilters.ratingMin) : undefined,
      sort,
      order,
    })
      .then((result) => {
        if (!cancelled) {
          setData({
            key: filterKey(page, genreIds, textFilters, sort, order),
            movies: result.items,
            total: result.total,
          })
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Erro ao carregar filmes.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [page, genreIds, textFilters, sort, order])

  function updateTextFilter<K extends keyof TextFilters>(field: K, value: TextFilters[K]) {
    setTextInput((current) => ({ ...current, [field]: value }))
  }

  function toggleGenre(genreId: string) {
    setGenreIds((current) =>
      current.includes(genreId) ? current.filter((id) => id !== genreId) : [...current, genreId],
    )
    setPage(1)
  }

  function clearFilters() {
    setTextInput(EMPTY_TEXT_FILTERS)
    setTextFilters(EMPTY_TEXT_FILTERS)
    setGenreIds([])
    setPage(1)
  }

  function changeSort(nextSort: MovieSort) {
    setSort(nextSort)
    setPage(1)
  }

  function changeOrder(nextOrder: SortOrder) {
    setOrder(nextOrder)
    setPage(1)
  }

  const hasActiveFilters =
    genreIds.length > 0 || Object.values(textInput).some((value) => value !== '')

  const advancedFilterCount =
    (genreIds.length > 0 ? 1 : 0) +
    (textInput.director !== '' ? 1 : 0) +
    (textInput.yearFrom !== '' || textInput.yearTo !== '' ? 1 : 0) +
    (textInput.ratingMin !== '' ? 1 : 0)

  // Deriva o carregamento comparando os parâmetros já carregados com os atuais,
  // em vez de resetar `data` sincronamente no efeito (sem re-render extra).
  const currentKey = filterKey(page, genreIds, textFilters, sort, order)
  const isLoading = data === null || data.key !== currentKey
  const movies = isLoading ? null : data.movies
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE))

  return (
    <div>
      <div className="rounded-md bg-surface p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_20px_-6px_rgba(28,25,23,0.08)] ring-1 ring-black/5">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar value={textInput.q} onChange={(value) => updateTextFilter('q', value)} />
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <SortControl sort={sort} order={order} onSortChange={changeSort} onOrderChange={changeOrder} />
            <button
              type="button"
              onClick={() => setFiltersOpen((current) => !current)}
              aria-expanded={filtersOpen}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${focusRingClass} ${
                filtersOpen
                  ? 'border-accent text-ink'
                  : 'border-border text-ink hover:border-accent'
              }`}
            >
              <Funnel size={18} />
              Filtros
              {advancedFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold text-ink">
                  {advancedFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {advancedFilterCount > 0 && (
          <div className="mt-3">
            <ActiveFilterChips
              genres={genres}
              selectedGenreIds={genreIds}
              onToggleGenre={toggleGenre}
              director={textInput.director}
              onDirectorChange={(value) => updateTextFilter('director', value)}
              yearFrom={textInput.yearFrom}
              yearTo={textInput.yearTo}
              onYearFromChange={(value) => updateTextFilter('yearFrom', value)}
              onYearToChange={(value) => updateTextFilter('yearTo', value)}
              ratingMin={textInput.ratingMin}
              onRatingMinChange={(value) => updateTextFilter('ratingMin', value)}
              onClearAll={clearFilters}
            />
          </div>
        )}

        {filtersOpen && (
          <div className="mt-4 border-t border-border pt-4">
            <FilterBar
              genres={genres}
              selectedGenreIds={genreIds}
              onToggleGenre={toggleGenre}
              director={textInput.director}
              onDirectorChange={(value) => updateTextFilter('director', value)}
              yearFrom={textInput.yearFrom}
              yearTo={textInput.yearTo}
              onYearFromChange={(value) => updateTextFilter('yearFrom', value)}
              onYearToChange={(value) => updateTextFilter('yearTo', value)}
              ratingMin={textInput.ratingMin}
              onRatingMinChange={(value) => updateTextFilter('ratingMin', value)}
              hasActiveFilters={hasActiveFilters}
              onClear={clearFilters}
            />
          </div>
        )}
      </div>

      <div className="mt-6">
        {error && <p className="text-destructive">{error}</p>}

        {!error && movies === null && (
          <CatalogGrid>
            {Array.from({ length: PAGE_SIZE }, (_, index) => (
              <MovieCardSkeleton key={index} />
            ))}
          </CatalogGrid>
        )}

        {!error && movies !== null && movies.length === 0 && (
          <p className="text-ink-muted">
            {hasActiveFilters
              ? 'Nenhum filme encontrado para esses filtros.'
              : 'Nenhum filme encontrado.'}
          </p>
        )}

        {!error && movies !== null && movies.length > 0 && (
          <>
            <p className="mb-3 text-sm text-ink-muted">
              {data.total.toLocaleString('pt-BR')} {data.total === 1 ? 'filme encontrado' : 'filmes encontrados'}
            </p>
            <CatalogGrid>
              {movies.map((movie) => (
                <MovieCard key={movie.sk_movie_id} movie={movie} />
              ))}
            </CatalogGrid>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}

export default CatalogPage
