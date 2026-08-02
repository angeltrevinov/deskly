"""convert domain ids to uuid

Revision ID: 20260801_0006
Revises: 20260731_0005
Create Date: 2026-08-01
"""

from collections.abc import Sequence
from uuid import uuid4

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260801_0006"
down_revision: str | None = "20260731_0005"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def _uuid() -> str:
    return str(uuid4())


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS ticket_webhook_events CASCADE")
    op.execute("DROP TABLE IF EXISTS ticket_comentarios CASCADE")
    op.execute("DROP TABLE IF EXISTS ticket_workflow_transitions CASCADE")
    op.execute("DROP TABLE IF EXISTS ticket_workflow_states CASCADE")
    op.execute("DROP TABLE IF EXISTS tickets CASCADE")

    op.create_table(
        "tickets",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("titulo", sa.String(length=160), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("prioridad", sa.String(length=32), nullable=False),
        sa.Column("estado", sa.String(length=32), nullable=False),
        sa.Column("asignado_a", sa.String(length=120), nullable=True),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("actualizado_en", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tickets_id"), "tickets", ["id"], unique=False)

    op.create_table(
        "ticket_comentarios",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("ticket_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("contenido", sa.Text(), nullable=False),
        sa.Column("autor", sa.String(length=120), nullable=True),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["ticket_id"], ["tickets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ticket_comentarios_id"), "ticket_comentarios", ["id"], unique=False)
    op.create_index(
        op.f("ix_ticket_comentarios_ticket_id"),
        "ticket_comentarios",
        ["ticket_id"],
        unique=False,
    )

    op.create_table(
        "ticket_webhook_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_id", sa.String(length=120), nullable=False),
        sa.Column("ticket_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("recibido_en", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["ticket_id"], ["tickets.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id"),
    )
    op.create_index(op.f("ix_ticket_webhook_events_id"), "ticket_webhook_events", ["id"], unique=False)
    op.create_index(
        op.f("ix_ticket_webhook_events_event_id"),
        "ticket_webhook_events",
        ["event_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ticket_webhook_events_ticket_id"),
        "ticket_webhook_events",
        ["ticket_id"],
        unique=False,
    )

    op.create_table(
        "ticket_workflow_states",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("codigo", sa.String(length=32), nullable=False),
        sa.Column("nombre", sa.String(length=120), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("es_inicial", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("es_terminal", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("orden", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("codigo", name="uq_ticket_workflow_states_codigo"),
    )
    op.create_index(op.f("ix_ticket_workflow_states_id"), "ticket_workflow_states", ["id"], unique=False)
    op.create_index(
        op.f("ix_ticket_workflow_states_codigo"),
        "ticket_workflow_states",
        ["codigo"],
        unique=False,
    )

    abierto_id = _uuid()
    en_progreso_id = _uuid()
    resuelto_id = _uuid()
    cerrado_id = _uuid()
    reabierto_id = _uuid()

    workflow_states_table = sa.table(
        "ticket_workflow_states",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("codigo", sa.String(length=32)),
        sa.column("nombre", sa.String(length=120)),
        sa.column("activo", sa.Boolean()),
        sa.column("es_inicial", sa.Boolean()),
        sa.column("es_terminal", sa.Boolean()),
        sa.column("orden", sa.Integer()),
    )
    op.bulk_insert(
        workflow_states_table,
        [
            {"id": abierto_id, "codigo": "abierto", "nombre": "Abierto", "activo": True, "es_inicial": True, "es_terminal": False, "orden": 1},
            {"id": en_progreso_id, "codigo": "en_progreso", "nombre": "En progreso", "activo": True, "es_inicial": False, "es_terminal": False, "orden": 2},
            {"id": resuelto_id, "codigo": "resuelto", "nombre": "Resuelto", "activo": True, "es_inicial": False, "es_terminal": False, "orden": 3},
            {"id": cerrado_id, "codigo": "cerrado", "nombre": "Cerrado", "activo": True, "es_inicial": False, "es_terminal": True, "orden": 4},
            {"id": reabierto_id, "codigo": "reabierto", "nombre": "Reabierto", "activo": True, "es_inicial": False, "es_terminal": False, "orden": 5},
        ],
    )

    op.create_table(
        "ticket_workflow_transitions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("estado_origen_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("estado_destino_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("activa", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.ForeignKeyConstraint(["estado_origen_id"], ["ticket_workflow_states.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["estado_destino_id"], ["ticket_workflow_states.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("estado_origen_id", "estado_destino_id", name="uq_ticket_transition_pair"),
    )
    op.create_index(op.f("ix_ticket_workflow_transitions_id"), "ticket_workflow_transitions", ["id"], unique=False)
    op.create_index(
        op.f("ix_ticket_workflow_transitions_estado_origen_id"),
        "ticket_workflow_transitions",
        ["estado_origen_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ticket_workflow_transitions_estado_destino_id"),
        "ticket_workflow_transitions",
        ["estado_destino_id"],
        unique=False,
    )

    workflow_transitions_table = sa.table(
        "ticket_workflow_transitions",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("estado_origen_id", postgresql.UUID(as_uuid=True)),
        sa.column("estado_destino_id", postgresql.UUID(as_uuid=True)),
        sa.column("activa", sa.Boolean()),
    )
    op.bulk_insert(
        workflow_transitions_table,
        [
            {"id": _uuid(), "estado_origen_id": abierto_id, "estado_destino_id": en_progreso_id, "activa": True},
            {"id": _uuid(), "estado_origen_id": en_progreso_id, "estado_destino_id": resuelto_id, "activa": True},
            {"id": _uuid(), "estado_origen_id": resuelto_id, "estado_destino_id": cerrado_id, "activa": True},
            {"id": _uuid(), "estado_origen_id": resuelto_id, "estado_destino_id": reabierto_id, "activa": True},
        ],
    )


def downgrade() -> None:
    raise NotImplementedError("Downgrade no soportado para migración destructiva a UUID")