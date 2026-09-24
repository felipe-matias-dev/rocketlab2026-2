"""Regras de negócio e queries do domínio de filmes."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.movies.models import DimGenre, DimMovie, MovieReview

MovieWithRating = tuple[DimMovie, float | None, int]


def _reviews_aggregate():
    return (
        select(
            MovieReview.sk_movie_id,
            func.avg(MovieReview.nota).label("nota_media"),
            func.count(MovieReview.sk_movie_review_id).label("qtd_avaliacoes"),
        )
        .group_by(MovieReview.sk_movie_id)
        .subquery()
    )


async def list_movies(
    session: AsyncSession, *, page: int, page_size: int, q: str | None = None
) -> tuple[list[MovieWithRating], int]:
    """Retorna uma página de filmes com nota média/contagem calculadas ao vivo.

    Se `q` for informado, filtra por título (busca parcial, sem diferenciar caixa).
    """

    reviews_agg = _reviews_aggregate()
    title_filter = DimMovie.titulo.ilike(f"%{q}%") if q else None

    query = (
        select(
            DimMovie,
            reviews_agg.c.nota_media,
            func.coalesce(reviews_agg.c.qtd_avaliacoes, 0),
        )
        .outerjoin(reviews_agg, reviews_agg.c.sk_movie_id == DimMovie.sk_movie_id)
        .order_by(DimMovie.titulo)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    count_query = select(func.count()).select_from(DimMovie)
    if title_filter is not None:
        query = query.where(title_filter)
        count_query = count_query.where(title_filter)

    total = await session.scalar(count_query)
    rows = (await session.execute(query)).all()
    return list(rows), total or 0


async def get_movie_detail(session: AsyncSession, sk_movie_id: str) -> DimMovie | None:
    """Busca um filme com gêneros, pessoas e avaliações já carregados."""

    query = (
        select(DimMovie)
        .options(
            selectinload(DimMovie.genres),
            selectinload(DimMovie.people),
            selectinload(DimMovie.reviews),
        )
        .where(DimMovie.sk_movie_id == sk_movie_id)
    )
    return await session.scalar(query)


async def list_genres(session: AsyncSession) -> list[DimGenre]:
    """Lista todos os gêneros, para popular o formulário de cadastro de filme."""

    query = select(DimGenre).order_by(DimGenre.nome_genero)
    return list((await session.scalars(query)).all())
