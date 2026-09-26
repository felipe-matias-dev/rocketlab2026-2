from fastapi import APIRouter

from app.api.v1.endpoints.dashboard import router as dashboard_router
from app.api.v1.endpoints.directors import router as directors_router
from app.api.v1.endpoints.genres import router as genres_router
from app.api.v1.endpoints.movies import router as movies_router
from app.api.v1.endpoints.reviews import router as reviews_router

api_router = APIRouter()

api_router.include_router(movies_router, prefix="/movies", tags=["movies"])
api_router.include_router(reviews_router, prefix="/movies", tags=["reviews"])
api_router.include_router(genres_router, prefix="/genres", tags=["genres"])
api_router.include_router(directors_router, prefix="/directors", tags=["directors"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
