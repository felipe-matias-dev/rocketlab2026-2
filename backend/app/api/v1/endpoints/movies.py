from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.movies import service
from app.movies.schemas import MovieCreate, MovieDetail, MovieListItem, MovieUpdate, Paginated
from app.movies.service import MovieSort, SortOrder

router = APIRouter()


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
    return await service.list_movies(
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


@router.get("/{sk_movie_id}", response_model=MovieDetail)
async def get_movie(sk_movie_id: str, db: AsyncSession = Depends(get_db)) -> MovieDetail:
    detail = await service.get_movie_detail(db, sk_movie_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Filme não encontrado")
    return detail


@router.post("", response_model=MovieDetail, status_code=status.HTTP_201_CREATED)
async def create_movie(payload: MovieCreate, db: AsyncSession = Depends(get_db)) -> MovieDetail:
    try:
        return await service.create_movie(db, payload)
    except service.InvalidGenreError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


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
    return updated


@router.delete("/{sk_movie_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_movie(sk_movie_id: str, db: AsyncSession = Depends(get_db)) -> None:
    deleted = await service.delete_movie(db, sk_movie_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Filme não encontrado")
