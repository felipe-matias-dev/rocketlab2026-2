import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../api/client'
import { deleteMovie, getMovie } from '../api/movies'
import { ToastProvider } from '../components/Toast'
import type { MovieDetail, Person } from '../types/movie'
import type { Review } from '../types/review'
import MovieDetailPage from './MovieDetailPage'

vi.mock('../api/movies', () => ({
  getMovie: vi.fn(),
  deleteMovie: vi.fn(),
}))

// ReviewForm's own behavior (validation, submission) is covered by ReviewForm.test.tsx; here we
// only need to trigger its onCreated callback to check how this page reacts to a new review.
vi.mock('../components/ReviewForm', () => ({
  default: ({ onCreated }: { movieId: string; onCreated: (review: Review) => void }) => (
    <button
      onClick={() =>
        onCreated({
          sk_movie_review_id: 'r-new',
          nome: 'Bruno',
          nota: 10,
          comentario: 'Excelente',
          created_at: '2026-01-01T00:00:00Z',
        })
      }
    >
      Fake add review
    </button>
  ),
}))

// ReviewList's own behavior (confirmation, the delete call, per-item pending/error state) is
// covered by ReviewList.test.tsx; here we only need to trigger its onDeleted callback to check
// how this page reacts to a removed review.
vi.mock('../components/ReviewList', () => ({
  default: ({ reviews, onDeleted }: { reviews: Review[]; onDeleted: (review: Review) => void }) => (
    <button onClick={() => onDeleted(reviews[0])}>Fake delete review</button>
  ),
}))

const mockedGetMovie = vi.mocked(getMovie)
const mockedDeleteMovie = vi.mocked(deleteMovie)

function person(overrides: Partial<Person> = {}): Person {
  return { sk_person_id: 'p1', nome_pessoa: 'Alguém', tipo_pessoa: 'Ator', ...overrides }
}

function baseMovie(overrides: Partial<MovieDetail> = {}): MovieDetail {
  return {
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
    nota_media: null,
    qtd_avaliacoes: 0,
    performance: null,
    ...overrides,
  }
}

function renderPage(movieId = 'm1') {
  const router = createMemoryRouter(
    [
      { path: '/movies/:movieId', element: <MovieDetailPage /> },
      { path: '/', element: <p>Página do catálogo</p> },
    ],
    { initialEntries: [`/movies/${movieId}`] },
  )
  return render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('MovieDetailPage', () => {
  it('shows nothing conclusive while the movie is loading', () => {
    mockedGetMovie.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.queryByRole('heading', { name: 'Duna' })).not.toBeInTheDocument()
    expect(screen.queryByText('Filme não encontrado.')).not.toBeInTheDocument()
  })

  it('shows a not-found message with a link back for a 404', async () => {
    mockedGetMovie.mockRejectedValue(new ApiError(404, 'Filme não encontrado'))

    renderPage()

    expect(await screen.findByText('Filme não encontrado.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar ao catálogo' })).toHaveAttribute('href', '/')
  })

  it('shows the API error message for a non-404 failure', async () => {
    mockedGetMovie.mockRejectedValue(new ApiError(500, 'Erro interno'))

    renderPage()

    expect(await screen.findByText('Erro interno')).toBeInTheDocument()
  })

  it('falls back to a generic error message for a non-API failure', async () => {
    mockedGetMovie.mockRejectedValue(new Error('boom'))

    renderPage()

    expect(await screen.findByText('Erro ao carregar o filme.')).toBeInTheDocument()
  })

  it('renders the movie title, year, duration and status', async () => {
    mockedGetMovie.mockResolvedValue(baseMovie())

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Duna' })).toBeInTheDocument()
    expect(screen.getByText('2021')).toBeInTheDocument()
    expect(screen.getByText('155 min')).toBeInTheDocument()
    expect(screen.getByText('Lançado')).toBeInTheDocument()
  })

  it('shows "Sem avaliações" when there is no rating yet', async () => {
    mockedGetMovie.mockResolvedValue(baseMovie({ nota_media: null }))

    renderPage()

    expect(await screen.findByText('Sem avaliações')).toBeInTheDocument()
  })

  it('shows the average rating and review count when present', async () => {
    mockedGetMovie.mockResolvedValue(baseMovie({ nota_media: 8.4, qtd_avaliacoes: 3 }))

    renderPage()

    expect(await screen.findByText('8.4 (3)')).toBeInTheDocument()
  })

  it('renders genres translated to Portuguese', async () => {
    mockedGetMovie.mockResolvedValue(baseMovie())

    renderPage()

    expect(await screen.findByText('Ficção Científica')).toBeInTheDocument()
  })

  it('renders the synopsis when present', async () => {
    mockedGetMovie.mockResolvedValue(baseMovie())

    renderPage()

    expect(await screen.findByText(/jovem herdeiro/)).toBeInTheDocument()
  })

  it('renders production companies, and omits the row when there are none', async () => {
    mockedGetMovie.mockResolvedValue(
      baseMovie({ companies: [{ sk_company_id: 'c1', nome_produtora: 'Legendary' }] }),
    )

    renderPage()

    expect(await screen.findByText('Legendary')).toBeInTheDocument()
    expect(screen.queryByText('Produtoras:')).toBeInTheDocument()
  })

  it('omits the "Produtoras" row entirely when there are no companies', async () => {
    mockedGetMovie.mockResolvedValue(baseMovie({ companies: [] }))

    renderPage()
    await screen.findByRole('heading', { name: 'Duna' })

    expect(screen.queryByText('Produtoras:')).not.toBeInTheDocument()
  })

  describe('credits', () => {
    it('lists directors and writers by name', async () => {
      mockedGetMovie.mockResolvedValue(
        baseMovie({
          people: [
            person({ sk_person_id: 'p1', nome_pessoa: 'Denis Villeneuve', tipo_pessoa: 'Diretor' }),
            person({ sk_person_id: 'p2', nome_pessoa: 'Jon Spaihts', tipo_pessoa: 'Roteirista' }),
          ],
        }),
      )

      renderPage()

      expect(await screen.findByText('Direção: Denis Villeneuve')).toBeInTheDocument()
      expect(screen.getByText('Roteiro: Jon Spaihts')).toBeInTheDocument()
    })

    it('caps the cast list and shows how many more there are', async () => {
      const cast = Array.from({ length: 12 }, (_, index) =>
        person({ sk_person_id: `actor-${index}`, nome_pessoa: `Ator ${index}`, tipo_pessoa: 'Ator' }),
      )
      mockedGetMovie.mockResolvedValue(baseMovie({ people: cast }))

      renderPage()

      expect(await screen.findByText(/e mais 2$/)).toBeInTheDocument()
    })

    it('renders no credits section when the movie has no listed people', async () => {
      mockedGetMovie.mockResolvedValue(baseMovie({ people: [] }))

      renderPage()
      await screen.findByRole('heading', { name: 'Duna' })

      expect(screen.queryByText(/Direção:/)).not.toBeInTheDocument()
    })
  })

  describe('external metrics', () => {
    it('shows TMDB and IMDB ratings with their vote counts', async () => {
      mockedGetMovie.mockResolvedValue(
        baseMovie({
          performance: {
            orcamento_usd: null,
            receita_usd: null,
            lucro_usd: 0,
            popularidade: null,
            nota_tmdb: 7.8,
            qtd_tmdb: 15234,
            nota_imdb: 8.1,
            qtd_imdb: 987654,
          },
        }),
      )

      renderPage()

      expect(await screen.findByText('7.8 (15.234 votos)')).toBeInTheDocument()
      expect(screen.getByText('8.1 (987.654 votos)')).toBeInTheDocument()
    })

    it('shows the profit only when both budget and revenue are known', async () => {
      mockedGetMovie.mockResolvedValue(
        baseMovie({
          performance: {
            orcamento_usd: 165_000_000,
            receita_usd: 400_000_000,
            lucro_usd: 235_000_000,
            popularidade: null,
            nota_tmdb: null,
            qtd_tmdb: null,
            nota_imdb: null,
            qtd_imdb: null,
          },
        }),
      )

      renderPage()

      expect(await screen.findByText('Lucro')).toBeInTheDocument()
      expect(screen.getByText('$235,000,000')).toBeInTheDocument()
    })

    it('renders no external-metrics section without a rating or performance data', async () => {
      mockedGetMovie.mockResolvedValue(baseMovie({ nota_media: null, performance: null }))

      renderPage()
      await screen.findByRole('heading', { name: 'Duna' })

      expect(screen.queryByText('Bilheteria e avaliação externa')).not.toBeInTheDocument()
    })
  })

  describe('adding a review', () => {
    it('recomputes the average rating and shows a success toast', async () => {
      mockedGetMovie.mockResolvedValue(
        baseMovie({
          reviews: [
            { sk_movie_review_id: 'r1', nome: 'Ana', nota: 6, comentario: 'Ok', created_at: '2026-01-01T00:00:00Z' },
          ],
          nota_media: 6,
          qtd_avaliacoes: 1,
        }),
      )

      renderPage()
      await screen.findByRole('heading', { name: 'Duna' })

      fireEvent.click(screen.getByRole('button', { name: 'Fake add review' }))

      expect(await screen.findByText('Avaliação enviada com sucesso.')).toBeInTheDocument()
      expect(screen.getByText('8.0 (2)')).toBeInTheDocument()
    })
  })

  describe('deleting a review', () => {
    it('recomputes the average rating and shows a success toast', async () => {
      mockedGetMovie.mockResolvedValue(
        baseMovie({
          reviews: [
            { sk_movie_review_id: 'r1', nome: 'Ana', nota: 6, comentario: 'Ok', created_at: '2026-01-01T00:00:00Z' },
            { sk_movie_review_id: 'r2', nome: 'Bruno', nota: 10, comentario: 'Ótimo', created_at: '2026-01-02T00:00:00Z' },
          ],
          nota_media: 8,
          qtd_avaliacoes: 2,
        }),
      )

      renderPage()
      await screen.findByRole('heading', { name: 'Duna' })
      expect(screen.getByText('8.0 (2)')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Fake delete review' }))

      expect(await screen.findByText('Avaliação removida com sucesso.')).toBeInTheDocument()
      expect(screen.getByText('10.0 (1)')).toBeInTheDocument()
    })

    it('clears the average when the last review is removed', async () => {
      mockedGetMovie.mockResolvedValue(
        baseMovie({
          reviews: [
            { sk_movie_review_id: 'r1', nome: 'Ana', nota: 6, comentario: 'Ok', created_at: '2026-01-01T00:00:00Z' },
          ],
          nota_media: 6,
          qtd_avaliacoes: 1,
        }),
      )

      renderPage()
      await screen.findByRole('heading', { name: 'Duna' })

      fireEvent.click(screen.getByRole('button', { name: 'Fake delete review' }))

      expect(await screen.findByText('Avaliação removida com sucesso.')).toBeInTheDocument()
      expect(screen.getByText('Sem avaliações')).toBeInTheDocument()
    })
  })

  describe('deleting the movie', () => {
    it('does not delete when the confirmation is dismissed', async () => {
      mockedGetMovie.mockResolvedValue(baseMovie())
      vi.spyOn(window, 'confirm').mockReturnValue(false)

      renderPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Remover filme' }))

      expect(mockedDeleteMovie).not.toHaveBeenCalled()
    })

    it('shows a pending state and disables the button while deleting', async () => {
      mockedGetMovie.mockResolvedValue(baseMovie())
      mockedDeleteMovie.mockReturnValue(new Promise(() => {}))
      vi.spyOn(window, 'confirm').mockReturnValue(true)

      renderPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Remover filme' }))

      const button = await screen.findByRole('button', { name: 'Removendo...' })
      expect(button).toBeDisabled()
    })

    it('shows a success toast and navigates to the catalog on success', async () => {
      mockedGetMovie.mockResolvedValue(baseMovie())
      mockedDeleteMovie.mockResolvedValue(undefined)
      vi.spyOn(window, 'confirm').mockReturnValue(true)

      renderPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Remover filme' }))

      expect(await screen.findByText('Filme removido com sucesso.')).toBeInTheDocument()
      expect(await screen.findByText('Página do catálogo')).toBeInTheDocument()
      expect(mockedDeleteMovie).toHaveBeenCalledWith('m1')
    })

    // The page's top-level `if (error)` branch replaces the whole view with just the error
    // paragraph, so the movie (and its delete button) disappears along with it. `setDeleting`
    // is reset to false in the same catch block, but there is no button left for that to matter
    // to — that reset is only observable if the caller retries after clearing `error` some other
    // way, which this page has no UI for. We only assert what's actually visible: the message.
    it('shows the API error message on a failed delete', async () => {
      mockedGetMovie.mockResolvedValue(baseMovie())
      mockedDeleteMovie.mockRejectedValue(new ApiError(500, 'Erro ao remover'))
      vi.spyOn(window, 'confirm').mockReturnValue(true)

      renderPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Remover filme' }))

      expect(await screen.findByText('Erro ao remover')).toBeInTheDocument()
    })
  })
})
