"""acorrige constraint de scope em contadores locais

Revision ID: f6ed5ed47182
Revises: ea9d365011aa
Create Date: 2025-11-03 10:59:18.084808

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6ed5ed47182'
down_revision: Union[str, Sequence[str], None] = 'ea9d365011aa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        try:
            op.drop_constraint('ck_contadores_scope_allowed', 'contadores_locais', type_='check')
        except Exception:
            pass

    op.create_check_constraint(
        'ck_contadores_scope_allowed',
        'contadores_locais',
        sa.text(
            "scope IN ("
            "'produtos',"
            "'fornecedores',"
            "'categorias',"
            "'unidade_medidas'"
            ")"
        )
    )
    pass


def downgrade() -> None:
    with op.get_context().autocommit_block():
        try:
            op.drop_constraint('ck_contadores_scope_allowed', 'contadores_locais', type_='check')
        except Exception:
            pass

    op.create_check_constraint(
        'ck_contadores_scope_allowed',
        'contadores_locais',
        sa.text(
            "scope IN ("
            "'produto','fornecedor','categoria','unidade_medidas'"
            ")"
        )
    )
    pass
