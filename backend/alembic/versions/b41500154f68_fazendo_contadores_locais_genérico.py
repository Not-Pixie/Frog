"""fazendo contadores_locais genérico

Revision ID: b41500154f68
Revises: 1f5e82c9f9f4
Create Date: 2025-10-23 19:12:49.404153

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b41500154f68'
down_revision: Union[str, Sequence[str], None] = '1f5e82c9f9f4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "contadores_locais",
        sa.Column("scope", sa.String(32), nullable=False, server_default="produto")
    )

    # 2) garantir que todos os registros existentes tenham scope = 'produto'
    contadores_locais = sa.table(
        "contadores_locais",
        sa.column("scope", sa.String)
    )
    op.execute(
        contadores_locais.update().values(scope="produto").where(contadores_locais.c.scope.is_(None))
    )

    # 3) trocar PK: drop da PK atual e criar PK composta (comercio_id, scope)
    # Usando a API do Alembic para operações de constraint
    op.drop_constraint("contadores_locais_pkey", "contadores_locais", type_="primary")
    op.create_primary_key(
        "contadores_locais_pkey",
        "contadores_locais",
        ["comercio_id", "scope"]
    )

    # 4) adicionar CheckConstraint para valores permitidos no scope
    op.create_check_constraint(
        "ck_contadores_scope_allowed",
        "contadores_locais",
        sa.column("scope").in_(["produto", "fornecedor", "categoria", "unidade_medidas"])
    )

    # 5) criar índice para buscas por (scope, comercio_id)
    op.create_index(
        "ix_contadores_locais_scope_comercio",
        "contadores_locais",
        ["scope", "comercio_id"]
    )

def downgrade() -> None:
    op.drop_index("ix_contadores_locais_scope_comercio", table_name="contadores_locais")
    op.drop_constraint("ck_contadores_scope_allowed", "contadores_locais", type_="check")

    op.drop_constraint("contadores_locais_pkey", "contadores_locais", type_="primary")
    op.create_primary_key(
        "contadores_locais_pkey",
        "contadores_locais",
        ["comercio_id"]
    )

    op.drop_column("contadores_locais", "scope")   
    pass

