"""vamos tentar

Revision ID: 623ce034de46
Revises: 2287e3385f6f
Create Date: 2025-11-17 12:00:00.167372

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '623ce034de46'
down_revision: Union[str, Sequence[str], None] = '2287e3385f6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_cols = {c["name"] for c in inspector.get_columns("movimentacoes")}

    if "estado" not in existing_cols:
        op.add_column(
            "movimentacoes",
            sa.Column("estado", sa.String(length=50), nullable=False, default="aberta"),
        )
        op.create_check_constraint(
            "ck_movimentacoes_estado",
            "movimentacoes",
            "estado IN ('aberta', 'fechada')")

    if "fechado_em" not in existing_cols:
        op.add_column(
            "movimentacoes",
            sa.Column("fechado_em", sa.DateTime(timezone=True), nullable=True),
        )
    
    pass


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_cols = {c["name"] for c in inspector.get_columns("movimentacoes")}

    if "estado" in existing_cols:
        op.drop_constraint(
            "ck_movimentacoes_estado", 
            "movimentacoes", 
            type_="check")
        op.drop_column("movimentacoes", "estado")

    if "fechado_em" in existing_cols:
        op.drop_column("movimentacoes", "fechado_em")
    
    pass
