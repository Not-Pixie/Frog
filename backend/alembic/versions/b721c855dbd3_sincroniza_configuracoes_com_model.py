"""sincroniza configuracoes com model

Revision ID: b721c855dbd3
Revises: 623ce034de46
Create Date: 2025-11-19 18:53:45.794371

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b721c855dbd3'
down_revision: Union[str, Sequence[str], None] = '623ce034de46'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('configuracoes_comercio', sa.Column('unimed_id', sa.Integer(), nullable=True))
    
    op.alter_column('configuracoes_comercio', 'nivel_alerta_minimo',
               existing_type=sa.NUMERIC(precision=14, scale=2),
               type_=sa.Numeric(precision=14, scale=3),
               existing_nullable=False,
               existing_server_default=sa.text('0.00'))
    
    op.create_foreign_key(None, 'configuracoes_comercio', 'unidade_medidas', ['unimed_id'], ['unimed_id'], ondelete='SET NULL')


def downgrade() -> None:
    op.drop_constraint(None, 'configuracoes_comercio', type_='foreignkey')
    
    op.alter_column('configuracoes_comercio', 'nivel_alerta_minimo',
               existing_type=sa.Numeric(precision=14, scale=3),
               type_=sa.NUMERIC(precision=14, scale=2),
               existing_nullable=False,
               existing_server_default=sa.text('0.00'))
    
    op.drop_column('configuracoes_comercio', 'unimed_id')
