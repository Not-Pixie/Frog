"""Número para endereço

Revision ID: f364c48b211a
Revises: 86c58d505e97
Create Date: 2025-10-20 12:40:26.751406

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f364c48b211a'
down_revision: Union[str, Sequence[str], None] = '86c58d505e97'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('enderecos', sa.Column('numero', sa.String(length=7), nullable=False))
    pass


def downgrade() -> None:
    op.drop_column('enderecos', 'numero')
    pass
