from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class TicketWorkflowState(Base):
    __tablename__ = "ticket_workflow_states"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    codigo: Mapped[str] = mapped_column(String(32), nullable=False, unique=True, index=True)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=True)
    es_inicial: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    es_terminal: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    orden: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)


class TicketWorkflowTransition(Base):
    __tablename__ = "ticket_workflow_transitions"
    __table_args__ = (
        UniqueConstraint("estado_origen_id", "estado_destino_id", name="uq_ticket_transition_pair"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    estado_origen_id: Mapped[int] = mapped_column(
        ForeignKey("ticket_workflow_states.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    estado_destino_id: Mapped[int] = mapped_column(
        ForeignKey("ticket_workflow_states.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    activa: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=True)

    estado_origen: Mapped[TicketWorkflowState] = relationship(
        foreign_keys=[estado_origen_id],
    )
    estado_destino: Mapped[TicketWorkflowState] = relationship(
        foreign_keys=[estado_destino_id],
    )


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    titulo: Mapped[str] = mapped_column(String(160), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    prioridad: Mapped[str] = mapped_column(String(32), nullable=False, default="medium")
    estado: Mapped[str] = mapped_column(String(32), nullable=False)
    asignado_a: Mapped[str | None] = mapped_column(String(120), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    comentarios: Mapped[list["TicketComentario"]] = relationship(
        back_populates="ticket",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class TicketComentario(Base):
    __tablename__ = "ticket_comentarios"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("tickets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    contenido: Mapped[str] = mapped_column(Text(), nullable=False)
    autor: Mapped[str | None] = mapped_column(String(120), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    ticket: Mapped[Ticket] = relationship(back_populates="comentarios")


class TicketWebhookEvent(Base):
    __tablename__ = "ticket_webhook_events"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    event_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("tickets.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    recibido_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    ticket: Mapped[Ticket] = relationship()
