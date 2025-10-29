"""Adiciona UniqueConstraint para tabelas adicionais.

Revision ID: 6b79e8a4bd7e
Revises: ce51fffa5490
Create Date: 2025-10-25 14:54:59.468610

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6b79e8a4bd7e'
down_revision: Union[str, Sequence[str], None] = 'ce51fffa5490'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
        # Adiciona as novas constraints para Categoria
    op.create_unique_constraint(
        'uq_categoria_comercio_codigo',
        'categorias',
        ['comercio_id', 'codigo']
    )
    op.create_unique_constraint(
        'uq_categoria_comercio_nome',
        'categorias',
        ['comercio_id', 'nome']
    )
    
    # Adiciona as constraints para Fornecedor
    op.create_unique_constraint(
        'uq_fornecedor_comercio_codigo',
        'fornecedores',
        ['comercio_id', 'codigo']
    )
    op.create_unique_constraint(
        'uq_fornecedor_comercio_cnpj',
        'fornecedores',
        ['comercio_id', 'cnpj']
    )
    pass


def downgrade() -> None:
    op.drop_constraint('uq_fornecedor_comercio_cnpj', 'fornecedores', type_='unique')
    op.drop_constraint('uq_fornecedor_comercio_codigo', 'fornecedores', type_='unique')
    
    # Remove as constraints da tabela Categoria
    op.drop_constraint('uq_categoria_comercio_nome', 'categorias', type_='unique')
    op.drop_constraint('uq_categoria_comercio_codigo', 'categorias', type_='unique')
    pass
