"""Coloca atributo 'estado' na tbl mov

Revision ID: 5f772ce3f5b8
Revises: 2287e3385f6f
Create Date: 2025-11-18 23:49:14.589929

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5f772ce3f5b8'
down_revision: Union[str, Sequence[str], None] = '2287e3385f6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('movimentacoes', sa.Column('estado', sa.String(7), nullable=False))
    op.add_column('movimentacoes', sa.Column('fechado_em', sa.DateTime(timezone=True), nullable=True))

def downgrade() -> None:
    op.drop_column('movimentacoes', 'estado')
    op.drop_column('movimentacoes', 'fechado_em')
    pass
