from datetime import datetime

from pydantic import BaseModel


class TicketRead(BaseModel):
    id: int
    title: str
    description: str | None
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
