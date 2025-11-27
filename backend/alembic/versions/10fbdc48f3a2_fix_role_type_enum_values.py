'''fix_role_type_enum_values

Revision ID: 10fbdc48f3a2
Revises: 4743c601d933
Create Date: 2025-11-27 09:58:35.689769

'''
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '10fbdc48f3a2'
down_revision = '4743c601d933'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Update role_type column to accept Portuguese values
    op.alter_column(
        "roles",
        "role_type",
        existing_type=sa.Enum("LODGE", "OBEDIENCE", "SUBOBEDIENCE", name="roletypeenum"),
        type_=sa.Enum("Loja", "Obediência", "Subobediência", name="roletypeenum"),
        existing_nullable=False,
    )


def downgrade() -> None:
    # Revert to English values (if needed, though we are moving forward)
    op.alter_column(
        "roles",
        "role_type",
        existing_type=sa.Enum("Loja", "Obediência", "Subobediência", name="roletypeenum"),
        type_=sa.Enum("LODGE", "OBEDIENCE", "SUBOBEDIENCE", name="roletypeenum"),
        existing_nullable=False,
    )
