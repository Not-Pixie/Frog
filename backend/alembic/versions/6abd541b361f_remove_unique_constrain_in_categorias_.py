"""remove unique constrain in categorias.nome

Revision ID: 6abd541b361f
Revises: 6b79e8a4bd7e
Create Date: 2025-10-29 19:14:51.015303

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6abd541b361f'
down_revision: Union[str, Sequence[str], None] = '6b79e8a4bd7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_constraint(op.f('categorias_nome_key'), 'categorias', type_='unique')


def downgrade() -> None:
    """Downgrade schema."""
    op.create_unique_constraint(
        op.f('categorias_nome_key'),
        'categorias',
        ['nome'],
        postgresql_nulls_not_distinct=False
    )
