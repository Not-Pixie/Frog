"""Adiciona limite mínimo a produtos

Revision ID: fe9ad05bbe3f
Revises: e4366df50c6f
Create Date: 2025-11-24 11:51:14.342537

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fe9ad05bbe3f'
down_revision: Union[str, Sequence[str], None] = 'e4366df50c6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
