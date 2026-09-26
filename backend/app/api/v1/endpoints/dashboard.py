from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dashboard import service
from app.dashboard.schemas import DashboardSummary
from app.db.session import get_db

router = APIRouter()


@router.get("", response_model=DashboardSummary)
async def get_dashboard(db: AsyncSession = Depends(get_db)) -> DashboardSummary:
    return await service.get_dashboard_summary(db)
