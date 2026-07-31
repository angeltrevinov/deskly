from datetime import datetime
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy import asc, desc
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Ticket, TicketComentario, TicketEstado
from app.schemas import (
    TicketCommentCreate,
    TicketCommentRead,
    TicketCreate,
    TicketRead,
    TicketStateTransition,
    TicketStateTransitionConflict,
    TicketUpdate,
)
from app.ticket_state_machine import (
    InvalidTicketStateTransitionError,
    validate_ticket_state_transition,
)

router = APIRouter(prefix="/tickets", tags=["tickets"])


class TicketSortBy(str, Enum):
    id = "id"
    creado_en = "creado_en"
    actualizado_en = "actualizado_en"
    prioridad = "prioridad"
    estado = "estado"
    asignado_a = "asignado_a"


class SortOrder(str, Enum):
    asc = "asc"
    desc = "desc"


def get_ticket_or_404(ticket_id: int, db: Session) -> Ticket:
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    return ticket


@router.get("", response_model=list[TicketRead])
def list_tickets(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    estado: TicketEstado | None = None,
    prioridad: str | None = Query(default=None, max_length=32),
    asignado_a: str | None = Query(default=None, max_length=120),
    creado_desde: datetime | None = None,
    creado_hasta: datetime | None = None,
    actualizado_desde: datetime | None = None,
    actualizado_hasta: datetime | None = None,
    sort_by: TicketSortBy = TicketSortBy.creado_en,
    sort_order: SortOrder = SortOrder.desc,
    db: Session = Depends(get_db),
) -> list[Ticket]:
    query = db.query(Ticket)

    if estado is not None:
        query = query.filter(Ticket.estado == estado)
    if prioridad is not None:
        query = query.filter(Ticket.prioridad == prioridad)
    if asignado_a is not None:
        query = query.filter(Ticket.asignado_a == asignado_a)
    if creado_desde is not None:
        query = query.filter(Ticket.creado_en >= creado_desde)
    if creado_hasta is not None:
        query = query.filter(Ticket.creado_en <= creado_hasta)
    if actualizado_desde is not None:
        query = query.filter(Ticket.actualizado_en >= actualizado_desde)
    if actualizado_hasta is not None:
        query = query.filter(Ticket.actualizado_en <= actualizado_hasta)

    sort_field_map = {
        TicketSortBy.id: Ticket.id,
        TicketSortBy.creado_en: Ticket.creado_en,
        TicketSortBy.actualizado_en: Ticket.actualizado_en,
        TicketSortBy.prioridad: Ticket.prioridad,
        TicketSortBy.estado: Ticket.estado,
        TicketSortBy.asignado_a: Ticket.asignado_a,
    }
    sort_column = sort_field_map[sort_by]
    sort_expression = asc(sort_column) if sort_order == SortOrder.asc else desc(sort_column)
    id_tie_breaker = asc(Ticket.id) if sort_order == SortOrder.asc else desc(Ticket.id)

    return query.order_by(sort_expression, id_tie_breaker).offset(offset).limit(limit).all()


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
    return get_ticket_or_404(ticket_id=ticket_id, db=db)


@router.get("/{ticket_id}/comentarios", response_model=list[TicketCommentRead])
def list_ticket_comments(
    ticket_id: int,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[TicketComentario]:
    ticket = get_ticket_or_404(ticket_id=ticket_id, db=db)

    return (
        db.query(TicketComentario)
        .filter(TicketComentario.ticket_id == ticket.id)
        .order_by(desc(TicketComentario.creado_en), desc(TicketComentario.id))
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.post("/{ticket_id}/comentarios", response_model=TicketCommentRead, status_code=201)
def add_ticket_comment(
    ticket_id: int,
    payload: TicketCommentCreate,
    db: Session = Depends(get_db),
) -> TicketComentario:
    ticket = get_ticket_or_404(ticket_id=ticket_id, db=db)

    comment = TicketComentario(
        ticket_id=ticket.id,
        contenido=payload.contenido,
        autor=payload.autor,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.post(
    "/{ticket_id}/transiciones",
    response_model=TicketRead,
    responses={409: {"model": TicketStateTransitionConflict}},
)
def transition_ticket_state(
    ticket_id: int,
    payload: TicketStateTransition,
    db: Session = Depends(get_db),
) -> Ticket | JSONResponse:
    ticket = get_ticket_or_404(ticket_id=ticket_id, db=db)

    try:
        validate_ticket_state_transition(ticket.estado, payload.estado)
    except InvalidTicketStateTransitionError as exc:
        return JSONResponse(status_code=409, content=exc.conflict.model_dump(mode="json"))

    ticket.estado = payload.estado
    db.commit()
    db.refresh(ticket)
    return ticket


@router.patch(
    "/{ticket_id}",
    response_model=TicketRead,
    responses={409: {"model": TicketStateTransitionConflict}},
)
def update_ticket(
    ticket_id: int,
    payload: TicketUpdate,
    db: Session = Depends(get_db),
) -> Ticket | JSONResponse:
    ticket = get_ticket_or_404(ticket_id=ticket_id, db=db)

    changes = payload.model_dump(exclude_unset=True)
    if "estado" in changes:
        try:
            validate_ticket_state_transition(ticket.estado, changes["estado"])
        except InvalidTicketStateTransitionError as exc:
            return JSONResponse(status_code=409, content=exc.conflict.model_dump(mode="json"))

    for field, value in changes.items():
        setattr(ticket, field, value)

    db.commit()
    db.refresh(ticket)
    return ticket
