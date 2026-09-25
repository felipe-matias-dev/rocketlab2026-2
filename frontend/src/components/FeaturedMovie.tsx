import { CircleNotch, FilmSlate, Star } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getMovie, listMovies } from '../api/movies'
import { focusRingClass } from '../styles/interactive'
import { pressableClass } from '../styles/motion'
import { translateGenreName } from '../utils/genreLabels'
import type { MovieDetail } from '../types/movie'

const MIN_RATING = 8
const CANDIDATES_PAGE_SIZE = 50

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

  const image = movie.url_backdrop ?? movie.url_poster

  return (
    <div className="mb-6 overflow-hidden rounded-md bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_20px_-6px_rgba(28,25,23,0.08)] ring-1 ring-black/5">
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-surface-muted sm:aspect-auto sm:w-72">
          {image && !imageError ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <CircleNotch size={28} weight="bold" className="text-ink-muted/40 motion-safe:animate-spin-fast" />
                </div>
              )}
              <img
                src={image}
                alt={movie.titulo}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                className={`h-full w-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-muted/40">
              <FilmSlate size={40} weight="light" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-6">
          <span className="text-xs font-medium text-accent">Filme em destaque</span>

          <h2 className="text-2xl font-semibold text-ink">{movie.titulo}</h2>

          <div className="flex flex-wrap items-center gap-3 text-sm text-ink-muted">
            <span>{movie.ano_lancamento ?? 'Ano desconhecido'}</span>
            {movie.genres.length > 0 && (
              <span>{movie.genres.map((genre) => translateGenreName(genre.nome_genero)).join(', ')}</span>
            )}
          </div>

          {movie.nota_media !== null && (
            <div className="flex items-center gap-1.5 text-sm">
              <Star size={16} weight="fill" className="text-accent" />
              <span className="text-lg font-semibold tabular-nums text-accent">
                {movie.nota_media.toFixed(1)} / 10
              </span>
              <span className="text-ink-muted">
                · {movie.qtd_avaliacoes} {movie.qtd_avaliacoes === 1 ? 'avaliação' : 'avaliações'}
              </span>
            </div>
          )}

          {movie.sinopse && <p className="line-clamp-3 text-sm text-ink-muted">{movie.sinopse}</p>}

          <Link
            to={`/movies/${movie.sk_movie_id}`}
            className={`mt-auto inline-flex w-fit items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-ink hover:bg-accent-hover ${pressableClass} ${focusRingClass}`}
          >
            Ver detalhes
          </Link>
        </div>
      </div>
    </div>
  )
}

function FeaturedMovieSkeleton() {
  return (
    <div className="mb-6 overflow-hidden rounded-md bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_20px_-6px_rgba(28,25,23,0.08)] ring-1 ring-black/5">
      <div className="flex flex-col sm:flex-row">
        <div className="flex aspect-video w-full shrink-0 animate-pulse items-center justify-center bg-surface-muted sm:aspect-auto sm:w-72">
          <CircleNotch size={28} weight="bold" className="text-ink-muted/40 motion-safe:animate-spin-fast" aria-hidden="true" />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-6">
          <div className="h-3 w-24 animate-pulse rounded bg-surface-muted" />
          <div className="h-7 w-2/3 animate-pulse rounded bg-surface-muted" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-surface-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-surface-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-surface-muted" />
        </div>
      </div>
    </div>
  )
}

export default FeaturedMovie
