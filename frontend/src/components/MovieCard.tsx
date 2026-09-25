import { FilmSlate, Star } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

import { focusRingClass } from '../styles/interactive'
import type { MovieListItem } from '../types/movie'

interface MovieCardProps {
  movie: MovieListItem
  /** Atraso (ms) da animação de entrada; omitido = sem animação (ex: troca de página). */
  entranceDelayMs?: number
}

const cardElevationClass =
  'shadow-[0_1px_2px_rgba(28,25,23,0.04),0_6px_16px_-4px_rgba(28,25,23,0.10)] ' +
  'ring-1 ring-black/5 transition-[box-shadow,transform] duration-200 ' +
  'hover:-translate-y-1 hover:shadow-[0_4px_8px_rgba(28,25,23,0.06),0_20px_32px_-8px_rgba(28,25,23,0.18)] hover:ring-accent/40'

function MovieCard({ movie, entranceDelayMs }: MovieCardProps) {
  const entranceClass =
    entranceDelayMs !== undefined ? 'motion-safe:animate-fade-rise motion-reduce:animate-none' : ''

  return (
    <Link
      to={`/movies/${movie.sk_movie_id}`}
      style={entranceDelayMs !== undefined ? { animationDelay: `${entranceDelayMs}ms` } : undefined}
      className={`group flex flex-col overflow-hidden rounded-md bg-surface ${cardElevationClass} ${entranceClass} ${focusRingClass}`}
    >
      <div className="relative aspect-2/3 w-full overflow-hidden bg-surface-muted">
        {movie.url_poster ? (
          <img
            src={movie.url_poster}
            alt={movie.titulo}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-muted/40">
            <FilmSlate size={40} weight="light" />
          </div>
        )}
        {movie.qtd_avaliacoes > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-ink/75 px-2 py-0.5 text-xs font-semibold tabular-nums text-white backdrop-blur-sm">
            <Star size={12} weight="fill" className="text-accent" />
            {movie.nota_media?.toFixed(1)}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <h3 className="line-clamp-2 text-sm leading-snug font-medium text-ink">{movie.titulo}</h3>
        <div className="mt-auto flex items-center justify-between text-xs text-ink-muted">
          <span className="tabular-nums">{movie.ano_lancamento ?? '—'}</span>
          {movie.qtd_avaliacoes === 0 && <span>Sem avaliações</span>}
        </div>
      </div>
    </Link>
  )
}

export function MovieCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-md bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.04),0_6px_16px_-4px_rgba(28,25,23,0.10)] ring-1 ring-black/5">
      <div className="aspect-2/3 w-full animate-pulse bg-surface-muted" />
      <div className="space-y-2 p-3.5">
        <div className="h-3.5 w-4/5 animate-pulse rounded bg-surface-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-surface-muted" />
      </div>
    </div>
  )
}

export default MovieCard
