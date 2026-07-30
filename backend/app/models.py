from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum as SQLEnum, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class TicketEstado(str, PyEnum):
    ABIERTO = "abierto"
    EN_PROGRESO = "en_progreso"
    RESUELTO = "resuelto"
    CERRADO = "cerrado"
    REABIERTO = "reabierto"


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    titulo: Mapped[str] = mapped_column(String(160), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    prioridad: Mapped[str] = mapped_column(String(32), nullable=False, default="medium")
    estado: Mapped[TicketEstado] = mapped_column(
        SQLEnum(TicketEstado, native_enum=False, length=32),
        nullable=False,
        default=TicketEstado.ABIERTO,
    )
    asignado_a: Mapped[str | None] = mapped_column(String(120), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
