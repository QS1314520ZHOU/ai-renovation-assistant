"""Add price snapshot and adjustment suggestion tables.

Revision ID: a71f3cf3bfb6
Revises: d054a00edbe8
Create Date: 2026-03-09 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "a71f3cf3bfb6"
down_revision: Union[str, None] = "d054a00edbe8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "price_snapshots",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("source", sa.String(length=50), nullable=False),
        sa.Column("city_code", sa.String(length=10), nullable=False),
        sa.Column("standard_item_code", sa.String(length=30), nullable=True),
        sa.Column("raw_material_name", sa.String(length=200), nullable=False),
        sa.Column("raw_spec", sa.String(length=200), nullable=True),
        sa.Column("raw_unit", sa.String(length=20), nullable=True),
        sa.Column("raw_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("price_type", sa.String(length=20), nullable=False),
        sa.Column("snapshot_date", sa.Date(), nullable=False),
        sa.Column("raw_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("is_processed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_price_snapshots_city_code",
        "price_snapshots",
        ["city_code"],
        unique=False,
    )
    op.create_index(
        "ix_price_snapshots_city_item",
        "price_snapshots",
        ["city_code", "standard_item_code"],
        unique=False,
    )
    op.create_index(
        "ix_price_snapshots_source_date",
        "price_snapshots",
        ["source", "snapshot_date"],
        unique=False,
    )

    op.create_table(
        "price_adjustment_suggestions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("city_code", sa.String(length=10), nullable=False),
        sa.Column("standard_item_code", sa.String(length=30), nullable=False),
        sa.Column("tier", sa.String(length=20), nullable=False),
        sa.Column("current_material_price", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("current_labor_price", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("suggested_material_price", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("suggested_labor_price", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("deviation_pct", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("sample_count", sa.Integer(), nullable=True),
        sa.Column("sources_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default=sa.text("'pending'"),
        ),
        sa.Column("reviewed_by", sa.UUID(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_price_adjustment_suggestions_city_tier",
        "price_adjustment_suggestions",
        ["city_code", "tier", "status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_price_adjustment_suggestions_city_tier", table_name="price_adjustment_suggestions")
    op.drop_table("price_adjustment_suggestions")
    op.drop_index("ix_price_snapshots_source_date", table_name="price_snapshots")
    op.drop_index("ix_price_snapshots_city_item", table_name="price_snapshots")
    op.drop_index("ix_price_snapshots_city_code", table_name="price_snapshots")
    op.drop_table("price_snapshots")
