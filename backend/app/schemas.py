from datetime import datetime

from pydantic import BaseModel

from app.models import TicketEstado


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
