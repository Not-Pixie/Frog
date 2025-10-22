"""Remove coluna 'codigo' da tabela produtos.

Revision ID: 9fb5724be6e9
Revises: 86c58d505e97
Create Date: 2025-10-20 14:41:21.215890

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9fb5724be6e9'
down_revision: Union[str, Sequence[str], None] = '86c58d505e97'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('produtos', 'codigo')
    pass


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('produtos',
        sa.Column('codigo', sa.String(50), nullable=False)
    )
    
    # Recria a constraint UNIQUE na coluna codigo
    op.create_unique_constraint(None, 'produtos', ['codigo'])
    pass
