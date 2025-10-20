"""Adiciona coluna 'codigo' para tabela produto e outras

Revision ID: f96d0711730f
Revises: d1ae5e0b7cc7
Create Date: 2025-10-20 23:12:52.857047

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f96d0711730f'
down_revision: Union[str, Sequence[str], None] = 'd1ae5e0b7cc7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('produtos', sa.Column('codigo', sa.Integer(), nullable=False))
    op.add_column('categorias', sa.Column('codigo', sa.Integer(), nullable=False))
    op.add_column('fornecedores', sa.Column('codigo', sa.Integer(), nullable=False))
    pass


def downgrade() -> None:
    op.drop_column('produtos', 'codigo')
    op.drop_column('categorias', 'codigo')
    op.drop_column('fornecedores', 'codigo')
    pass
