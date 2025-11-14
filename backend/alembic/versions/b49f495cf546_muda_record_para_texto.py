"""Muda record para texto

Revision ID: b49f495cf546
Revises: e42402e034ca
Create Date: 2025-11-14 20:27:00.054282

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b49f495cf546'
down_revision: Union[str, Sequence[str], None] = 'e42402e034ca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            -- garante que a coluna exista antes de tentar alterar (proteção adicional)
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'logs' AND column_name = 'record_id'
                ) THEN
                    ALTER TABLE logs
                    ALTER COLUMN record_id TYPE text
                    USING record_id::text;
                END IF;
            END$$;
            """
        )
    )

    pass


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'logs' AND column_name = 'record_id'
                ) THEN
                    ALTER TABLE logs
                    ALTER COLUMN record_id TYPE integer
                    USING (
                        CASE
                            WHEN record_id ~ '^\d+$' THEN record_id::integer
                            ELSE NULL
                        END
                    );
                END IF;
            END$$;
            """
        )
    )
    pass
