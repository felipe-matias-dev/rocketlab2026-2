import { useEffect, useState } from 'react'

import { getDashboard } from '../api/dashboard'
import { ApiError } from '../api/client'
import ChartCard, { ChartCardSkeleton } from '../components/dashboard/ChartCard'
import DecadeFinancialsChart from '../components/dashboard/DecadeFinancialsChart'
import GenreRatingChart from '../components/dashboard/GenreRatingChart'
import MoviesByYearChart from '../components/dashboard/MoviesByYearChart'
import RankingList from '../components/dashboard/RankingList'
import RatingHistogramChart from '../components/dashboard/RatingHistogramChart'
import StatTile, { StatTileSkeleton } from '../components/dashboard/StatTile'
import type { DashboardSummary } from '../types/dashboard'
import { formatUsdCompact } from '../utils/format'
import { movieTitle } from '../utils/movieTitle'

function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getDashboard()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Erro ao carregar o dashboard.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return <p className="text-destructive">{error}</p>
  }

  if (data === null) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <StatTileSkeleton key={index} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCardSkeleton title="Distribuição de notas" />
          <ChartCardSkeleton title="Nota média por gênero" />
        </div>
        <ChartCardSkeleton title="Filmes por ano de lançamento" />
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCardSkeleton title="Mais bem avaliados" />
          <ChartCardSkeleton title="Mais avaliados" />
        </div>
        <ChartCardSkeleton title="Financeiro (dados TMDB)" />
      </div>
    )
  }

  const { kpis } = data

  return (
    <div className="space-y-6 motion-safe:animate-fade-rise motion-reduce:animate-none">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Filmes no catálogo" value={kpis.total_movies.toLocaleString('pt-BR')} />
        <StatTile label="Avaliações" value={kpis.total_reviews.toLocaleString('pt-BR')} />
        <StatTile
          label="Nota média geral"
          value={kpis.avg_rating !== null ? kpis.avg_rating.toFixed(1) : '—'}
        />
        <StatTile
          label="Filme mais avaliado"
          value={kpis.most_reviewed_movie_qtd.toLocaleString('pt-BR')}
          sublabel={kpis.most_reviewed_movie_titulo ?? undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Distribuição de notas">
          <RatingHistogramChart data={data.rating_distribution} />
        </ChartCard>
        <ChartCard title="Nota média por gênero">
          <GenreRatingChart data={data.avg_rating_by_genre} />
        </ChartCard>
      </div>

      <ChartCard title="Filmes por ano de lançamento">
        <MoviesByYearChart data={data.movies_by_year} />
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Mais bem avaliados">
          <RankingList
            emptyMessage="Sem filmes suficientes com avaliações."
            items={data.top_rated_movies.map((movie) => ({
              key: movie.sk_movie_id,
              href: `/movies/${movie.sk_movie_id}`,
              title: movieTitle(movie.titulo),
              value: movie.nota_media !== null ? movie.nota_media.toFixed(1) : '—',
              subvalue: `${movie.qtd_avaliacoes} aval.`,
            }))}
          />
        </ChartCard>
        <ChartCard title="Mais avaliados">
          <RankingList
            emptyMessage="Nenhuma avaliação registrada."
            items={data.most_reviewed_movies.map((movie) => ({
              key: movie.sk_movie_id,
              href: `/movies/${movie.sk_movie_id}`,
              title: movieTitle(movie.titulo),
              value: `${movie.qtd_avaliacoes}`,
              subvalue: movie.nota_media !== null ? `nota ${movie.nota_media.toFixed(1)}` : undefined,
            }))}
          />
        </ChartCard>
      </div>

      <ChartCard title="Financeiro (dados TMDB)">
        <div className="grid gap-6 lg:grid-cols-2">
          <DecadeFinancialsChart data={data.financials_by_decade} />
          <RankingList
            emptyMessage="Sem dados financeiros."
            items={data.top_movies_by_revenue.map((movie) => ({
              key: movie.sk_movie_id,
              href: `/movies/${movie.sk_movie_id}`,
              title: movieTitle(movie.titulo),
              value: movie.receita_usd !== null ? formatUsdCompact(movie.receita_usd) : '—',
            }))}
          />
        </div>
      </ChartCard>
    </div>
  )
}

export default DashboardPage
