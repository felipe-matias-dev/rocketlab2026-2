import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../api/client'
import { getDashboard } from '../api/dashboard'
import type { DashboardSummary } from '../types/dashboard'
import DashboardPage from './DashboardPage'

vi.mock('../api/dashboard', () => ({
  getDashboard: vi.fn(),
}))

// The charts' own mapping/sorting logic is covered by their own test files (they need `recharts`
// itself mocked to render at all under jsdom — see MoviesByYearChart.test.tsx). Here we only care
// that this page hands each chart the right slice of the dashboard payload.
vi.mock('../components/dashboard/MoviesByYearChart', () => ({
  default: ({ data }: { data: unknown }) => <div data-testid="movies-by-year">{JSON.stringify(data)}</div>,
}))
vi.mock('../components/dashboard/GenreRatingChart', () => ({
  default: ({ data }: { data: unknown }) => <div data-testid="genre-rating">{JSON.stringify(data)}</div>,
}))
vi.mock('../components/dashboard/DecadeFinancialsChart', () => ({
  default: ({ data }: { data: unknown }) => <div data-testid="decade-financials">{JSON.stringify(data)}</div>,
}))
vi.mock('../components/dashboard/RatingHistogramChart', () => ({
  default: ({ data }: { data: unknown }) => <div data-testid="rating-histogram">{JSON.stringify(data)}</div>,
}))

const mockedGetDashboard = vi.mocked(getDashboard)

function summary(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return {
    kpis: {
      total_movies: 95645,
      total_reviews: 43666,
      avg_rating: 7.2,
      most_reviewed_movie_titulo: 'Duna',
      most_reviewed_movie_qtd: 12,
    },
    rating_distribution: [{ faixa_inicio: 7, qtd: 100 }],
    avg_rating_by_genre: [{ sk_genre_id: 'g1', nome_genero: 'Drama', nota_media: 7.5, qtd_avaliacoes: 40 }],
    movies_by_year: [{ ano: 2021, qtd: 50 }],
    top_rated_movies: [],
    most_reviewed_movies: [],
    top_movies_by_revenue: [],
    financials_by_decade: [{ decada: 2020, orcamento_medio_usd: 1_000_000, receita_media_usd: 2_000_000 }],
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('DashboardPage', () => {
  it('shows chart skeletons before the data loads, without the real KPI tiles yet', () => {
    mockedGetDashboard.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByRole('heading', { name: 'Distribuição de notas' })).toBeInTheDocument()
    expect(screen.queryByText('Filmes no catálogo')).not.toBeInTheDocument()
  })

  it('shows the API error message when the request fails', async () => {
    mockedGetDashboard.mockRejectedValue(new ApiError(500, 'Erro no servidor'))

    renderPage()

    expect(await screen.findByText('Erro no servidor')).toBeInTheDocument()
  })

  it('falls back to a generic error message for a non-API failure', async () => {
    mockedGetDashboard.mockRejectedValue(new Error('boom'))

    renderPage()

    expect(await screen.findByText('Erro ao carregar o dashboard.')).toBeInTheDocument()
  })

  it('renders the KPI tiles with pt-BR formatted numbers', async () => {
    mockedGetDashboard.mockResolvedValue(summary())

    renderPage()

    expect(await screen.findByText('95.645')).toBeInTheDocument()
    expect(screen.getByText('43.666')).toBeInTheDocument()
    expect(screen.getByText('7.2')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Duna')).toBeInTheDocument()
  })

  it('shows a dash for the average rating when there are no reviews yet', async () => {
    mockedGetDashboard.mockResolvedValue(summary({ kpis: { ...summary().kpis, avg_rating: null } }))

    renderPage()

    await screen.findByText('Filmes no catálogo')
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('omits the most-reviewed sublabel when there is no title yet', async () => {
    mockedGetDashboard.mockResolvedValue(
      summary({ kpis: { ...summary().kpis, most_reviewed_movie_titulo: null } }),
    )

    renderPage()

    expect(await screen.findByText('Filme mais avaliado')).toBeInTheDocument()
    expect(screen.queryByText('Duna')).not.toBeInTheDocument()
  })

  it('passes each dataset to its own chart', async () => {
    mockedGetDashboard.mockResolvedValue(summary())

    renderPage()
    await screen.findByText('Filmes no catálogo')

    expect(screen.getByTestId('rating-histogram')).toHaveTextContent(JSON.stringify(summary().rating_distribution))
    expect(screen.getByTestId('genre-rating')).toHaveTextContent(JSON.stringify(summary().avg_rating_by_genre))
    expect(screen.getByTestId('movies-by-year')).toHaveTextContent(JSON.stringify(summary().movies_by_year))
    expect(screen.getByTestId('decade-financials')).toHaveTextContent(
      JSON.stringify(summary().financials_by_decade),
    )
  })

  describe('top rated movies ranking', () => {
    it('shows the rating and review count, falling back to a dash without a rating', async () => {
      mockedGetDashboard.mockResolvedValue(
        summary({
          top_rated_movies: [
            { sk_movie_id: 'm1', titulo: 'Filme Top', nota_media: 8.4, qtd_avaliacoes: 12 },
            { sk_movie_id: 'm2', titulo: 'Sem Nota', nota_media: null, qtd_avaliacoes: 0 },
          ],
        }),
      )

      renderPage()

      expect(await screen.findByText('Filme Top')).toBeInTheDocument()
      expect(screen.getByText('8.4')).toBeInTheDocument()
      expect(screen.getByText('12 aval.')).toBeInTheDocument()
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('shows the empty-state message when there are no qualifying movies', async () => {
      mockedGetDashboard.mockResolvedValue(summary({ top_rated_movies: [] }))

      renderPage()

      expect(await screen.findByText('Sem filmes suficientes com avaliações.')).toBeInTheDocument()
    })
  })

  describe('most reviewed movies ranking', () => {
    it('shows the review count and rating, omitting the rating line when unrated', async () => {
      mockedGetDashboard.mockResolvedValue(
        summary({
          most_reviewed_movies: [
            { sk_movie_id: 'm3', titulo: 'Popular', nota_media: 7, qtd_avaliacoes: 50 },
            { sk_movie_id: 'm4', titulo: 'Sem Nota Ainda', nota_media: null, qtd_avaliacoes: 5 },
          ],
        }),
      )

      renderPage()

      expect(await screen.findByText('Popular')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
      expect(screen.getByText('nota 7.0')).toBeInTheDocument()
      expect(screen.getByText('Sem Nota Ainda')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })

  describe('revenue ranking', () => {
    it('formats known revenue compactly and falls back to a dash otherwise', async () => {
      mockedGetDashboard.mockResolvedValue(
        summary({
          top_movies_by_revenue: [
            { sk_movie_id: 'm5', titulo: 'Blockbuster', receita_usd: 500_000_000, orcamento_usd: null },
            { sk_movie_id: 'm6', titulo: 'Sem Receita', receita_usd: null, orcamento_usd: null },
          ],
        }),
      )

      renderPage()

      expect(await screen.findByText('Blockbuster')).toBeInTheDocument()
      expect(screen.getByText('US$ 500.0mi')).toBeInTheDocument()
      expect(screen.getByText('Sem Receita')).toBeInTheDocument()
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })
})
