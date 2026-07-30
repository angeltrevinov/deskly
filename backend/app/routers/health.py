from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import get_db

router = APIRouter()


@router.get("/health")
def health(db: Session = Depends(get_db)) -> dict[str, str]:
    """Health endpoint used only to verify that the backend is running and can reach the database."""
    db.execute(text("SELECT 1"))
    return {"status": "ok"}
