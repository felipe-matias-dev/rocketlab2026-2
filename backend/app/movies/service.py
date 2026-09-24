"""Regras de negócio e queries do domínio de filmes."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.movies.models import DimGenre, DimMovie, DimPerson, MovieReview, generate_surrogate_key
from app.movies.schemas import MovieCreate, MovieUpdate, ReviewCreate

MovieWithRating = tuple[DimMovie, float | None, int]


class InvalidGenreError(ValueError):
    """Levantado quando um genre_id informado não existe em dim_genres."""

    def __init__(self, genre_id: str) -> None:
        super().__init__(f"Gênero não encontrado: {genre_id}")
        self.genre_id = genre_id


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
