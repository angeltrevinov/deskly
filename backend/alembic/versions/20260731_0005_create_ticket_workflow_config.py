"""create ticket workflow config tables

Revision ID: 20260731_0005
Revises: 20260731_0004
Create Date: 2026-07-31
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260731_0005"
down_revision: str | None = "20260731_0004"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ticket_workflow_states",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("codigo", sa.String(length=32), nullable=False),
        sa.Column("nombre", sa.String(length=120), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("es_inicial", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("es_terminal", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("orden", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.UniqueConstraint("codigo", name="uq_ticket_workflow_states_codigo"),
    )
    op.create_index(
        op.f("ix_ticket_workflow_states_id"),
        "ticket_workflow_states",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ticket_workflow_states_codigo"),
        "ticket_workflow_states",
        ["codigo"],
        unique=False,
    )

    op.create_table(
        "ticket_workflow_transitions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("estado_origen_id", sa.Integer(), nullable=False),
        sa.Column("estado_destino_id", sa.Integer(), nullable=False),
        sa.Column("activa", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.ForeignKeyConstraint(["estado_origen_id"], ["ticket_workflow_states.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["estado_destino_id"], ["ticket_workflow_states.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("estado_origen_id", "estado_destino_id", name="uq_ticket_transition_pair"),
    )
    op.create_index(
        op.f("ix_ticket_workflow_transitions_id"),
        "ticket_workflow_transitions",
        ["id"],
        unique=False,
    )
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

    op.execute(
        sa.text(
            """
            INSERT INTO ticket_workflow_states (codigo, nombre, activo, es_inicial, es_terminal, orden)
            VALUES
                ('abierto', 'Abierto', true, true, false, 1),
                ('en_progreso', 'En progreso', true, false, false, 2),
                ('resuelto', 'Resuelto', true, false, false, 3),
                ('cerrado', 'Cerrado', true, false, true, 4),
                ('reabierto', 'Reabierto', true, false, false, 5)
            ON CONFLICT (codigo) DO NOTHING
            """
        )
    )

    op.execute(
        sa.text(
            """
            INSERT INTO ticket_workflow_transitions (estado_origen_id, estado_destino_id, activa)
            SELECT s_from.id, s_to.id, true
            FROM ticket_workflow_states s_from
            JOIN ticket_workflow_states s_to ON (
                (s_from.codigo = 'abierto' AND s_to.codigo = 'en_progreso')
                OR (s_from.codigo = 'en_progreso' AND s_to.codigo = 'resuelto')
                OR (s_from.codigo = 'resuelto' AND s_to.codigo = 'cerrado')
                OR (s_from.codigo = 'resuelto' AND s_to.codigo = 'reabierto')
            )
            ON CONFLICT (estado_origen_id, estado_destino_id) DO NOTHING
            """
        )
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_ticket_workflow_transitions_estado_destino_id"),
        table_name="ticket_workflow_transitions",
    )
    op.drop_index(
        op.f("ix_ticket_workflow_transitions_estado_origen_id"),
        table_name="ticket_workflow_transitions",
    )
    op.drop_index(op.f("ix_ticket_workflow_transitions_id"), table_name="ticket_workflow_transitions")
    op.drop_table("ticket_workflow_transitions")

    op.drop_index(op.f("ix_ticket_workflow_states_codigo"), table_name="ticket_workflow_states")
    op.drop_index(op.f("ix_ticket_workflow_states_id"), table_name="ticket_workflow_states")
    op.drop_table("ticket_workflow_states")
