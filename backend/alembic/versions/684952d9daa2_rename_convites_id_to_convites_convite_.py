"""rename convites.id to convites.convite_id

Revision ID: 684952d9daa2
Revises: fada8cbded5a
Create Date: 2025-10-12 18:06:45.859709

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '684952d9daa2'
down_revision: Union[str, Sequence[str], None] = 'fada8cbded5a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
