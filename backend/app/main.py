from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Ticket
from app.schemas import TicketRead

app = FastAPI(title="Deskly API")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Deskly backend is running"}


@app.get("/health")
def health(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ok"}


@app.get("/tickets", response_model=list[TicketRead])
def list_tickets(db: Session = Depends(get_db)) -> list[TicketRead]:
    tickets = db.query(Ticket).order_by(Ticket.id.desc()).all()
    return tickets
