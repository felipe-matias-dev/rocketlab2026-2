"""Schemas Pydantic da API de dashboard."""

from __future__ import annotations

from pydantic import BaseModel


class DashboardKpis(BaseModel):
    """Contagens e média gerais do catálogo, exibidas na faixa de KPIs."""

    total_movies: int
    total_reviews: int
    avg_rating: float | None
    most_reviewed_movie_titulo: str | None
    most_reviewed_movie_qtd: int


class RatingBucket(BaseModel):
    """Contagem de reviews numa faixa de 1 ponto (ex.: faixa_inicio=7 => notas em [7, 8))."""

    faixa_inicio: int
    qtd: int


class GenreRatingBreakdown(BaseModel):
    """Nota média e volume de reviews de um gênero. Todos os 19 gêneros sempre aparecem."""

    sk_genre_id: str
    nome_genero: str
    nota_media: float | None
    qtd_avaliacoes: int


class MoviesByYear(BaseModel):
    """Quantidade de filmes do catálogo lançados num ano."""

    ano: int
    qtd: int


class RankedMovie(BaseModel):
    """Um filme num ranking por nota ou por volume de avaliações."""

    sk_movie_id: str
    titulo: str
    nota_media: float | None
    qtd_avaliacoes: int


class RankedMovieByRevenue(BaseModel):
    """Um filme num ranking por receita (TMDB), com orçamento para contexto."""

    sk_movie_id: str
    titulo: str
    receita_usd: float | None
    orcamento_usd: float | None


class FinancialsByDecade(BaseModel):
    """Orçamento e receita médios dos filmes lançados numa década."""

    decada: int
    orcamento_medio_usd: float | None
    receita_media_usd: float | None


class DashboardSummary(BaseModel):
    """Payload composto retornado por GET /api/v1/dashboard."""

    kpis: DashboardKpis
    rating_distribution: list[RatingBucket]
    avg_rating_by_genre: list[GenreRatingBreakdown]
    movies_by_year: list[MoviesByYear]
    top_rated_movies: list[RankedMovie]
    most_reviewed_movies: list[RankedMovie]
    top_movies_by_revenue: list[RankedMovieByRevenue]
    financials_by_decade: list[FinancialsByDecade]
