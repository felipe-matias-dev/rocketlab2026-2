import { Funnel } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { listMovies } from '../api/movies'
import { listGenres } from '../api/genres'
import { ApiError } from '../api/client'
import ActiveFilterChips from '../components/ActiveFilterChips'
import FeaturedMovie from '../components/FeaturedMovie'
import FilterBar from '../components/FilterBar'
import MovieCard, { MovieCardSkeleton } from '../components/MovieCard'
import Pagination from '../components/Pagination'
import SearchBar from '../components/SearchBar'
import SortControl from '../components/SortControl'
import { focusRingClass } from '../styles/interactive'
import { pressableClass, staggerDelayMs } from '../styles/motion'
import type { Genre, MovieListItem, MovieSort, SortOrder } from '../types/movie'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 400
const FILTERS_TRANSITION_MS = 300

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
  animateEntrance: boolean
}

function CatalogGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {children}
    </div>
  )
}

// Posição real do filme na lista ordenada/filtrada atual — o número do quadro na prancha de
// contato, não um id inventado. Padded pro tamanho do maior número da lista atual.
function frameNumberFor(position: number, total: number): string {
  const width = Math.max(2, String(total).length)
  return String(position).padStart(width, '0')
}

// Marca de registro de impressão, uma nas quatro quinas da folha — a única flor de
// composição "impressa" da página; tudo mais no conteúdo fica sóbrio.
function RegistrationMark({ className }: { className: string }) {
  return (
    <span className={`pointer-events-none absolute z-10 h-3 w-3 ${className}`} aria-hidden="true">
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-ink-muted/50" />
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-ink-muted/50" />
    </span>
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
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const lastNonPageKeyRef = useRef<string | null>(null)
  const location = useLocation()
  const [resetKey, setResetKey] = useState(location.key)

  // O logo em Layout.tsx é um Link to="/", que é a própria rota do catálogo — clicar nele
  // enquanto já se está aqui não remonta o componente (mesma rota), então o estado local de
  // busca/filtro/ordenação não reseta sozinho. `location.key` muda a cada navegação, mesmo pra
  // uma URL idêntica; comparamos com o último key visto e ajustamos o estado direto no render
  // (padrão recomendado pelo React pra isso, em vez de um useEffect com setState em cascata).
  if (location.key !== resetKey) {
    setResetKey(location.key)
    setTextInput(EMPTY_TEXT_FILTERS)
    setTextFilters(EMPTY_TEXT_FILTERS)
    setGenreIds([])
    setSort('title')
    setOrder('desc')
    setPage(1)
    setFiltersOpen(false)
  }

  useEffect(() => {
    listGenres()
      .then(setGenres)
      .catch(() => setGenres([]))
  }, [])

  // O painel de filtros usa a técnica de animar grid-template-rows de 0fr pra 1fr, que exige
  // overflow-hidden no wrapper durante a transição pra "encolher" de verdade. Isso corta
  // dropdowns internos (ex.: combobox de gêneros) que ficam mais altos que o conteúdo. Por isso
  // só liberamos o overflow depois que a transição de abertura termina (o fechamento reaplica o
  // corte na hora, em toggleFilters, pra já estar ativo quando a transição de fechar começa).
  useEffect(() => {
    if (!filtersOpen) return
    const timeoutId = setTimeout(() => setFiltersExpanded(true), FILTERS_TRANSITION_MS)
    return () => clearTimeout(timeoutId)
  }, [filtersOpen])

  function toggleFilters() {
    setFiltersOpen((current) => {
      const next = !current
      if (!next) setFiltersExpanded(false)
      return next
    })
  }

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
    const nonPageKey = JSON.stringify({ genreIds, textFilters, sort, order })

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
          // Anima a entrada do grid só quando filtro/busca/ordenação mudou de verdade — nunca
          // numa paginação pura (mesma nonPageKey), já que DESIGN.md proíbe motion em ações de
          // alta frequência como trocar de página.
          const animateEntrance = lastNonPageKeyRef.current !== nonPageKey
          lastNonPageKeyRef.current = nonPageKey
          setData({
            key: filterKey(page, genreIds, textFilters, sort, order),
            movies: result.items,
            total: result.total,
            animateEntrance,
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

  // Aplica um filtro de texto imediatamente, sem esperar o debounce de digitação: usado pelo
  // chip "X" (remove na hora) e pela seleção de diretor no autocomplete (confirma na hora).
  function setConfirmedTextFilter<K extends keyof TextFilters>(field: K, value: TextFilters[K]) {
    setTextInput((current) => ({ ...current, [field]: value }))
    setTextFilters((current) => ({ ...current, [field]: value }))
    setPage(1)
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

  // Baseado em textFilters (confirmado), não textInput (digitação em andamento),
  // pra não piscar/mudar de contagem a cada letra digitada.
  const advancedFilterCount =
    (genreIds.length > 0 ? 1 : 0) +
    (textFilters.director !== '' ? 1 : 0) +
    (textFilters.yearFrom !== '' || textFilters.yearTo !== '' ? 1 : 0) +
    (textFilters.ratingMin !== '' ? 1 : 0)

  // Deriva o carregamento comparando os parâmetros já carregados com os atuais,
  // em vez de resetar `data` sincronamente no efeito (sem re-render extra).
  const currentKey = filterKey(page, genreIds, textFilters, sort, order)
  const isLoading = data === null || data.key !== currentKey
  const movies = isLoading ? null : data.movies
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE))

  return (
    <div>
      <FeaturedMovie />

      <div className="relative border border-border bg-surface">
        <RegistrationMark className="-top-1.5 -left-1.5" />
        <RegistrationMark className="-top-1.5 -right-1.5" />
        <RegistrationMark className="-bottom-1.5 -left-1.5" />
        <RegistrationMark className="-bottom-1.5 -right-1.5" />
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchBar value={textInput.q} onChange={(value) => updateTextFilter('q', value)} />
            <div className="ml-auto flex flex-wrap items-center gap-3">
              <SortControl sort={sort} order={order} onSortChange={changeSort} onOrderChange={changeOrder} />
              <button
                type="button"
                onClick={toggleFilters}
                aria-expanded={filtersOpen}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${pressableClass} ${focusRingClass} ${
                  filtersOpen
                    ? 'border-accent text-ink'
                    : 'border-border text-ink hover:border-accent'
                }`}
              >
                <Funnel size={18} />
                Filtros
                {advancedFilterCount > 0 && (
                  <span
                    key={advancedFilterCount}
                    className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold text-ink motion-safe:animate-pop-in motion-reduce:animate-none"
                  >
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
                director={textFilters.director}
                onDirectorChange={() => setConfirmedTextFilter('director', '')}
                yearFrom={textFilters.yearFrom}
                yearTo={textFilters.yearTo}
                onYearFromChange={() => setConfirmedTextFilter('yearFrom', '')}
                onYearToChange={() => setConfirmedTextFilter('yearTo', '')}
                ratingMin={textFilters.ratingMin}
                onRatingMinChange={() => setConfirmedTextFilter('ratingMin', '')}
                onClearAll={clearFilters}
              />
            </div>
          )}

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
              filtersOpen ? 'mt-4 grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className={`min-h-0 ${filtersExpanded ? '' : 'overflow-hidden'}`} inert={!filtersOpen}>
              <div
                className={`border-t border-border pt-4 transition-opacity duration-200 motion-reduce:transition-none ${
                  filtersOpen ? 'opacity-100 delay-100' : 'opacity-0'
                }`}
              >
                <FilterBar
                  genres={genres}
                  selectedGenreIds={genreIds}
                  onToggleGenre={toggleGenre}
                  director={textFilters.director}
                  onDirectorChange={(value) => setConfirmedTextFilter('director', value)}
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
            </div>
          </div>
        </div>

        <div className="border-t border-border p-4 sm:p-6">
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

          {!error && data !== null && movies !== null && movies.length > 0 && (
            <>
              <p className="mb-3 text-sm text-ink-muted">
                {data.total.toLocaleString('pt-BR')} {data.total === 1 ? 'filme encontrado' : 'filmes encontrados'}
              </p>
              <CatalogGrid>
                {movies.map((movie, index) => (
                  <MovieCard
                    key={movie.sk_movie_id}
                    movie={movie}
                    frameNumber={frameNumberFor((page - 1) * PAGE_SIZE + index + 1, data.total)}
                    entranceDelayMs={data.animateEntrance ? staggerDelayMs(index) : undefined}
                  />
                ))}
              </CatalogGrid>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CatalogPage
