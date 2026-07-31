"""create ticket webhook events table

Revision ID: 20260731_0004
Revises: 20260730_0003
Create Date: 2026-07-31
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260731_0004"
down_revision: str | None = "20260730_0003"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ticket_webhook_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_id", sa.String(length=120), nullable=False),
        sa.Column("ticket_id", sa.Integer(), nullable=False),
        sa.Column(
            "recibido_en",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["ticket_id"], ["tickets.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("event_id", name="uq_ticket_webhook_events_event_id"),
    )
    op.create_index(
        op.f("ix_ticket_webhook_events_id"),
        "ticket_webhook_events",
        ["id"],
        unique=False,
    )
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


def downgrade() -> None:
    op.drop_index(op.f("ix_ticket_webhook_events_ticket_id"), table_name="ticket_webhook_events")
    op.drop_index(op.f("ix_ticket_webhook_events_event_id"), table_name="ticket_webhook_events")
    op.drop_index(op.f("ix_ticket_webhook_events_id"), table_name="ticket_webhook_events")
    op.drop_table("ticket_webhook_events")
