from datetime import datetime

from pydantic import BaseModel, Field
from pydantic import model_validator


class TicketCreate(BaseModel):
    titulo: str = Field(min_length=1, max_length=160)
    descripcion: str | None = None
    prioridad: str = Field(default="medium", max_length=32)
    asignado_a: str | None = Field(default=None, max_length=120)


class TicketUpdate(BaseModel):
    titulo: str | None = Field(default=None, min_length=1, max_length=160)
    descripcion: str | None = None
    prioridad: str | None = Field(default=None, max_length=32)
    estado: str | None = Field(default=None, min_length=1, max_length=32)
    asignado_a: str | None = Field(default=None, max_length=120)

    @model_validator(mode="after")
    def validate_non_empty_payload(self) -> "TicketUpdate":
        if not self.model_fields_set:
            raise ValueError("Debe enviar al menos un campo para actualizar")

        required_field_names = ("titulo", "prioridad", "estado")
        for field_name in required_field_names:
            if field_name in self.model_fields_set and getattr(self, field_name) is None:
                raise ValueError(f"El campo '{field_name}' no permite null")

        return self


class TicketRead(BaseModel):
    id: int
    titulo: str
    descripcion: str | None
    prioridad: str
    estado: str
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


class TicketStateTransition(BaseModel):
    estado: str = Field(min_length=1, max_length=32)


class TicketStateTransitionConflict(BaseModel):
    error: str
    mensaje: str
    estado_actual: str
    estado_objetivo: str
    transiciones_permitidas: list[str]


class WebhookTicketPayload(BaseModel):
    titulo: str = Field(min_length=1, max_length=160)
    descripcion: str | None = None
    prioridad: str = Field(default="medium", max_length=32)
    asignado_a: str | None = Field(default=None, max_length=120)


class WebhookTicketIngestRequest(BaseModel):
    event_id: str = Field(min_length=1, max_length=120)
    ticket: WebhookTicketPayload
