import { FilmSlate, Star } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

import type { MovieListItem } from '../types/movie'

interface MovieCardProps {
  movie: MovieListItem
}

function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link
      to={`/movies/${movie.sk_movie_id}`}
      className="group flex flex-col overflow-hidden rounded-md border border-border bg-surface transition-colors hover:border-accent"
    >
      <div className="aspect-2/3 w-full bg-zinc-100">
        {movie.url_poster ? (
          <img
            src={movie.url_poster}
            alt={movie.titulo}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-300">
            <FilmSlate size={40} weight="light" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <h3 className="line-clamp-2 text-sm leading-snug font-medium text-ink">{movie.titulo}</h3>
        <div className="mt-auto flex items-center justify-between text-xs">
          <span className="font-medium text-ink">{movie.ano_lancamento ?? '—'}</span>
          {movie.qtd_avaliacoes > 0 ? (
            <span className="flex items-center gap-1 font-medium text-accent">
              <Star size={14} weight="fill" />
              {movie.nota_media?.toFixed(1)}
            </span>
          ) : (
            <span className="text-ink-muted">Sem avaliações</span>
          )}
        </div>
      </div>
    </Link>
  )
}

export function MovieCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      <div className="aspect-2/3 w-full animate-pulse bg-zinc-100" />
      <div className="space-y-2 p-3.5">
        <div className="h-3.5 w-4/5 animate-pulse rounded bg-zinc-100" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100" />
      </div>
    </div>
  )
}

export default MovieCard
