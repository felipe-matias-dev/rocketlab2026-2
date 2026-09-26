export interface DashboardKpis {
  total_movies: number
  total_reviews: number
  avg_rating: number | null
  most_reviewed_movie_titulo: string | null
  most_reviewed_movie_qtd: number
}

export interface RatingBucket {
  faixa_inicio: number
  qtd: number
}

export interface GenreRatingBreakdown {
  sk_genre_id: string
  nome_genero: string
  nota_media: number | null
  qtd_avaliacoes: number
}

export interface MoviesByYear {
  ano: number
  qtd: number
}

export interface RankedMovie {
  sk_movie_id: string
  titulo: string
  nota_media: number | null
  qtd_avaliacoes: number
}

export interface RankedMovieByRevenue {
  sk_movie_id: string
  titulo: string
  receita_usd: number | null
  orcamento_usd: number | null
}

export interface FinancialsByDecade {
  decada: number
  orcamento_medio_usd: number | null
  receita_media_usd: number | null
}

export interface DashboardSummary {
  kpis: DashboardKpis
  rating_distribution: RatingBucket[]
  avg_rating_by_genre: GenreRatingBreakdown[]
  movies_by_year: MoviesByYear[]
  top_rated_movies: RankedMovie[]
  most_reviewed_movies: RankedMovie[]
  top_movies_by_revenue: RankedMovieByRevenue[]
  financials_by_decade: FinancialsByDecade[]
}
