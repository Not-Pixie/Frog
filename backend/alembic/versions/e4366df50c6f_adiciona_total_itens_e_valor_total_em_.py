"""Adiciona total_itens e valor_total em movimentacoes

Revision ID: e4366df50c6f
Revises: c76d30e3d2b0
Create Date: 2025-11-24 11:13:43.377802

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'e4366df50c6f'
down_revision: Union[str, Sequence[str], None] = 'c76d30e3d2b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1) Add coluna total_itens 
    op.add_column(
        "movimentacoes",
        sa.Column(
            "total_itens",
            postgresql.INTEGER(),
            server_default=sa.text("0"),
            nullable=True,
        ),
    )

    op.execute("UPDATE movimentacoes SET total_itens = 0 WHERE total_itens IS NULL")

    op.alter_column(
        "movimentacoes",
        "total_itens",
        existing_type=postgresql.INTEGER(),
        nullable=False,
        server_default=None,
        existing_server_default=sa.text("0"),
    )

    # 2) Alterar tipo de valor_total
    op.alter_column(
        "movimentacoes",
        "valor_total",
        existing_type=sa.Numeric(precision=12, scale=4),
        type_=postgresql.NUMERIC(precision=18, scale=4),
        existing_nullable=False,
    )



def downgrade() -> None:
    # 1) Reverte o tipo de valor_total para NUMERIC(12,4)
    op.alter_column(
        "movimentacoes",
        "valor_total",
        existing_type=postgresql.NUMERIC(precision=18, scale=4),
        type_=sa.NUMERIC(precision=12, scale=4),
        existing_nullable=False,
    )

    # 2) Remove a coluna total_itens
    op.drop_column("movimentacoes", "total_itens")