"""adiciona codigo_local em movimentacoes

Revision ID: dff62b566f55
Revises: b721c855dbd3
Create Date: 2025-11-22 18:03:49.430401

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import insert as pg_insert


# revision identifiers, used by Alembic.
revision: str = 'dff62b566f55'
down_revision: Union[str, Sequence[str], None] = 'b721c855dbd3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    metadata = sa.MetaData()
    
    t_movimentacoes = sa.Table(
        'movimentacoes', metadata,
        sa.Column('mov_id', sa.Integer, primary_key=True),
        sa.Column('comercio_id', sa.Integer),
        sa.Column('tipo', sa.String),
        sa.Column('criado_em', sa.DateTime),
        sa.Column('codigo', sa.Integer) # Coluna nova
    )
    
    t_contadores = sa.Table(
        'contadores_locais', metadata,
        sa.Column('comercio_id', sa.Integer, primary_key=True),
        sa.Column('scope', sa.String, primary_key=True),
        sa.Column('ultimo_codigo', sa.Integer),
        sa.Column('updated_at', sa.DateTime)
    )

    # 2. Atualizar Check Constraint 
    op.drop_constraint('ck_contadores_scope_allowed', 'contadores_locais', type_='check')
    op.create_check_constraint(
        'ck_contadores_scope_allowed',
        'contadores_locais',
        "scope IN ('produtos','fornecedores','categorias','unidade_medidas', 'mov_entrada', 'mov_saida')"
    )

    # 3. Adicionar Coluna (Nullable)
    op.add_column('movimentacoes', sa.Column('codigo', sa.Integer(), nullable=True))

    # 4. Backfill dos Códigos     
    # Subquery para calcular a numeração
    sq_rn = sa.select(
        t_movimentacoes.c.mov_id,
        sa.func.row_number().over(
            partition_by=[t_movimentacoes.c.comercio_id, t_movimentacoes.c.tipo],
            order_by=t_movimentacoes.c.criado_em
        ).label('rn')
    ).subquery('sq_rn')

    update_stmt = (
        sa.update(t_movimentacoes)
        .values(codigo=sq_rn.c.rn)
        .where(t_movimentacoes.c.mov_id == sq_rn.c.mov_id)
    )
    op.execute(update_stmt)

    # 5. Sincronizar Contadores (UPSERT / ON CONFLICT)
    select_max = sa.select(
        t_movimentacoes.c.comercio_id,
        (sa.literal("mov_") + t_movimentacoes.c.tipo).label("scope"), # Concatenação SQL
        sa.func.max(t_movimentacoes.c.codigo).label("ultimo_codigo"),
        sa.func.now().label("updated_at")
    ).group_by(
        t_movimentacoes.c.comercio_id, 
        t_movimentacoes.c.tipo
    )

    insert_stmt = pg_insert(t_contadores).from_select(
        ['comercio_id', 'scope', 'ultimo_codigo', 'updated_at'],
        select_max
    )

    upsert_stmt = insert_stmt.on_conflict_do_update(
        index_elements=['comercio_id', 'scope'], # PK da tabela contadores
        set_={
            'ultimo_codigo': insert_stmt.excluded.ultimo_codigo,
            'updated_at': sa.func.now()
        }
    )
    
    op.execute(upsert_stmt)


    # Fim
    op.alter_column('movimentacoes', 'codigo', nullable=False)
    
    op.create_unique_constraint(
        'uq_movimentacoes_comercio_tipo_codigo', 
        'movimentacoes', 
        ['comercio_id', 'tipo', 'codigo']
    )
    # Obrigado por ler :)


def downgrade() -> None:
    # Reverter constraints
    op.drop_constraint('uq_movimentacoes_comercio_tipo_codigo', 'movimentacoes', type_='unique')
    op.drop_column('movimentacoes', 'codigo')

    # Limpar contadores novos
    op.execute("DELETE FROM contadores_locais WHERE scope IN ('mov_entrada', 'mov_saida')")

    # Reverter Check Constraint antiga
    op.drop_constraint('ck_contadores_scope_allowed', 'contadores_locais', type_='check')
    op.create_check_constraint(
        'ck_contadores_scope_allowed',
        'contadores_locais',
        "scope IN ('produtos','fornecedores','categorias','unidade_medidas')"
    )