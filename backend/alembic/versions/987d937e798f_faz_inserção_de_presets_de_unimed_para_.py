"""Faz inserção de presets de unimed para tabela

Revision ID: 987d937e798f
Revises: f6ed5ed47182
Create Date: 2025-11-07 01:17:44.333900

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '987d937e798f'
down_revision: Union[str, Sequence[str], None] = 'f6ed5ed47182'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
     # Insere os dados na tabela unidade_medidas
    op.execute("""
        INSERT INTO unidade_medidas (nome, sigla) VALUES
        ('Unidade', 'un'),
        ('Quilograma', 'kg'),
        ('Grama', 'g'),
        ('Litro', 'L'),
        ('Mililitro', 'ml'),
        ('Metro', 'm'),
        ('Centímetro', 'cm'),
        ('Milímetro', 'mm'),
        ('Caixa', 'cx'),
        ('Pacote', 'pct'),
        ('Galão', 'gal'),
        ('Par', 'par'),
        ('Dúzia', 'dz'),
        ('Saco', 'sc')
    """)
    pass


def downgrade() -> None:
    op.execute("""
        DELETE FROM unidade_medidas 
        WHERE sigla IN ('un', 'kg', 'g', 'L', 'ml', 'm', 'cm', 'mm', 'cx', 'pct', 'gal', 'par', 'dz', 'sc')
    """)
    pass
