import type { Review } from './review'

export interface Genre {
  sk_genre_id: string
  nome_genero: string
}

export interface Person {
  sk_person_id: string
  nome_pessoa: string
  tipo_pessoa: 'Ator' | 'Diretor' | 'Roteirista'
}

export interface Company {
  sk_company_id: string
  nome_produtora: string
}

/** Métricas de bilheteria/popularidade importadas do CSV; ausente para parte dos filmes. */
export interface Performance {
  orcamento_usd: number | null
  receita_usd: number | null
  lucro_usd: number
  popularidade: number | null
  nota_tmdb: number | null
  qtd_tmdb: number | null
  nota_imdb: number | null
  qtd_imdb: number | null
}

export interface MovieListItem {
  sk_movie_id: string
  titulo: string
  ano_lancamento: number | null
  url_poster: string | null
  nota_media: number | null
  qtd_avaliacoes: number
  popularidade: number | null
}

export type MovieSort = 'title' | 'popularity' | 'rating' | 'recent'
export type SortOrder = 'asc' | 'desc'

export interface MovieDetail {
  sk_movie_id: string
  id_filme: string
  titulo: string
  data_lancamento: string | null
  ano_lancamento: number | null
  duracao_minutos: number | null
  status_filme: string | null
  sinopse: string | null
  url_poster: string | null
  url_backdrop: string | null
  genres: Genre[]
  people: Person[]
  companies: Company[]
  reviews: Review[]
  nota_media: number | null
  qtd_avaliacoes: number
  performance: Performance | null
}

/** Corpo de POST/PUT /movies — mesma forma nos dois (MovieCreate/MovieUpdate no backend). */
export interface MovieInput {
  titulo: string
  data_lancamento: string | null
  ano_lancamento: number | null
  duracao_minutos: number | null
  status_filme: string | null
  sinopse: string | null
  url_poster: string | null
  url_backdrop: string | null
  genre_ids: string[]
  diretor: string | null
}
