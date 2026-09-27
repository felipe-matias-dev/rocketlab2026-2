"""Queries de agregação do dashboard administrativo.

Cada seção do dashboard é uma função isolada; `get_dashboard_summary` as executa
sequencialmente (uma `AsyncSession` não é segura para `asyncio.gather` concorrente).
"""

from __future__ import annotations

from sqlalchemy import Integer, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dashboard.schemas import (
    DashboardKpis,
    DashboardSummary,
    FinancialsByDecade,
    GenreRatingBreakdown,
    MoviesByYear,
    RankedMovie,
    RankedMovieByRevenue,
    RatingBucket,
)
from app.movies.cache import movie_cache
from app.movies.models import (
    DimGenre,
    DimMovie,
    DimReview,
    FactMoviePerformance,
    MovieReview,
    bridge_movie_genre,
)

MIN_REVIEWS_FOR_TOP_RATED = 5
TOP_N = 10


async def _get_kpis(session: AsyncSession) -> DashboardKpis:
    total_movies = await session.scalar(select(func.count()).select_from(DimMovie)) or 0
    total_reviews, avg_rating = (
        await session.execute(
            select(func.count(MovieReview.sk_movie_review_id), func.avg(MovieReview.nota))
        )
    ).one()

    most_reviewed = (
        await session.execute(
            select(DimMovie.titulo, DimReview.qtd_avaliacoes_usuarios)
            .join(DimReview, DimReview.sk_movie_id == DimMovie.sk_movie_id)
            .order_by(DimReview.qtd_avaliacoes_usuarios.desc())
            .limit(1)
        )
    ).first()

    return DashboardKpis(
        total_movies=total_movies,
        total_reviews=total_reviews or 0,
        avg_rating=avg_rating,
        most_reviewed_movie_titulo=most_reviewed[0] if most_reviewed else None,
        most_reviewed_movie_qtd=most_reviewed[1] if most_reviewed else 0,
    )


async def _get_rating_distribution(session: AsyncSession) -> list[RatingBucket]:
    """Contagem de reviews em faixas de 1 ponto (nota é contínua, step 0.1 no formulário)."""

    floor_nota = func.cast(func.floor(MovieReview.nota), Integer)
    rows = (
        await session.execute(select(floor_nota.label("faixa"), func.count()).group_by("faixa"))
    ).all()
    counts: dict[int, int] = {int(row.faixa): row[1] for row in rows}
    # nota=10.0 (teto da escala) cai na última faixa (9-10), não numa faixa própria.
    counts[9] = counts.get(9, 0) + counts.pop(10, 0)
    return [RatingBucket(faixa_inicio=i, qtd=counts.get(i, 0)) for i in range(10)]


async def _get_avg_rating_by_genre(session: AsyncSession) -> list[GenreRatingBreakdown]:
    """Nota média dos filmes de cada gênero. Todos os 19 gêneros aparecem, mesmo sem review."""

    rows = (
        await session.execute(
            select(
                DimGenre.sk_genre_id,
                DimGenre.nome_genero,
                func.avg(DimReview.nota_media_usuarios),
                func.coalesce(func.sum(DimReview.qtd_avaliacoes_usuarios), 0),
            )
            .select_from(DimGenre)
            .outerjoin(
                bridge_movie_genre, bridge_movie_genre.c.sk_genre_id == DimGenre.sk_genre_id
            )
            .outerjoin(DimReview, DimReview.sk_movie_id == bridge_movie_genre.c.sk_movie_id)
            .group_by(DimGenre.sk_genre_id, DimGenre.nome_genero)
            .order_by(DimGenre.nome_genero)
        )
    ).all()
    return [
        GenreRatingBreakdown(
            sk_genre_id=row[0], nome_genero=row[1], nota_media=row[2], qtd_avaliacoes=row[3]
        )
        for row in rows
    ]


async def _get_movies_by_year(session: AsyncSession) -> list[MoviesByYear]:
    """Filmes do catálogo por ano de lançamento, do primeiro ao último ano com dado.

    Ao contrário de reviews (todas criadas na mesma carga do seed, sem variação real de
    data), ano_lancamento tem variação genuína e já é uma coluna indexada.
    """

    rows = (
        await session.execute(
            select(DimMovie.ano_lancamento, func.count())
            .where(DimMovie.ano_lancamento.is_not(None))
            .group_by(DimMovie.ano_lancamento)
        )
    ).all()
    counts: dict[int, int] = {row[0]: row[1] for row in rows}
    if not counts:
        return []
    first_year, last_year = min(counts), max(counts)
    return [
        MoviesByYear(ano=year, qtd=counts.get(year, 0)) for year in range(first_year, last_year + 1)
    ]


async def _get_top_rated_movies(session: AsyncSession) -> list[RankedMovie]:
    """Top 10 por nota média, exigindo um piso de reviews para não deixar 1 nota dominar."""

    rows = (
        await session.execute(
            select(
                DimMovie.sk_movie_id,
                DimMovie.titulo,
                DimReview.nota_media_usuarios,
                DimReview.qtd_avaliacoes_usuarios,
            )
            .join(DimReview, DimReview.sk_movie_id == DimMovie.sk_movie_id)
            .where(DimReview.qtd_avaliacoes_usuarios >= MIN_REVIEWS_FOR_TOP_RATED)
            .order_by(DimReview.nota_media_usuarios.desc())
            .limit(TOP_N)
        )
    ).all()
    return [
        RankedMovie(sk_movie_id=r[0], titulo=r[1], nota_media=r[2], qtd_avaliacoes=r[3])
        for r in rows
    ]


async def _get_most_reviewed_movies(session: AsyncSession) -> list[RankedMovie]:
    rows = (
        await session.execute(
            select(
                DimMovie.sk_movie_id,
                DimMovie.titulo,
                DimReview.nota_media_usuarios,
                DimReview.qtd_avaliacoes_usuarios,
            )
            .join(DimReview, DimReview.sk_movie_id == DimMovie.sk_movie_id)
            .order_by(DimReview.qtd_avaliacoes_usuarios.desc())
            .limit(TOP_N)
        )
    ).all()
    return [
        RankedMovie(sk_movie_id=r[0], titulo=r[1], nota_media=r[2], qtd_avaliacoes=r[3])
        for r in rows
    ]


async def _get_top_movies_by_revenue(session: AsyncSession) -> list[RankedMovieByRevenue]:
    rows = (
        await session.execute(
            select(
                DimMovie.sk_movie_id,
                DimMovie.titulo,
                FactMoviePerformance.receita_usd,
                FactMoviePerformance.orcamento_usd,
            )
            .join(FactMoviePerformance, FactMoviePerformance.sk_movie_id == DimMovie.sk_movie_id)
            .where(FactMoviePerformance.receita_usd.is_not(None))
            .order_by(FactMoviePerformance.receita_usd.desc())
            .limit(TOP_N)
        )
    ).all()
    return [
        RankedMovieByRevenue(sk_movie_id=r[0], titulo=r[1], receita_usd=r[2], orcamento_usd=r[3])
        for r in rows
    ]


async def _get_financials_by_decade(session: AsyncSession) -> list[FinancialsByDecade]:
    decada = ((DimMovie.ano_lancamento // 10) * 10).label("decada")
    rows = (
        await session.execute(
            select(
                decada,
                func.avg(FactMoviePerformance.orcamento_usd),
                func.avg(FactMoviePerformance.receita_usd),
            )
            .select_from(DimMovie)
            .join(FactMoviePerformance, FactMoviePerformance.sk_movie_id == DimMovie.sk_movie_id)
            .where(DimMovie.ano_lancamento.is_not(None))
            .group_by("decada")
            .order_by("decada")
        )
    ).all()
    return [
        FinancialsByDecade(decada=r[0], orcamento_medio_usd=r[1], receita_media_usd=r[2])
        for r in rows
    ]


async def get_dashboard_summary(session: AsyncSession) -> DashboardSummary:
    cache_key = ("dashboard",)
    cached = movie_cache.get(cache_key)
    if cached is not None:
        return cached
    generation = movie_cache.generation

    summary = DashboardSummary(
        kpis=await _get_kpis(session),
        rating_distribution=await _get_rating_distribution(session),
        avg_rating_by_genre=await _get_avg_rating_by_genre(session),
        movies_by_year=await _get_movies_by_year(session),
        top_rated_movies=await _get_top_rated_movies(session),
        most_reviewed_movies=await _get_most_reviewed_movies(session),
        top_movies_by_revenue=await _get_top_movies_by_revenue(session),
        financials_by_decade=await _get_financials_by_decade(session),
    )
    movie_cache.put_if_current(cache_key, summary, generation)
    return summary
