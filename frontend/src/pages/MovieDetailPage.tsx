import { FilmSlate, Star } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { ApiError } from '../api/client'
import { deleteMovie, getMovie } from '../api/movies'
import ReviewForm from '../components/ReviewForm'
import ReviewList from '../components/ReviewList'
import { focusRingClass } from '../styles/interactive'
import type { MovieDetail } from '../types/movie'
import { translateGenreName } from '../utils/genreLabels'
import type { Review } from '../types/review'

function MovieDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="aspect-2/3 w-full max-w-56 animate-pulse rounded-md bg-zinc-100" />
      <div className="flex flex-1 flex-col gap-3">
        <div className="h-7 w-2/3 animate-pulse rounded bg-zinc-100" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-100" />
        <div className="h-20 w-full animate-pulse rounded bg-zinc-100" />
      </div>
    </div>
  )
}

function MovieDetailPage() {
  const { movieId } = useParams<{ movieId: string }>()
  const navigate = useNavigate()
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
  }

  async function handleDelete() {
    if (!movieId) return
    if (!window.confirm('Remover este filme? Essa ação não pode ser desfeita.')) return

    setDeleting(true)
    try {
      await deleteMovie(movieId)
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
            className={`rounded-md text-sm text-destructive hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 ${focusRingClass}`}
          >
            {deleting ? 'Removendo...' : 'Remover filme'}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-6 sm:flex-row">
        <div className="aspect-2/3 w-full max-w-56 shrink-0 overflow-hidden rounded-md border border-border bg-zinc-100">
          {movie.url_poster ? (
            <img
              src={movie.url_poster}
              alt={movie.titulo}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-300">
              <FilmSlate size={56} weight="light" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <h1 className="text-2xl font-semibold text-ink">{movie.titulo}</h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-ink-muted">
            <span>{movie.ano_lancamento ?? 'Ano desconhecido'}</span>
            {movie.duracao_minutos !== null && <span>{movie.duracao_minutos} min</span>}
            {movie.status_filme && <span>{movie.status_filme}</span>}
            <span className="flex items-center gap-1 text-ink">
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

          {movie.people.length > 0 && (
            <p className="text-sm text-ink-muted">
              {movie.people
                .filter((person) => person.tipo_pessoa === 'Diretor')
                .map((person) => `Direção: ${person.nome_pessoa}`)
                .join(', ')}
            </p>
          )}
        </div>
      </div>

      <section className="mt-10 grid gap-10 md:grid-cols-2">
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
  )
}

export default MovieDetailPage
