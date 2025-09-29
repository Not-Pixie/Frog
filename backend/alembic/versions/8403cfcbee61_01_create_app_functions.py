"""01_create_app_functions

Revision ID: 8403cfcbee61
Revises: d70a08d23020
Create Date: 2025-09-29 12:54:29.509369

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8403cfcbee61'
down_revision: Union[str, Sequence[str], None] = 'd70a08d23020'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
