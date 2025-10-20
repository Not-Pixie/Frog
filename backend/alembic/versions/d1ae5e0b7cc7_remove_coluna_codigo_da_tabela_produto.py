"""Remove coluna 'codigo' da tabela produto.

Revision ID: d1ae5e0b7cc7
Revises: 9fb5724be6e9
Create Date: 2025-10-20 23:10:26.109664

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1ae5e0b7cc7'
down_revision: Union[str, Sequence[str], None] = '9fb5724be6e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('produtos', 'codigo')
    pass


def downgrade() -> None:
    op.add_column('produtos', sa.Column('codigo', sa.String(length=50), unique=True, nullable=False))
    pass
