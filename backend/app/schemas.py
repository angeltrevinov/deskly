from datetime import datetime

from pydantic import BaseModel, Field

from app.models import TicketEstado


class TicketCreate(BaseModel):
    titulo: str = Field(min_length=1, max_length=160)
    descripcion: str | None = None
    prioridad: str = Field(default="medium", max_length=32)
    asignado_a: str | None = Field(default=None, max_length=120)


class TicketRead(BaseModel):
    id: int
    titulo: str
    descripcion: str | None
    prioridad: str
    estado: TicketEstado
    asignado_a: str | None
    creado_en: datetime
    actualizado_en: datetime

    model_config = {"from_attributes": True}


class TicketCommentCreate(BaseModel):
    contenido: str = Field(min_length=1, max_length=4000)
    autor: str | None = Field(default=None, max_length=120)


class TicketCommentRead(BaseModel):
    id: int
    ticket_id: int
    contenido: str
    autor: str | None
    creado_en: datetime

    model_config = {"from_attributes": True}
