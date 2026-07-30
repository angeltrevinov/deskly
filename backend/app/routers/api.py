from fastapi import APIRouter

from app.routers.health import router as health_router
from app.routers.tickets import router as tickets_router

api_router = APIRouter(prefix="/api")
api_router.include_router(health_router)
api_router.include_router(tickets_router)
