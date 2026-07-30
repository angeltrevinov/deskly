from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Ticket, TicketComentario, TicketEstado
from app.schemas import TicketCommentCreate, TicketCommentRead, TicketCreate, TicketRead

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("", response_model=list[TicketRead])
def list_tickets(db: Session = Depends(get_db)) -> list[Ticket]:
    return db.query(Ticket).order_by(Ticket.id.desc()).all()


@router.post("", response_model=TicketRead, status_code=201)
def create_ticket(payload: TicketCreate, db: Session = Depends(get_db)) -> Ticket:
    ticket = Ticket(
        titulo=payload.titulo,
        descripcion=payload.descripcion,
        prioridad=payload.prioridad,
        asignado_a=payload.asignado_a,
        estado=TicketEstado.ABIERTO,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.get("/{ticket_id}", response_model=TicketRead)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)) -> Ticket:
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    return ticket


@router.post("/{ticket_id}/comentarios", response_model=TicketCommentRead, status_code=201)
def add_ticket_comment(
    ticket_id: int,
    payload: TicketCommentCreate,
    db: Session = Depends(get_db),
) -> TicketComentario:
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    comment = TicketComentario(
        ticket_id=ticket.id,
        contenido=payload.contenido,
        autor=payload.autor,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
