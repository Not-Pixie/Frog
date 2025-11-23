"""Adiciona valor para carrinhoitem

Revision ID: c76d30e3d2b0
Revises: dff62b566f55
Create Date: 2025-11-23 15:28:11.055321

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c76d30e3d2b0'
down_revision: Union[str, Sequence[str], None] = 'dff62b566f55'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('carrinho_itens', sa.Column('preco_unitario', sa.Numeric(10, 2), nullable=True))
    op.add_column('carrinho_itens', sa.Column('subtotal', sa.Numeric(12, 4), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('carrinho_itens', 'subtotal')
    op.drop_column('carrinho_itens', 'preco_unitario')
