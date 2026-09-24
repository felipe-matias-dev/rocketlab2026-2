from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.movies import service
from app.movies.schemas import (
    GenreRead,
    MovieDetail,
    MovieListItem,
    Paginated,
    PersonRead,
    ReviewRead,
)

router = APIRouter()


@router.get("", response_model=Paginated[MovieListItem])
async def list_movies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: str | None = Query(None, description="Busca parcial por título"),
    db: AsyncSession = Depends(get_db),
) -> Paginated[MovieListItem]:
    rows, total = await service.list_movies(db, page=page, page_size=page_size, q=q)
    items = [
        MovieListItem(
            sk_movie_id=movie.sk_movie_id,
            titulo=movie.titulo,
            ano_lancamento=movie.ano_lancamento,
            url_poster=movie.url_poster,
            nota_media=nota_media,
            qtd_avaliacoes=qtd_avaliacoes,
        )
        for movie, nota_media, qtd_avaliacoes in rows
    ]
    return Paginated(items=items, total=total, page=page, page_size=page_size)


@router.get("/{sk_movie_id}", response_model=MovieDetail)
async def get_movie(sk_movie_id: str, db: AsyncSession = Depends(get_db)) -> MovieDetail:
    movie = await service.get_movie_detail(db, sk_movie_id)
    if movie is None:
        raise HTTPException(status_code=404, detail="Filme não encontrado")

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
