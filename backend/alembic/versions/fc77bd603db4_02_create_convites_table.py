"""02_create_convites_table

Revision ID: fc77bd603db4
Revises: 1322944f6493
Create Date: 2025-09-29 08:22:47.498346

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fc77bd603db4'
down_revision: Union[str, Sequence[str], None] = 'b0c6690d878d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
        op.create_table(
        "convites",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("comercio_id", sa.Integer(), sa.ForeignKey("comercios.comercio_id"), nullable=False),
        sa.Column("link", sa.String(length=16), nullable=False, unique=True),
        sa.Column("criado_em", sa.TIMESTAMP(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("atualizado_em", sa.TIMESTAMP(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    )
        pass


def downgrade() -> None:
    op.drop_table("convites")
    pass
