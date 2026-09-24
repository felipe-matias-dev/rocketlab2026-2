from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.movies import service
from app.movies.models import DimMovie
from app.movies.schemas import (
    GenreRead,
    MovieCreate,
    MovieDetail,
    MovieListItem,
    MovieUpdate,
    Paginated,
    PersonRead,
    ReviewRead,
)
from app.movies.service import MovieSort, SortOrder

router = APIRouter()


def _build_movie_detail(movie: DimMovie) -> MovieDetail:
    notas = [review.nota for review in movie.reviews]
    nota_media = sum(notas) / len(notas) if notas else None

    return MovieDetail(
        sk_movie_id=movie.sk_movie_id,
        id_filme=movie.id_filme,
        titulo=movie.titulo,
        data_lancamento=movie.data_lancamento,
        ano_lancamento=movie.ano_lancamento,
        duracao_minutos=movie.duracao_minutos,
        status_filme=movie.status_filme,
        sinopse=movie.sinopse,
        url_poster=movie.url_poster,
        url_backdrop=movie.url_backdrop,
        genres=[GenreRead.model_validate(genre) for genre in movie.genres],
        people=[PersonRead.model_validate(person) for person in movie.people],
        reviews=[ReviewRead.model_validate(review) for review in movie.reviews],
        nota_media=nota_media,
        qtd_avaliacoes=len(notas),
    )


@router.get("", response_model=Paginated[MovieListItem])
async def list_movies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: str | None = Query(None, description="Busca parcial por título"),
    genre_ids: list[str] | None = Query(None, description="Filtra por qualquer um destes gêneros"),
    director: str | None = Query(None, description="Busca parcial por nome do diretor"),
    year_from: int | None = Query(None, description="Ano de lançamento mínimo"),
    year_to: int | None = Query(None, description="Ano de lançamento máximo"),
    rating_min: float | None = Query(None, ge=0, le=10, description="Nota média mínima"),
    rating_max: float | None = Query(None, ge=0, le=10, description="Nota média máxima"),
    sort: MovieSort = Query("title", description="Campo de ordenação"),
    order: SortOrder = Query("asc", description="Direção da ordenação"),
    db: AsyncSession = Depends(get_db),
) -> Paginated[MovieListItem]:
    rows, total = await service.list_movies(
        db,
        page=page,
        page_size=page_size,
        q=q,
        genre_ids=genre_ids,
        director=director,
        year_from=year_from,
        year_to=year_to,
        rating_min=rating_min,
        rating_max=rating_max,
        sort=sort,
        order=order,
    )
    items = [
        MovieListItem(
            sk_movie_id=movie.sk_movie_id,
            titulo=movie.titulo,
            ano_lancamento=movie.ano_lancamento,
            url_poster=movie.url_poster,
            nota_media=nota_media,
            qtd_avaliacoes=qtd_avaliacoes,
            popularidade=popularidade,
        )
        for movie, nota_media, qtd_avaliacoes, popularidade in rows
    ]
    return Paginated(items=items, total=total, page=page, page_size=page_size)


@router.get("/{sk_movie_id}", response_model=MovieDetail)
async def get_movie(sk_movie_id: str, db: AsyncSession = Depends(get_db)) -> MovieDetail:
    movie = await service.get_movie_detail(db, sk_movie_id)
    if movie is None:
        raise HTTPException(status_code=404, detail="Filme não encontrado")
    return _build_movie_detail(movie)


async def _reload_movie_detail(db: AsyncSession, sk_movie_id: str) -> MovieDetail:
    # Recarrega com selectinload: acessar `.reviews` no objeto recém-commitado sem
    # isso dispara um lazy-load síncrono e quebra (MissingGreenlet) em contexto async.
    movie = await service.get_movie_detail(db, sk_movie_id)
    if movie is None:  # pragma: no cover - não deve acontecer logo após commit
        raise HTTPException(status_code=500, detail="Falha ao recarregar o filme")
    return _build_movie_detail(movie)


@router.post("", response_model=MovieDetail, status_code=status.HTTP_201_CREATED)
async def create_movie(payload: MovieCreate, db: AsyncSession = Depends(get_db)) -> MovieDetail:
    try:
        created = await service.create_movie(db, payload)
    except service.InvalidGenreError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return await _reload_movie_detail(db, created.sk_movie_id)


@router.put("/{sk_movie_id}", response_model=MovieDetail)
async def update_movie(
    sk_movie_id: str, payload: MovieUpdate, db: AsyncSession = Depends(get_db)
) -> MovieDetail:
    try:
        updated = await service.update_movie(db, sk_movie_id, payload)
    except service.InvalidGenreError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    if updated is None:
        raise HTTPException(status_code=404, detail="Filme não encontrado")
    return await _reload_movie_detail(db, sk_movie_id)


@router.delete("/{sk_movie_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_movie(sk_movie_id: str, db: AsyncSession = Depends(get_db)) -> None:
    deleted = await service.delete_movie(db, sk_movie_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Filme não encontrado")
