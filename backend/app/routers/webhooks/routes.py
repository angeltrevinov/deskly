import hashlib
import hmac
import os
import re
import time

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Ticket, TicketWebhookEvent
from app.schemas import TicketRead, WebhookTicketIngestRequest
from app.ticket_event_bus import ticket_ws_manager
from app.ticket_state_machine import get_initial_ticket_state_code

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def get_webhook_secret() -> str:
    secret = os.getenv("WEBHOOK_SHARED_SECRET")
    if not secret:
        raise HTTPException(status_code=500, detail="Webhook secret no configurado")
    return secret


def get_replay_window_seconds() -> int:
    value = os.getenv("WEBHOOK_REPLAY_WINDOW_SECONDS", "300")
    try:
        window = int(value)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail="Replay window invalido") from exc

    if window < 1:
        raise HTTPException(status_code=500, detail="Replay window invalido")
    return window


def verify_webhook_signature(raw_body: bytes, timestamp: int, signature: str) -> None:
    now = int(time.time())
    replay_window = get_replay_window_seconds()
    if abs(now - timestamp) > replay_window:
        raise HTTPException(status_code=401, detail="Timestamp fuera de ventana permitida")

    message = str(timestamp).encode("utf-8") + b"." + raw_body
    expected_signature = hmac.new(
        get_webhook_secret().encode("utf-8"),
        message,
        hashlib.sha256,
    ).hexdigest()

    provided_signature = signature.strip()
    if provided_signature.startswith("sha256="):
        provided_signature = provided_signature[len("sha256=") :]

    # Guard format/length before compare to avoid malformed signature quirks.
    if len(provided_signature) != len(expected_signature):
        raise HTTPException(status_code=401, detail="Firma invalida")
    if re.fullmatch(r"[0-9a-fA-F]{64}", provided_signature) is None:
        raise HTTPException(status_code=401, detail="Firma invalida")

    if not hmac.compare_digest(provided_signature, expected_signature):
        raise HTTPException(status_code=401, detail="Firma invalida")


@router.post("/tickets")
async def ingest_ticket_webhook(
    request: Request,
    payload: WebhookTicketIngestRequest,
    x_deskly_timestamp: int = Header(..., alias="X-Deskly-Timestamp"),
    x_deskly_signature: str = Header(..., alias="X-Deskly-Signature"),
    db: Session = Depends(get_db),
) -> JSONResponse:
    raw_body = await request.body()
    verify_webhook_signature(
        raw_body=raw_body,
        timestamp=x_deskly_timestamp,
        signature=x_deskly_signature,
    )

    duplicate_event = (
        db.query(TicketWebhookEvent)
        .filter(TicketWebhookEvent.event_id == payload.event_id)
        .first()
    )
    if duplicate_event is not None:
        return JSONResponse(
            status_code=200,
            content={"status": "duplicado", "event_id": payload.event_id},
        )

    try:
        initial_state = get_initial_ticket_state_code(db)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    ticket = Ticket(
        titulo=payload.ticket.titulo,
        descripcion=payload.ticket.descripcion,
        prioridad=payload.ticket.prioridad,
        asignado_a=payload.ticket.asignado_a,
        estado=initial_state,
    )
    db.add(ticket)
    db.flush()

    webhook_event = TicketWebhookEvent(event_id=payload.event_id, ticket_id=ticket.id)
    db.add(webhook_event)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        duplicate_after_race = (
            db.query(TicketWebhookEvent)
            .filter(TicketWebhookEvent.event_id == payload.event_id)
            .first()
        )
        if duplicate_after_race is not None:
            return JSONResponse(
                status_code=200,
                content={"status": "duplicado", "event_id": payload.event_id},
            )

        raise HTTPException(status_code=500, detail="Error de integridad al procesar webhook")

    db.refresh(ticket)

    ticket_payload = TicketRead.model_validate(ticket).model_dump(mode="json")
    await ticket_ws_manager.emit("ticket.creado", ticket.id, ticket_payload)

    return JSONResponse(
        status_code=201,
        content={"status": "creado", "event_id": payload.event_id, "ticket": ticket_payload},
    )
