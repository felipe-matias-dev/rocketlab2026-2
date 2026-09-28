from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.movies import service

router = APIRouter()


@router.get("", response_model=list[str], summary="Autocomplete de diretores")
async def list_directors(
    q: str | None = Query(None, description="Busca por prefixo do nome do diretor"),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> list[str]:
    """Nomes de diretores que começam com o prefixo informado (nunca a listagem completa)."""
    return await service.list_directors(db, q=q, limit=limit)
