"""change whatsapp_notifications_enabled default to false

Revision ID: 6b881796dc47
Revises: e7586c88fbbc
Create Date: 2026-06-30 20:33:21.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '6b881796dc47'
down_revision: Union[str, Sequence[str], None] = 'e7586c88fbbc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('lodges', 'whatsapp_notifications_enabled', server_default='false')
    op.execute('UPDATE lodges SET whatsapp_notifications_enabled = false')

def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('lodges', 'whatsapp_notifications_enabled', server_default='true')
