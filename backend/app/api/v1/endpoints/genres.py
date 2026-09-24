from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.movies import service
from app.movies.schemas import GenreRead

router = APIRouter()


@router.get("", response_model=list[GenreRead])
async def list_genres(db: AsyncSession = Depends(get_db)) -> list[GenreRead]:
    genres = await service.list_genres(db)
    return [GenreRead.model_validate(genre) for genre in genres]
