import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../api/client'
import { listGenres } from '../api/genres'
import { listMovies } from '../api/movies'
import type { Genre, MovieListItem } from '../types/movie'
import CatalogPage from './CatalogPage'

vi.mock('../api/movies', () => ({
  listMovies: vi.fn(),
}))

vi.mock('../api/genres', () => ({
  listGenres: vi.fn(),
}))

// FeaturedMovie makes its own, independent calls to the movies API and is already covered by
// FeaturedMovie.test.tsx — stubbing it out keeps these tests focused on the catalog grid itself.
vi.mock('../components/FeaturedMovie', () => ({
  default: () => null,
}))

const mockedListMovies = vi.mocked(listMovies)
const mockedListGenres = vi.mocked(listGenres)

const genres: Genre[] = [{ sk_genre_id: 'g1', nome_genero: 'Horror' }]

function movie(overrides: Partial<MovieListItem> = {}): MovieListItem {
  return {
    sk_movie_id: 'm1',
    titulo: 'Duna',
    ano_lancamento: 2021,
    url_poster: null,
    nota_media: 8.4,
    qtd_avaliacoes: 3,
    popularidade: 100,
    ...overrides,
  }
}

function renderCatalog() {
  return render(
    <MemoryRouter>
      <CatalogPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockedListGenres.mockResolvedValue(genres)
  mockedListMovies.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20 })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('CatalogPage', () => {
  it('shows no results yet while the first page is loading', () => {
    mockedListMovies.mockReturnValue(new Promise(() => {}))

    renderCatalog()

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByText(/filme/)).not.toBeInTheDocument()
  })

  it('renders the fetched movies with a pluralized results count', async () => {
    mockedListMovies.mockResolvedValue({
      items: [movie({ sk_movie_id: 'm1', titulo: 'Duna' }), movie({ sk_movie_id: 'm2', titulo: 'Arrival' })],
      total: 2,
      page: 1,
      page_size: 20,
    })

    renderCatalog()

    expect(await screen.findByText('2 filmes encontrados')).toBeInTheDocument()
    expect(screen.getByText('Duna')).toBeInTheDocument()
    expect(screen.getByText('Arrival')).toBeInTheDocument()
  })

  it('uses the singular results count for exactly one movie', async () => {
    mockedListMovies.mockResolvedValue({ items: [movie()], total: 1, page: 1, page_size: 20 })

    renderCatalog()

    expect(await screen.findByText('1 filme encontrado')).toBeInTheDocument()
  })

  it('shows a plain empty state when there are no movies and no filters applied', async () => {
    renderCatalog()

    expect(await screen.findByText('Nenhum filme encontrado.')).toBeInTheDocument()
  })

  it('shows a filter-aware empty state once a search is applied', async () => {
    renderCatalog()
    await screen.findByText('Nenhum filme encontrado.')

    fireEvent.change(screen.getByLabelText('Buscar por título'), { target: { value: 'xyz-nada' } })

    expect(await screen.findByText('Nenhum filme encontrado para esses filtros.', {}, { timeout: 1000 })).toBeInTheDocument()
  })

  it('shows the API error message when the request fails', async () => {
    mockedListMovies.mockRejectedValue(new ApiError(500, 'Erro no servidor'))

    renderCatalog()

    expect(await screen.findByText('Erro no servidor')).toBeInTheDocument()
  })

  it('falls back to a generic error message for a non-API failure', async () => {
    mockedListMovies.mockRejectedValue(new Error('boom'))

    renderCatalog()

    expect(await screen.findByText('Erro ao carregar filmes.')).toBeInTheDocument()
  })

  it('debounces the search box before refetching', async () => {
    renderCatalog()
    await screen.findByText('Nenhum filme encontrado.')
    mockedListMovies.mockClear()

    fireEvent.change(screen.getByLabelText('Buscar por título'), { target: { value: 'duna' } })

    expect(mockedListMovies).not.toHaveBeenCalled()
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(mockedListMovies).not.toHaveBeenCalled()

    await waitFor(
      () => expect(mockedListMovies).toHaveBeenCalledWith(expect.objectContaining({ q: 'duna', page: 1 })),
      { timeout: 1000 },
    )
  })

  it('fetches the requested page when Pagination is used', async () => {
    mockedListMovies.mockResolvedValue({ items: [movie()], total: 50, page: 1, page_size: 20 })
    renderCatalog()
    await screen.findByText('50 filmes encontrados')
    mockedListMovies.mockClear()

    fireEvent.click(screen.getByRole('button', { name: '2' }))

    expect(mockedListMovies.mock.calls.at(-1)?.[0]).toMatchObject({ page: 2 })
  })

  // Regression note: CatalogPage also resets `page` to 1 from an unrelated debounce effect that
  // fires ~400ms after every mount (harmless in the real app, since page is already 1 then). If
  // this assertion used `waitFor`/awaited anything slow first, that incidental reset could fire
  // and mask a real regression in `changeSort` — so it checks the call synchronously, right after
  // the triggering event, before that timer has a chance to run.
  it('resets to page 1 when the sort field changes', async () => {
    mockedListMovies.mockResolvedValue({ items: [movie()], total: 50, page: 1, page_size: 20 })
    renderCatalog()
    await screen.findByText('50 filmes encontrados')
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    expect(mockedListMovies.mock.calls.at(-1)?.[0]).toMatchObject({ page: 2 })

    fireEvent.change(screen.getByLabelText('Ordenar por'), { target: { value: 'rating' } })

    expect(mockedListMovies.mock.calls.at(-1)?.[0]).toMatchObject({ sort: 'rating', page: 1 })
  })

  it('opens the filters panel and toggles its expanded state', () => {
    renderCatalog()

    const toggle = screen.getByRole('button', { name: /filtros/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  // Same timing note as the sort-reset test above: genres are already loaded by the time the
  // initial results render, so every step here runs as one synchronous burst of fireEvents with
  // no intervening `await`, keeping the incidental mount-debounce timer out of the picture.
  it('refetches with the selected genre and resets to page 1', async () => {
    mockedListMovies.mockResolvedValue({ items: [movie()], total: 50, page: 1, page_size: 20 })
    renderCatalog()
    await screen.findByText('50 filmes encontrados')

    fireEvent.click(screen.getByRole('button', { name: '2' }))
    expect(mockedListMovies.mock.calls.at(-1)?.[0]).toMatchObject({ page: 2 })

    fireEvent.click(screen.getByRole('button', { name: /filtros/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Todos os gêneros' }))
    fireEvent.click(screen.getByRole('option', { name: 'Terror' }))

    expect(mockedListMovies.mock.calls.at(-1)?.[0]).toMatchObject({ genre_ids: ['g1'], page: 1 })
    expect(screen.getByRole('button', { name: 'Remover filtro: Terror' })).toBeInTheDocument()
  })

  it('clears every filter when "Limpar filtros" is clicked', async () => {
    mockedListMovies.mockResolvedValue({ items: [movie()], total: 50, page: 1, page_size: 20 })
    renderCatalog()
    await screen.findByText('50 filmes encontrados')

    fireEvent.click(screen.getByRole('button', { name: /filtros/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'Todos os gêneros' }))
    fireEvent.click(screen.getByRole('option', { name: 'Terror' }))
    await waitFor(() => expect(mockedListMovies).toHaveBeenCalledWith(expect.objectContaining({ genre_ids: ['g1'] })))
    mockedListMovies.mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    await waitFor(() =>
      expect(mockedListMovies).toHaveBeenCalledWith(expect.objectContaining({ genre_ids: undefined, page: 1 })),
    )
  })
})
