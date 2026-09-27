import { CircleNotch, FilmSlate } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { focusRingClass } from '../styles/interactive'
import type { MovieListItem } from '../types/movie'
import { movieTitle } from '../utils/movieTitle'

interface MovieCardProps {
  movie: MovieListItem
  /** Posição real do filme na lista ordenada/filtrada atual — o número do quadro na prancha. */
  frameNumber: string
  /** Atraso (ms) da animação de entrada; omitido = sem animação (ex: troca de página). */
  entranceDelayMs?: number
}

// Corta o canto do quadro quando não há pôster — marca o "negativo em branco",
// em vez de um selo de texto sobre a moldura.
const clippedCornerStyle = { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 14px 100%, 0 calc(100% - 14px))' }

function MovieCard({ movie, frameNumber, entranceDelayMs }: MovieCardProps) {
  const [posterLoaded, setPosterLoaded] = useState(false)
  const [posterError, setPosterError] = useState(false)
  const entranceClass =
    entranceDelayMs !== undefined ? 'motion-safe:animate-fade-rise motion-reduce:animate-none' : ''
  const hasPoster = Boolean(movie.url_poster) && !posterError

  return (
    <Link
      to={`/movies/${movie.sk_movie_id}`}
      style={entranceDelayMs !== undefined ? { animationDelay: `${entranceDelayMs}ms` } : undefined}
      className={`group relative flex flex-col bg-surface hover:z-10 ${entranceClass} ${focusRingClass}`}
    >
      <div
        className="relative aspect-2/3 w-full overflow-hidden bg-surface-muted"
        style={hasPoster ? undefined : clippedCornerStyle}
      >
        {hasPoster ? (
          <>
            {!posterLoaded && (
              <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                <CircleNotch size={28} weight="bold" className="text-ink-muted/40 motion-safe:animate-spin-fast" />
              </div>
            )}
            <img
              src={movie.url_poster ?? undefined}
              alt={movieTitle(movie.titulo)}
              loading="lazy"
              onLoad={() => setPosterLoaded(true)}
              onError={() => setPosterError(true)}
              className={`h-full w-full object-cover transition-opacity duration-300 ${posterLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-muted/40">
            <FilmSlate size={40} weight="light" />
          </div>
        )}

        <span className="absolute top-1.5 left-1.5 bg-ink/70 px-1 py-0.5 text-[10px] leading-none font-medium tabular-nums text-white/90">
          {frameNumber}
        </span>

        {movie.qtd_avaliacoes > 0 && (
          <div className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-accent bg-ink/35 text-xs font-bold tabular-nums text-accent backdrop-blur-[1px]">
            {movie.nota_media?.toFixed(1)}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm leading-snug font-medium text-ink">{movieTitle(movie.titulo)}</h3>
        <div className="mt-auto flex items-center justify-between text-xs text-ink-muted">
          <span className="tabular-nums">{movie.ano_lancamento ?? '—'}</span>
          {movie.qtd_avaliacoes === 0 && <span>Sem avaliações</span>}
        </div>
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 ring-2 ring-inset ring-accent transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none"
      />
    </Link>
  )
}

export function MovieCardSkeleton() {
  return (
    <div className="flex flex-col bg-surface">
      <div className="flex aspect-2/3 w-full animate-pulse items-center justify-center bg-surface-muted">
        <CircleNotch
          size={28}
          weight="bold"
          className="text-ink-muted/40 motion-safe:animate-spin-fast"
          aria-hidden="true"
        />
      </div>
      <div className="space-y-2 p-3">
        <div className="h-3.5 w-4/5 animate-pulse rounded bg-surface-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-surface-muted" />
      </div>
    </div>
  )
}

export default MovieCard
