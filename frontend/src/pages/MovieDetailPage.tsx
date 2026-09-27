import { CircleNotch, FilmSlate, Star } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { ApiError } from '../api/client'
import { deleteMovie, getMovie } from '../api/movies'
import ReviewForm from '../components/ReviewForm'
import ReviewList from '../components/ReviewList'
import { useToast } from '../components/Toast'
import { focusRingClass } from '../styles/interactive'
import { pressableClass } from '../styles/motion'
import type { MovieDetail, Person } from '../types/movie'
import { translateGenreName } from '../utils/genreLabels'
import { movieTitle } from '../utils/movieTitle'
import type { Review } from '../types/review'

const CAST_LIMIT = 10

function formatUsd(value: number | null): string | null {
  if (value === null) return null
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatVotes(count: number): string {
  return new Intl.NumberFormat('pt-BR').format(count)
}

function CreditsSection({ people }: { people: Person[] }) {
  const directors = people.filter((person) => person.tipo_pessoa === 'Diretor')
  const writers = people.filter((person) => person.tipo_pessoa === 'Roteirista')
  const cast = people.filter((person) => person.tipo_pessoa === 'Ator')
  const shownCast = cast.slice(0, CAST_LIMIT)
  const extraCast = cast.length - shownCast.length

  if (directors.length === 0 && writers.length === 0 && cast.length === 0) return null

  return (
    <div className="flex flex-col gap-1 text-sm text-ink-muted">
      {directors.length > 0 && <p>Direção: {directors.map((p) => p.nome_pessoa).join(', ')}</p>}
      {writers.length > 0 && <p>Roteiro: {writers.map((p) => p.nome_pessoa).join(', ')}</p>}
      {cast.length > 0 && (
        <p>
          Elenco: {shownCast.map((p) => p.nome_pessoa).join(', ')}
          {extraCast > 0 && ` e mais ${extraCast}`}
        </p>
      )}
    </div>
  )
}

function MetricsSection({ movie }: { movie: MovieDetail }) {
  const stats: { label: string; value: string }[] = []
  const performance = movie.performance

  if (movie.nota_media !== null) {
    stats.push({
      label: 'Nota dos usuários',
      value: `${movie.nota_media.toFixed(1)} (${movie.qtd_avaliacoes} avaliações)`,
    })
  }

  if (performance?.nota_tmdb !== null && performance?.nota_tmdb !== undefined) {
    const votes = performance.qtd_tmdb ? ` (${formatVotes(performance.qtd_tmdb)} votos)` : ''
    stats.push({ label: 'Nota TMDB', value: `${performance.nota_tmdb.toFixed(1)}${votes}` })
  }

  if (performance?.nota_imdb !== null && performance?.nota_imdb !== undefined) {
    const votes = performance.qtd_imdb ? ` (${formatVotes(performance.qtd_imdb)} votos)` : ''
    stats.push({ label: 'Nota IMDB', value: `${performance.nota_imdb.toFixed(1)}${votes}` })
  }

  const orcamento = performance ? formatUsd(performance.orcamento_usd) : null
  if (orcamento) stats.push({ label: 'Orçamento', value: orcamento })

  const receita = performance ? formatUsd(performance.receita_usd) : null
  if (receita) stats.push({ label: 'Receita', value: receita })

  if (performance && performance.orcamento_usd !== null && performance.receita_usd !== null) {
    stats.push({ label: 'Lucro', value: formatUsd(performance.lucro_usd) ?? '—' })
  }

  if (stats.length === 0) return null

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-ink">Bilheteria e avaliação externa</h2>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="text-xs font-medium uppercase text-ink-muted">{stat.label}</dt>
            <dd className="mt-1 text-sm text-ink tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function MovieDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="aspect-2/3 w-full max-w-56 animate-pulse rounded-md bg-surface-muted" />
      <div className="flex flex-1 flex-col gap-3">
        <div className="h-7 w-2/3 animate-pulse rounded bg-surface-muted" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-surface-muted" />
        <div className="h-20 w-full animate-pulse rounded bg-surface-muted" />
      </div>
    </div>
  )
}

function MovieDetailPage() {
  const { movieId } = useParams<{ movieId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [movie, setMovie] = useState<MovieDetail | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!movieId) return
    let cancelled = false

    getMovie(movieId)
      .then((result) => {
        if (!cancelled) setMovie(result)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          setError(err instanceof ApiError ? err.message : 'Erro ao carregar o filme.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [movieId])

  function handleReviewCreated(review: Review) {
    setMovie((current) => {
      if (!current) return current
      const reviews = [...current.reviews, review]
      const nota_media = reviews.reduce((sum, item) => sum + item.nota, 0) / reviews.length
      return { ...current, reviews, nota_media, qtd_avaliacoes: reviews.length }
    })
    showToast('Avaliação enviada com sucesso.')
  }

  async function handleDelete() {
    if (!movieId) return
    if (!window.confirm('Remover este filme? Essa ação não pode ser desfeita.')) return

    setDeleting(true)
    try {
      await deleteMovie(movieId)
      showToast('Filme removido com sucesso.')
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao remover o filme.')
      setDeleting(false)
    }
  }

  if (notFound) {
    return (
      <div>
        <p className="text-ink-muted">Filme não encontrado.</p>
        <Link
          to="/"
          className={`mt-2 inline-block rounded-md text-sm font-medium text-ink underline decoration-accent decoration-2 underline-offset-2 hover:decoration-accent-hover ${focusRingClass}`}
        >
          Voltar ao catálogo
        </Link>
      </div>
    )
  }

  if (error) {
    return <p className="text-destructive">{error}</p>
  }

  if (movie === null) {
    return <MovieDetailSkeleton />
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className={`rounded-md text-sm font-medium text-ink underline decoration-accent decoration-2 underline-offset-2 hover:decoration-accent-hover ${focusRingClass}`}
        >
          ← Voltar ao catálogo
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to={`/movies/${movie.sk_movie_id}/edit`}
            className={`rounded-md text-sm font-medium text-ink underline decoration-accent decoration-2 underline-offset-2 hover:decoration-accent-hover ${focusRingClass}`}
          >
            Editar filme
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={`inline-flex items-center gap-1.5 rounded-md text-sm text-destructive hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 ${pressableClass} ${focusRingClass}`}
          >
            {deleting && <CircleNotch size={14} weight="bold" className="animate-spin motion-reduce:animate-none" />}
            {deleting ? 'Removendo...' : 'Remover filme'}
          </button>
        </div>
      </div>

      <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
        <div>
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="aspect-2/3 w-full max-w-56 shrink-0 overflow-hidden rounded-md border border-border bg-surface-muted">
              {movie.url_poster ? (
                <img
                  src={movie.url_poster}
                  alt={movieTitle(movie.titulo)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-ink-muted/40">
                  <FilmSlate size={56} weight="light" />
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-3">
              <h1 className="text-2xl font-semibold text-ink">{movieTitle(movie.titulo)}</h1>

              <div className="flex flex-wrap items-center gap-3 text-sm text-ink-muted">
                <span>{movie.ano_lancamento ?? 'Ano desconhecido'}</span>
                {movie.duracao_minutos !== null && <span>{movie.duracao_minutos} min</span>}
                {movie.status_filme && <span>{movie.status_filme}</span>}
                <span className="flex items-center gap-1 text-ink tabular-nums">
                  <Star size={14} weight="fill" className="text-accent" />
                  {movie.nota_media !== null
                    ? `${movie.nota_media.toFixed(1)} (${movie.qtd_avaliacoes})`
                    : 'Sem avaliações'}
                </span>
              </div>

              {movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre.sk_genre_id}
                      className="rounded-full border border-border px-2.5 py-0.5 text-xs text-ink-muted"
                    >
                      {translateGenreName(genre.nome_genero)}
                    </span>
                  ))}
                </div>
              )}

              {movie.sinopse && <p className="text-sm text-ink">{movie.sinopse}</p>}

              <CreditsSection people={movie.people} />

              {movie.companies.length > 0 && (
                <p className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                  <span>Produtoras:</span>
                  {movie.companies.map((company) => (
                    <span
                      key={company.sk_company_id}
                      className="rounded-full border border-border px-2.5 py-0.5 text-xs"
                    >
                      {company.nome_produtora}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>

          <MetricsSection movie={movie} />
        </div>

        <section className="mt-10 flex flex-col gap-10 lg:mt-0">
          <div>
            <h2 className="text-lg font-semibold text-ink">Avaliações</h2>
            <div className="mt-4">
              <ReviewList reviews={movie.reviews} />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink">Avaliar este filme</h2>
            <div className="mt-4">
              <ReviewForm movieId={movie.sk_movie_id} onCreated={handleReviewCreated} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default MovieDetailPage
