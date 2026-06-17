"""add_prevista_and_suprimida_to_enum

Revision ID: 5243265ee466
Revises: 9ff3f879203f
Create Date: 2026-06-17 09:52:30.119977

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5243265ee466'
down_revision: Union[str, Sequence[str], None] = '9ff3f879203f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Postgres doesn't allow adding ENUM values in a single transaction easily if the transaction is already open
    op.execute("ALTER TYPE session_status_enum ADD VALUE IF NOT EXISTS 'PREVISTA'")
    op.execute("ALTER TYPE session_status_enum ADD VALUE IF NOT EXISTS 'SUPRIMIDA'")


def downgrade() -> None:
    """Downgrade schema."""
    pass
