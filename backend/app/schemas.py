from datetime import datetime

from pydantic import BaseModel, Field
from pydantic import model_validator

from app.models import TicketEstado


class TicketCreate(BaseModel):
    titulo: str = Field(min_length=1, max_length=160)
    descripcion: str | None = None
    prioridad: str = Field(default="medium", max_length=32)
    asignado_a: str | None = Field(default=None, max_length=120)


class TicketUpdate(BaseModel):
    titulo: str | None = Field(default=None, min_length=1, max_length=160)
    descripcion: str | None = None
    prioridad: str | None = Field(default=None, max_length=32)
    estado: TicketEstado | None = None
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
    estado: TicketEstado
    asignado_a: str | None
    creado_en: datetime
    actualizado_en: datetime

    model_config = {"from_attributes": True}
