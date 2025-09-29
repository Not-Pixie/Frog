"""03_create_policies_rls

Revision ID: fada8cbded5a
Revises: 1de462319142
Create Date: 2025-09-29 12:54:42.585469

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fada8cbded5a'
down_revision: Union[str, Sequence[str], None] = '1de462319142'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
