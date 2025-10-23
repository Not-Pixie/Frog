"""cria contadores locais

Revision ID: 1f5e82c9f9f4
Revises: f96d0711730f
Create Date: 2025-10-23 17:17:54.147668

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1f5e82c9f9f4'
down_revision: Union[str, Sequence[str], None] = 'f96d0711730f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "contadores_locais",
        sa.Column("comercio_id", sa.Integer(), sa.ForeignKey("comercios.comercio_id", ondelete="CASCADE"), primary_key=True),
        sa.Column("ultimo_codigo", sa.Integer(), nullable=False, server_default="0"),
    )

    # 2) garante unique (comercio_id, codigo) em produtos
    op.create_unique_constraint("produtos_comercio_codigo_key", "produtos", ["comercio_id", "codigo"])

    # 3) backfill: popula contadores_locais com MAX(codigo) atual por comercio (se já houver produtos)
    conn = op.get_bind()
    conn.execute(sa.text("""
        INSERT INTO contadores_locais (comercio_id, ultimo_codigo)
        SELECT comercio_id, COALESCE(MAX(codigo), 0) as ultimo_codigo
        FROM produtos
        GROUP BY comercio_id
        ON CONFLICT (comercio_id) DO NOTHING
    """))
    pass


def downgrade() -> None:
    op.drop_constraint("produtos_comercio_codigo_key", "produtos", type_="unique")
    op.drop_table("contadores_locais")
    pass
