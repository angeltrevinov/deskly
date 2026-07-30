"""create ticket comments table

Revision ID: 20260730_0003
Revises: 20260729_0002
Create Date: 2026-07-30
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260730_0003"
down_revision: str | None = "20260729_0002"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ticket_comentarios",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("ticket_id", sa.Integer(), nullable=False),
        sa.Column("contenido", sa.Text(), nullable=False),
        sa.Column("autor", sa.String(length=120), nullable=True),
        sa.Column(
            "creado_en",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["ticket_id"], ["tickets.id"], ondelete="CASCADE"),
    )
    op.create_index(
        op.f("ix_ticket_comentarios_id"),
        "ticket_comentarios",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ticket_comentarios_ticket_id"),
        "ticket_comentarios",
        ["ticket_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_ticket_comentarios_ticket_id"), table_name="ticket_comentarios")
    op.drop_index(op.f("ix_ticket_comentarios_id"), table_name="ticket_comentarios")
    op.drop_table("ticket_comentarios")
