import { useEffect, useState } from 'react'

import { listMovies } from '../api/movies'
import { ApiError } from '../api/client'
import MovieCard, { MovieCardSkeleton } from '../components/MovieCard'
import Pagination from '../components/Pagination'
import SearchBar from '../components/SearchBar'
import type { MovieListItem } from '../types/movie'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 400

interface CatalogData {
  page: number
  query: string
  movies: MovieListItem[]
  total: number
}

function CatalogGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {children}
    </div>
  )
}

function CatalogPage() {
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<CatalogData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Debounce: só promove searchInput -> query (o que de fato dispara a busca)
  // depois que o usuário para de digitar, e volta pra página 1.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setQuery(searchInput.trim())
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeoutId)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false

    listMovies({ page, page_size: PAGE_SIZE, q: query || undefined })
      .then((result) => {
        if (!cancelled) setData({ page, query, movies: result.items, total: result.total })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Erro ao carregar filmes.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [page, query])

  // Deriva o carregamento comparando página/busca já carregadas com as atuais,
  // em vez de resetar `data` sincronamente no efeito (sem re-render extra).
  const isLoading = data === null || data.page !== page || data.query !== query
  const movies = isLoading ? null : data.movies
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink">Catálogo</h1>
        <SearchBar value={searchInput} onChange={setSearchInput} />
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
            {query
              ? `Nenhum filme encontrado para "${query}".`
              : 'Nenhum filme encontrado.'}
          </p>
        )}

        {!error && movies !== null && movies.length > 0 && (
          <>
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
