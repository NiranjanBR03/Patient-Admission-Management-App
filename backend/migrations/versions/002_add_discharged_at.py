"""add discharged_at to patients

Revision ID: 002_add_discharged_at
Revises: 001_create_patients
"""
from alembic import op
import sqlalchemy as sa

revision = "002_add_discharged_at"
down_revision = "001_create_patients"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("patients", sa.Column("discharged_at", sa.Date(), nullable=True))


def downgrade():
    op.drop_column("patients", "discharged_at")

