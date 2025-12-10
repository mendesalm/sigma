'''fix_administration_id_autoincrement

Revision ID: b4340b073757
Revises: 5833d58774f5
Create Date: 2025-12-08 08:53:42.435443

'''
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b4340b073757'
down_revision = '5833d58774f5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("administrations", "id", existing_type=sa.Integer(), autoincrement=True, nullable=False)


def downgrade() -> None:
    pass
