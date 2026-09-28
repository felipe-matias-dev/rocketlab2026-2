from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.movies import service
from app.movies.schemas import ReviewCreate, ReviewRead

router = APIRouter()


@router.post(
    "/{sk_movie_id}/reviews",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
    summary="Adicionar avaliação",
    responses={404: {"description": "Filme não encontrado"}},
)
async def create_review(
    sk_movie_id: str, payload: ReviewCreate, db: AsyncSession = Depends(get_db)
) -> ReviewRead:
    """Registra uma avaliação (nota 0-10 + comentário) e recalcula a nota média do filme."""
    review = await service.create_review(db, sk_movie_id, payload)
    if review is None:
        raise HTTPException(status_code=404, detail="Filme não encontrado")
    return ReviewRead.model_validate(review)


@router.delete(
    "/{sk_movie_id}/reviews/{sk_movie_review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover avaliação",
    responses={404: {"description": "Avaliação não encontrada"}},
)
async def delete_review(
    sk_movie_id: str, sk_movie_review_id: str, db: AsyncSession = Depends(get_db)
) -> None:
    """Remove uma avaliação e recalcula a nota média do filme a partir das que restaram."""
    deleted = await service.delete_review(db, sk_movie_id, sk_movie_review_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
