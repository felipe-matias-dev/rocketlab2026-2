import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getMovie, listMovies } from '../api/movies'
import type { MovieDetail, MovieListItem } from '../types/movie'
import FeaturedMovie from './FeaturedMovie'

vi.mock('../api/movies', () => ({
  listMovies: vi.fn(),
  getMovie: vi.fn(),
}))

const mockedListMovies = vi.mocked(listMovies)
const mockedGetMovie = vi.mocked(getMovie)

const candidate: MovieListItem = {
  sk_movie_id: 'm1',
  titulo: 'Duna',
  ano_lancamento: 2021,
  url_poster: null,
  nota_media: 8.4,
  qtd_avaliacoes: 3,
  popularidade: 120,
}

const detail: MovieDetail = {
  sk_movie_id: 'm1',
  id_filme: 'f1',
  titulo: 'Duna',
  data_lancamento: '2021-10-21',
  ano_lancamento: 2021,
  duracao_minutos: 155,
  status_filme: 'Lançado',
  sinopse: 'Um jovem herdeiro enfrenta seu destino em um planeta desértico.',
  url_poster: null,
  url_backdrop: null,
  genres: [{ sk_genre_id: 'g1', nome_genero: 'Science Fiction' }],
  people: [],
  companies: [],
  reviews: [],
  nota_media: 8.4,
  qtd_avaliacoes: 3,
  performance: null,
}

function renderFeatured() {
  return render(
    <MemoryRouter>
      <FeaturedMovie />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('FeaturedMovie', () => {
  it('shows the skeleton before the data has loaded', () => {
    mockedListMovies.mockReturnValue(new Promise(() => {}))

    renderFeatured()

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('renders the picked movie once loaded', async () => {
    mockedListMovies.mockResolvedValue({ items: [candidate], total: 1, page: 1, page_size: 50 })
    mockedGetMovie.mockResolvedValue(detail)

    renderFeatured()

    expect(await screen.findByRole('heading', { name: 'Duna' })).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/movies/m1')
    expect(screen.getByText('Ficção Científica', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('3 avaliações')).toBeInTheDocument()
    expect(screen.getByText(detail.sinopse!)).toBeInTheDocument()
  })

  it('uses the singular word for exactly one review', async () => {
    mockedListMovies.mockResolvedValue({ items: [candidate], total: 1, page: 1, page_size: 50 })
    mockedGetMovie.mockResolvedValue({ ...detail, qtd_avaliacoes: 1 })

    renderFeatured()

    expect(await screen.findByText('1 avaliação')).toBeInTheDocument()
  })

  it('shows "Sem avaliações" when the picked movie has none', async () => {
    mockedListMovies.mockResolvedValue({ items: [candidate], total: 1, page: 1, page_size: 50 })
    mockedGetMovie.mockResolvedValue({ ...detail, qtd_avaliacoes: 0 })

    renderFeatured()

    expect(await screen.findByText('Sem avaliações')).toBeInTheDocument()
  })

  it('renders nothing when there are no qualifying candidates', async () => {
    mockedListMovies.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 50 })

    const { container } = renderFeatured()

    await waitFor(() => expect(container).toBeEmptyDOMElement())
    expect(mockedGetMovie).not.toHaveBeenCalled()
  })

  it('renders nothing when the candidates request fails', async () => {
    mockedListMovies.mockRejectedValue(new Error('network error'))

    const { container } = renderFeatured()

    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })
})
