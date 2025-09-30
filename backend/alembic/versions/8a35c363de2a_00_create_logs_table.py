"""00_create_logs_table

Revision ID: 8a35c363de2a
Revises: 1322944f6493
Create Date: 2025-09-29 07:54:34.881923

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8a35c363de2a'
down_revision: Union[str, Sequence[str], None] = 'fc8112dd25bd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    from sqlalchemy import inspect
    inspector = inspect(conn)
    if not inspector.has_table("logs"):
        op.create_table(
            "logs",
            sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
            sa.Column("tabela_nome", sa.Text(), nullable=False),
            sa.Column("record_id", sa.Text(), nullable=True),
            sa.Column("operacao", sa.Text(), nullable=False),
            sa.Column("alterado_por", sa.Integer(), nullable=True),
            sa.Column("antigo_dado", sa.JSON(), nullable=True),
            sa.Column("novo_dado", sa.JSON(), nullable=True),
            sa.Column("criado_em", sa.TIMESTAMP(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        )
        pass


def downgrade() -> None:
    op.execute(sa.text("DROP TABLE IF EXISTS logs"))
    pass
