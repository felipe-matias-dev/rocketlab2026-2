import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
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

function LocationSearch() {
  const location = useLocation()
  return <div data-testid="location-search">{location.search}</div>
}

function renderCatalog(initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <LocationSearch />
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

  describe('URL sync', () => {
    it('restores search, sort, order and page from the URL on mount', async () => {
      mockedListMovies.mockResolvedValue({ items: [movie()], total: 50, page: 2, page_size: 20 })

      renderCatalog(['/?q=duna&sort=rating&order=asc&page=2'])

      await waitFor(() =>
        expect(mockedListMovies).toHaveBeenCalledWith(
          expect.objectContaining({ q: 'duna', sort: 'rating', order: 'asc', page: 2 }),
        ),
      )
      expect(screen.getByLabelText('Buscar por título')).toHaveValue('duna')
      expect(screen.getByLabelText('Ordenar por')).toHaveValue('rating')
    })

    // Regression test: the debounce effect that commits typed filters into the URL used to run
    // unconditionally ~400ms after every mount (a documented, previously-harmless quirk since
    // page was always 1 in tests written before URL sync existed) — which reset `page` back to 1
    // even when nothing had actually changed, silently undoing a deep link to page 2+.
    it('keeps a deep-linked page after the debounce window passes without any typing', async () => {
      mockedListMovies.mockResolvedValue({ items: [movie()], total: 50, page: 2, page_size: 20 })
      renderCatalog(['/?page=2'])
      await waitFor(() =>
        expect(mockedListMovies).toHaveBeenCalledWith(expect.objectContaining({ page: 2 })),
      )
      mockedListMovies.mockClear()

      await new Promise((resolve) => setTimeout(resolve, 500))

      expect(mockedListMovies).not.toHaveBeenCalled()
      expect(screen.getByTestId('location-search')).toHaveTextContent('page=2')
    })

    it('ignores an invalid sort value from the URL and falls back to the default', async () => {
      renderCatalog(['/?sort=nao-existe'])

      await waitFor(() =>
        expect(mockedListMovies).toHaveBeenCalledWith(expect.objectContaining({ sort: 'title' })),
      )
    })

    it('writes the debounced search into the URL, so a refresh would keep it', async () => {
      renderCatalog()
      await screen.findByText('Nenhum filme encontrado.')

      fireEvent.change(screen.getByLabelText('Buscar por título'), { target: { value: 'duna' } })

      await waitFor(() => expect(screen.getByTestId('location-search')).toHaveTextContent('q=duna'))
    })

    it('writes the selected page into the URL', async () => {
      mockedListMovies.mockResolvedValue({ items: [movie()], total: 50, page: 1, page_size: 20 })
      renderCatalog()
      await screen.findByText('50 filmes encontrados')

      fireEvent.click(screen.getByRole('button', { name: '2' }))

      expect(screen.getByTestId('location-search')).toHaveTextContent('page=2')
    })

    it('omits page=1 from the URL, keeping links to the first page short', async () => {
      mockedListMovies.mockResolvedValue({ items: [movie()], total: 50, page: 1, page_size: 20 })
      renderCatalog(['/?page=2'])
      await screen.findByText('50 filmes encontrados')

      fireEvent.click(screen.getByRole('button', { name: '1' }))

      expect(screen.getByTestId('location-search')).not.toHaveTextContent('page=1')
    })

    it('clears the URL back to the bare path when filters are cleared', async () => {
      mockedListMovies.mockResolvedValue({ items: [movie()], total: 50, page: 1, page_size: 20 })
      renderCatalog(['/?q=duna'])
      await waitFor(() =>
        expect(mockedListMovies).toHaveBeenCalledWith(expect.objectContaining({ q: 'duna' })),
      )

      fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
      fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))

      await waitFor(() => expect(screen.getByTestId('location-search').textContent).toBe(''))
    })
  })
})
