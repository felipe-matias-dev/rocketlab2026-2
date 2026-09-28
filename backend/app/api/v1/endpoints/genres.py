from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.movies import service
from app.movies.schemas import GenreRead

router = APIRouter()


@router.get("", response_model=list[GenreRead], summary="Listar gêneros")
async def list_genres(db: AsyncSession = Depends(get_db)) -> list[GenreRead]:
    """Todos os gêneros cadastrados, para popular filtros e o formulário de cadastro."""
    genres = await service.list_genres(db)
    return [GenreRead.model_validate(genre) for genre in genres]
