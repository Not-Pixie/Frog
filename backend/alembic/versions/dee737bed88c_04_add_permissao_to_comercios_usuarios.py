"""04_add_permissao_to_comercios_usuarios

Revision ID: dee737bed88c
Revises: 1322944f6493
Create Date: 2025-09-29 08:51:03.358322

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dee737bed88c'
down_revision: Union[str, Sequence[str], None] = '479411710663'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
        op.add_column(
        "comercios_usuarios",
        sa.Column("permissao", sa.String(length=50), nullable=True)
    )
        pass


def downgrade() -> None:
    op.drop_column("comercios_usuarios", "permissao")
    pass
