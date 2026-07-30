"""rename ticket fields to spanish

Revision ID: 20260729_0002
Revises: 20260729_0001
Create Date: 2026-07-29
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260729_0002"
down_revision: str | None = "20260729_0001"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("tickets", "title", new_column_name="titulo")
    op.alter_column("tickets", "description", new_column_name="descripcion")
    op.alter_column("tickets", "status", new_column_name="estado")
    op.alter_column("tickets", "priority", new_column_name="prioridad")
    op.alter_column("tickets", "created_at", new_column_name="creado_en")
    op.alter_column("tickets", "updated_at", new_column_name="actualizado_en")

    op.add_column("tickets", sa.Column("asignado_a", sa.String(length=120), nullable=True))

    op.execute(
        sa.text(
            """
            UPDATE tickets
            SET estado = CASE estado
                WHEN 'open' THEN 'abierto'
                WHEN 'in_progress' THEN 'en_progreso'
                WHEN 'resolved' THEN 'resuelto'
                WHEN 'closed' THEN 'cerrado'
                WHEN 'reopened' THEN 'reabierto'
                ELSE estado
            END
            """
        )
    )


def downgrade() -> None:
    op.drop_column("tickets", "asignado_a")

    op.execute(
        sa.text(
            """
            UPDATE tickets
            SET estado = CASE estado
                WHEN 'abierto' THEN 'open'
                WHEN 'en_progreso' THEN 'in_progress'
                WHEN 'resuelto' THEN 'resolved'
                WHEN 'cerrado' THEN 'closed'
                WHEN 'reabierto' THEN 'reopened'
                ELSE estado
            END
            """
        )
    )

    op.alter_column("tickets", "actualizado_en", new_column_name="updated_at")
    op.alter_column("tickets", "creado_en", new_column_name="created_at")
    op.alter_column("tickets", "prioridad", new_column_name="priority")
    op.alter_column("tickets", "estado", new_column_name="status")
    op.alter_column("tickets", "descripcion", new_column_name="description")
    op.alter_column("tickets", "titulo", new_column_name="title")