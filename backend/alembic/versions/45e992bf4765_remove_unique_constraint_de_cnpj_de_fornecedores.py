"""remove unique constraint de cnpj de fornecedores

Revision ID: 45e992bf4765
Revises: 987d937e798f
Create Date: 2025-11-08 16:47:04.886277

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '45e992bf4765'
down_revision: Union[str, Sequence[str], None] = '987d937e798f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    try:
        op.drop_constraint('fornecedores_cnpj_key', 'fornecedores', type_='unique')
    except Exception:
        pass



def downgrade():
    op.create_unique_constraint('fornecedores_cnpj_key', 'fornecedores', ['cnpj'])