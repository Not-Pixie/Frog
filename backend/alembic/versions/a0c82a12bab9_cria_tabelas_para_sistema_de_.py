"""Cria tabelas para sistema de movimentações.

Revision ID: a0c82a12bab9
Revises: 45e992bf4765
Create Date: 2025-11-10 18:26:00.535887

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a0c82a12bab9'
down_revision: Union[str, Sequence[str], None] = '45e992bf4765'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # cria tabela carrinhos
    op.create_table(
        'carrinhos',
        sa.Column('carrinho_id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('comercio_id', sa.Integer(), sa.ForeignKey(('comercios.comercio_id'), ondelete='CASCADE'), nullable=False),
        sa.Column('atualizado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    # cria tabela itens do carrinho
    op.create_table(
        'carrinho_itens',
        sa.Column('item_id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('carrinho_id', sa.Integer(), sa.ForeignKey('carrinhos.carrinho_id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False),
        sa.Column('produto_id', sa.Integer(), sa.ForeignKey('produtos.produto_id', ondelete='RESTRICT', onupdate='CASCADE'), nullable=False),
        sa.Column('quantidade', sa.Integer(), nullable=False),
        sa.Column('comercio_id', sa.Integer(), sa.ForeignKey(('comercios.comercio_id'), ondelete='CASCADE'), nullable=False),
        sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('carrinho_id', 'produto_id', name='uq_carrinho_produto')
    )

    op.create_table(
            'movimentacoes',
            sa.Column('mov_id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('tipo', sa.String(length=16), nullable=False),
            sa.Column('carrinho_id', sa.Integer(), sa.ForeignKey('carrinhos.carrinho_id', ondelete='SET NULL', onupdate='CASCADE'), nullable=True),
            sa.Column('valor_total', sa.Numeric(12, 4), nullable=False),
            sa.Column('forma_pagamento', sa.String(100), nullable=True),
            sa.Column('desconto_percentual', sa.Numeric(6, 4), nullable=True),
            sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('comercio_id', sa.Integer(), sa.ForeignKey(('comercios.comercio_id'), ondelete='CASCADE'), nullable=False),
            sa.CheckConstraint("tipo IN ('entrada','saida')", name='ck_movimentacoes_tipo'),
        )

    # índices úteis
    op.create_index('ix_movimentacoes_tipo', 'movimentacoes', ['tipo'])
    op.create_index('ix_carrinho_itens_carrinho_id', 'carrinho_itens', ['carrinho_id'])

    pass


def downgrade() -> None:
    op.drop_index('ix_carrinho_itens_carrinho_id', table_name='carrinho_itens')
    op.drop_index('ix_movimentacoes_tipo', table_name='movimentacoes')
    op.drop_table('movimentacoes')

    op.drop_table('carrinho_itens')
    op.drop_table('carrinhos')
    pass
