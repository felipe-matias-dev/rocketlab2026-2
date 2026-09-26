"""Regras de negócio e queries do domínio de filmes."""

from __future__ import annotations

from typing import Literal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.movies.models import (
    DimGenre,
    DimMovie,
    DimPerson,
    FactMoviePerformance,
    MovieReview,
    bridge_movie_person,
    generate_surrogate_key,
)
from app.movies.schemas import MovieCreate, MovieUpdate, ReviewCreate

MovieWithRating = tuple[DimMovie, float | None, int, float | None]

MovieSort = Literal["title", "popularity", "rating", "recent", "reviews_count"]
SortOrder = Literal["asc", "desc"]


class InvalidGenreError(ValueError):
    """Levantado quando um genre_id informado não existe em dim_genres."""

    def __init__(self, genre_id: str) -> None:
        super().__init__(f"Gênero não encontrado: {genre_id}")
        self.genre_id = genre_id


def reviews_aggregate():
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
    session: AsyncSession,
    *,
    page: int,
    page_size: int,
    q: str | None = None,
    genre_ids: list[str] | None = None,
    director: str | None = None,
    year_from: int | None = None,
    year_to: int | None = None,
    rating_min: float | None = None,
    rating_max: float | None = None,
    sort: MovieSort = "title",
    order: SortOrder = "asc",
) -> tuple[list[MovieWithRating], int]:
    """Retorna uma página de filmes com nota média/contagem calculadas ao vivo.

    Filtros são combinados com AND entre si; dentro de `genre_ids`, um filme que
    tenha qualquer um dos gêneros informados já entra (OR). `rating_min`/`rating_max`
    filtram pela nota média das avaliações de usuários (não pela nota do TMDB).
    """

    reviews_agg = reviews_aggregate()

    filters = []
    if q:
        filters.append(DimMovie.titulo.ilike(f"%{q}%"))
    if genre_ids:
        filters.append(DimMovie.genres.any(DimGenre.sk_genre_id.in_(genre_ids)))
    if director:
        # Resolve os filmes do(s) diretor(es) correspondentes numa subquery à parte
        # (IN não-correlacionado) em vez de `DimMovie.people.any(...)`: esse `.any()`
        # compila para um EXISTS correlacionado, reavaliado para cada um dos ~95k
        # filmes; a subquery IN resolve os diretores batendo com o ILIKE uma única
        # vez e reduz a filtragem a uma busca indexada por sk_movie_id.
        director_movie_ids = (
            select(bridge_movie_person.c.sk_movie_id)
            .join(DimPerson, DimPerson.sk_person_id == bridge_movie_person.c.sk_person_id)
            .where(
                DimPerson.tipo_pessoa == "Diretor",
                DimPerson.nome_pessoa.ilike(f"%{director}%"),
            )
        )
        filters.append(DimMovie.sk_movie_id.in_(director_movie_ids))
    if year_from is not None:
        filters.append(DimMovie.ano_lancamento >= year_from)
    if year_to is not None:
        filters.append(DimMovie.ano_lancamento <= year_to)
    if rating_min is not None:
        filters.append(reviews_agg.c.nota_media >= rating_min)
    if rating_max is not None:
        filters.append(reviews_agg.c.nota_media <= rating_max)

    sort_columns = {
        "title": DimMovie.titulo,
        "popularity": FactMoviePerformance.popularidade,
        "rating": reviews_agg.c.nota_media,
        "recent": DimMovie.criado_em,
        "reviews_count": func.coalesce(reviews_agg.c.qtd_avaliacoes, 0),
    }
    order_column = sort_columns[sort]
    order_clause = order_column.desc() if order == "desc" else order_column.asc()
    if sort in ("popularity", "rating"):
        # Filmes sem popularidade/avaliação ainda aparecem, só ficam por último.
        order_clause = order_clause.nulls_last()

    query = (
        select(
            DimMovie,
            reviews_agg.c.nota_media,
            func.coalesce(reviews_agg.c.qtd_avaliacoes, 0),
            FactMoviePerformance.popularidade,
        )
        .outerjoin(reviews_agg, reviews_agg.c.sk_movie_id == DimMovie.sk_movie_id)
        .outerjoin(
            FactMoviePerformance, FactMoviePerformance.sk_movie_id == DimMovie.sk_movie_id
        )
        .order_by(order_clause, DimMovie.titulo)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    count_query = (
        select(func.count())
        .select_from(DimMovie)
        .outerjoin(reviews_agg, reviews_agg.c.sk_movie_id == DimMovie.sk_movie_id)
    )
    for movie_filter in filters:
        query = query.where(movie_filter)
        count_query = count_query.where(movie_filter)

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
            selectinload(DimMovie.companies),
            selectinload(DimMovie.reviews),
            selectinload(DimMovie.performance),
        )
        .where(DimMovie.sk_movie_id == sk_movie_id)
    )
    return await session.scalar(query)


async def list_genres(session: AsyncSession) -> list[DimGenre]:
    """Lista todos os gêneros, para popular o formulário de cadastro de filme."""

    query = select(DimGenre).order_by(DimGenre.nome_genero)
    return list((await session.scalars(query)).all())


async def list_directors(
    session: AsyncSession, *, q: str | None = None, limit: int = 20
) -> list[str]:
    """Busca nomes distintos de diretores para o autocomplete do filtro do catálogo.

    A base tem ~65 mil diretores distintos (e nomes bagunçados vindos da fonte de
    dados), então isso é sempre uma busca por prefixo/trecho com limite, nunca uma
    listagem completa.
    """

    query = (
        select(DimPerson.nome_pessoa)
        .where(DimPerson.tipo_pessoa == "Diretor")
        .distinct()
        .order_by(DimPerson.nome_pessoa)
        .limit(limit)
    )
    if q:
        query = query.where(DimPerson.nome_pessoa.ilike(f"%{q}%"))
    return list((await session.scalars(query)).all())


async def _get_genres_by_ids(session: AsyncSession, genre_ids: list[str]) -> list[DimGenre]:
    genres = list(
        (await session.scalars(select(DimGenre).where(DimGenre.sk_genre_id.in_(genre_ids)))).all()
    )
    found_ids = {genre.sk_genre_id for genre in genres}
    missing_ids = set(genre_ids) - found_ids
    if missing_ids:
        raise InvalidGenreError(next(iter(missing_ids)))
    return genres


async def _get_or_create_director(session: AsyncSession, nome: str) -> DimPerson:
    query = select(DimPerson).where(
        DimPerson.nome_pessoa == nome, DimPerson.tipo_pessoa == "Diretor"
    )
    director = await session.scalar(query)
    if director is None:
        director = DimPerson(nome_pessoa=nome, tipo_pessoa="Diretor")
        session.add(director)
    return director


async def create_movie(session: AsyncSession, data: MovieCreate) -> DimMovie:
    """Cria um filme novo; genre_ids devem existir, diretor é get-or-create."""

    genres = await _get_genres_by_ids(session, data.genre_ids) if data.genre_ids else []
    people = [await _get_or_create_director(session, data.diretor)] if data.diretor else []

    movie = DimMovie(
        id_filme=generate_surrogate_key(),
        titulo=data.titulo,
        data_lancamento=data.data_lancamento,
        ano_lancamento=data.ano_lancamento,
        duracao_minutos=data.duracao_minutos,
        status_filme=data.status_filme,
        sinopse=data.sinopse,
        url_poster=data.url_poster,
        url_backdrop=data.url_backdrop,
        genres=genres,
        people=people,
    )
    session.add(movie)
    await session.commit()
    return movie


async def create_review(
    session: AsyncSession, sk_movie_id: str, data: ReviewCreate
) -> MovieReview | None:
    """Cria uma avaliação; retorna None se o filme não existir."""

    movie_id = await session.scalar(
        select(DimMovie.sk_movie_id).where(DimMovie.sk_movie_id == sk_movie_id)
    )
    if movie_id is None:
        return None

    review = MovieReview(
        sk_movie_id=sk_movie_id, nome=data.nome, nota=data.nota, comentario=data.comentario
    )
    session.add(review)
    await session.commit()
    await session.refresh(review)  # popula created_at (server_default)
    return review


async def delete_movie(session: AsyncSession, sk_movie_id: str) -> bool:
    """Remove um filme; ON DELETE CASCADE cuida de reviews/bridges/fato."""

    movie = await session.get(DimMovie, sk_movie_id)
    if movie is None:
        return False
    await session.delete(movie)
    await session.commit()
    return True


async def update_movie(
    session: AsyncSession, sk_movie_id: str, data: MovieUpdate
) -> DimMovie | None:
    """Substitui os campos editáveis de um filme existente.

    Gêneros são totalmente substituídos pelos novos `genre_ids`. Já o diretor
    é tratado à parte: só o(s) DimPerson com tipo_pessoa='Diretor' associados
    são trocados, preservando elenco/roteiristas já existentes em `people`.
    """

    query = (
        select(DimMovie)
        .options(selectinload(DimMovie.genres), selectinload(DimMovie.people))
        .where(DimMovie.sk_movie_id == sk_movie_id)
    )
    movie = await session.scalar(query)
    if movie is None:
        return None

    movie.titulo = data.titulo
    movie.data_lancamento = data.data_lancamento
    movie.ano_lancamento = data.ano_lancamento
    movie.duracao_minutos = data.duracao_minutos
    movie.status_filme = data.status_filme
    movie.sinopse = data.sinopse
    movie.url_poster = data.url_poster
    movie.url_backdrop = data.url_backdrop

    movie.genres = await _get_genres_by_ids(session, data.genre_ids) if data.genre_ids else []

    for director in [person for person in movie.people if person.tipo_pessoa == "Diretor"]:
        movie.people.remove(director)
    if data.diretor:
        movie.people.append(await _get_or_create_director(session, data.diretor))

    await session.commit()
    return movie
