from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dashboard import service
from app.dashboard.schemas import DashboardSummary
from app.db.session import get_db

router = APIRouter()


@router.get("", response_model=DashboardSummary, summary="Resumo analítico do catálogo")
async def get_dashboard(db: AsyncSession = Depends(get_db)) -> DashboardSummary:
    """KPIs gerais, distribuição de notas, ranking de filmes e recorte financeiro por década."""
    return await service.get_dashboard_summary(db)
