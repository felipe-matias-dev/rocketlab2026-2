import { CircleNotch, FilmSlate } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getMovie, listMovies } from '../api/movies'
import { focusRingClass } from '../styles/interactive'
import { translateGenreName } from '../utils/genreLabels'
import type { MovieDetail } from '../types/movie'

const MIN_RATING = 8
const CANDIDATES_PAGE_SIZE = 50

// Mesmo corte de canto do MovieCard, pro quadro puxado usar a mesma gramática visual
// quando não há pôster.
const clippedCornerStyle = { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 14px 100%, 0 calc(100% - 14px))' }

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null
  return items[Math.floor(Math.random() * items.length)]
}

/**
 * No dataset real, praticamente todo filme com nota alta tem só 1 avaliação (verificado
 * direto no banco: os filmes mais avaliados do catálogo, com até 13 avaliações, têm nota
 * média na faixa 4-6.5 — não existe filme "bem avaliado e muito avaliado" aqui). Não dá pra
 * evitar esse viés escolhendo por qtd_avaliacoes; em vez disso, sorteamos entre os filmes com
 * nota alta pra pelo menos variar o destaque a cada carregamento.
 *
 * O sorteio é feito com uma única página (CANDIDATES_PAGE_SIZE itens), não entre todo o pool
 * de filmes qualificados — uma versão anterior buscava o total e sorteava uma página aleatória
 * do catálogo inteiro, mas isso dobrava as chamadas de listagem (~1,2s a mais) e deixava o
 * destaque nitidamente mais lento que os cards do grid, que carregam com uma única chamada.
 */
function FeaturedMovie() {
  const [movie, setMovie] = useState<MovieDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadFeatured() {
      try {
        const { items } = await listMovies({
          sort: 'rating',
          order: 'desc',
          rating_min: MIN_RATING,
          page_size: CANDIDATES_PAGE_SIZE,
        })

        const candidate = pickRandom(items)
        if (!candidate) return

        const detail = await getMovie(candidate.sk_movie_id)
        if (!cancelled) setMovie(detail)
      } catch {
        // Seção de destaque é um bônus visual, não crítico: em caso de falha, simplesmente
        // não renderiza, sem duplicar o tratamento de erro do catálogo principal.
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadFeatured()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <FeaturedMovieSkeleton />
  if (!movie) return null

  const hasPoster = Boolean(movie.url_poster) && !imageError

  return (
    <div className="mb-8">
      <Link
        to={`/movies/${movie.sk_movie_id}`}
        className={`group relative flex w-full max-w-md -rotate-1 gap-3 border border-border bg-surface p-3 ring-2 ring-accent transition-transform duration-200 hover:rotate-0 motion-reduce:transition-none ${focusRingClass}`}
      >
        <div
          className="relative h-36 w-24 shrink-0 overflow-hidden bg-surface-muted"
          style={hasPoster ? undefined : clippedCornerStyle}
        >
          {hasPoster ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <CircleNotch size={20} weight="bold" className="text-ink-muted/40 motion-safe:animate-spin-fast" />
                </div>
              )}
              <img
                src={movie.url_poster ?? undefined}
                alt=""
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                className={`h-full w-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-muted/40">
              <FilmSlate size={24} weight="light" />
            </div>
          )}

          {movie.nota_media !== null && (
            <div className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-accent bg-ink/35 text-[11px] font-bold tabular-nums text-accent backdrop-blur-[1px]">
              {movie.nota_media.toFixed(1)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 py-0.5">
          <h2 className="line-clamp-2 text-base leading-snug font-semibold text-ink">{movie.titulo}</h2>
          <p className="mt-1 text-xs text-ink-muted">
            {movie.ano_lancamento ?? 'Ano desconhecido'}
            {movie.genres.length > 0 &&
              ` · ${movie.genres.map((genre) => translateGenreName(genre.nome_genero)).join(', ')}`}
          </p>
          {movie.qtd_avaliacoes > 0 ? (
            <p className="mt-1 text-xs text-ink-muted">
              {movie.qtd_avaliacoes} {movie.qtd_avaliacoes === 1 ? 'avaliação' : 'avaliações'}
            </p>
          ) : (
            <p className="mt-1 text-xs text-ink-muted">Sem avaliações</p>
          )}
          {movie.sinopse && <p className="mt-2 line-clamp-2 text-xs text-ink-muted">{movie.sinopse}</p>}
        </div>
      </Link>
      <p className="mt-2 ml-1 text-xs text-ink-muted">Em destaque · sorteado entre os mais bem avaliados</p>
    </div>
  )
}

function FeaturedMovieSkeleton() {
  return (
    <div className="mb-8">
      <div className="flex w-full max-w-md -rotate-1 gap-3 border border-border bg-surface p-3 ring-2 ring-accent/50">
        <div className="flex h-36 w-24 shrink-0 animate-pulse items-center justify-center bg-surface-muted">
          <CircleNotch size={20} weight="bold" className="text-ink-muted/40 motion-safe:animate-spin-fast" aria-hidden="true" />
        </div>
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 w-4/5 animate-pulse rounded bg-surface-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-surface-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-surface-muted" />
        </div>
      </div>
    </div>
  )
}

export default FeaturedMovie
