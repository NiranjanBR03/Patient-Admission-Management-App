"""create patients table

Revision ID: 001_create_patients
Revises:
"""
from alembic import op
import sqlalchemy as sa

revision = "001_create_patients"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "patients",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("age", sa.Integer(), nullable=False),
        sa.Column("gender", sa.String(length=30), nullable=False),
        sa.Column("ward", sa.String(length=60), nullable=False),
        sa.Column("department", sa.String(length=80), nullable=False),
        sa.Column("doctor", sa.String(length=80), nullable=False),
        sa.Column("admission_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("patients")

