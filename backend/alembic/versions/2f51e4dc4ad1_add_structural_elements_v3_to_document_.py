"""add_structural_elements_v3_to_document_engine

Revision ID: 2f51e4dc4ad1
Revises: 7a92977ec294
Create Date: 2026-03-13 10:20:35.411472

Adds v3 structural composition fields to the 3-tier document engine:
- GlobalDocumentTemplate: page_settings_json, structural_elements_json, element_configs_json
- LocalDocumentTemplate: page_settings_json, structural_elements_json, element_configs_json
- DocumentInstance: element_text_overrides
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "2f51e4dc4ad1"
down_revision: str | Sequence[str] | None = "7a92977ec294"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add v3 structural elements columns."""
    # GlobalDocumentTemplate — Padronização (Nível Global)
    op.add_column("global_document_templates", sa.Column("page_settings_json", sa.JSON(), nullable=True))
    op.add_column("global_document_templates", sa.Column("structural_elements_json", sa.JSON(), nullable=True))
    op.add_column("global_document_templates", sa.Column("element_configs_json", sa.JSON(), nullable=True))

    # LocalDocumentTemplate — Personalização (Nível Instancial)
    op.add_column("local_document_templates", sa.Column("page_settings_json", sa.JSON(), nullable=True))
    op.add_column("local_document_templates", sa.Column("structural_elements_json", sa.JSON(), nullable=True))
    op.add_column("local_document_templates", sa.Column("element_configs_json", sa.JSON(), nullable=True))

    # DocumentInstance — Adequação (Nível Operacional)
    op.add_column(
        "document_instances",
        sa.Column(
            "element_text_overrides",
            sa.JSON(),
            nullable=True,
            comment='Adequações de texto por elemento: {"assunto": "Texto adequado...", "texto": "<p>..."}',
        ),
    )


def downgrade() -> None:
    """Remove v3 structural elements columns."""
    op.drop_column("document_instances", "element_text_overrides")

    op.drop_column("local_document_templates", "element_configs_json")
    op.drop_column("local_document_templates", "structural_elements_json")
    op.drop_column("local_document_templates", "page_settings_json")

    op.drop_column("global_document_templates", "element_configs_json")
    op.drop_column("global_document_templates", "structural_elements_json")
    op.drop_column("global_document_templates", "page_settings_json")
