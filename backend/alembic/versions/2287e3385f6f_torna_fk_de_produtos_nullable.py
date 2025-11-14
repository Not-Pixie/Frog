"""Torna fk de produtos nullable

Revision ID: 2287e3385f6f
Revises: b49f495cf546
Create Date: 2025-11-14 21:33:54.183034

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2287e3385f6f'
down_revision: Union[str, Sequence[str], None] = 'b49f495cf546'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _drop_fk_for_column(bind, table_name: str, column_name: str):
    """
    Busca e remove a constraint FK que referencia a coluna column_name na tabela table_name.
    """
    sql = f"""
    DO $$
    DECLARE
      cname text;
    BEGIN
      SELECT con.conname INTO cname
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord) ON true
      JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = k.attnum
      WHERE con.contype = 'f' AND rel.relname = '{table_name}' AND att.attname = '{column_name}'
      LIMIT 1;

      IF cname IS NOT NULL THEN
        EXECUTE format('ALTER TABLE {0} DROP CONSTRAINT %I', cname);
      END IF;
    END
    $$;
    """
    bind.execute(sa.text(sql))

def upgrade() -> None:
    op.drop_constraint("fk_produtos_categoria_id", "produtos", type_="foreignkey", if_exists=True)
    op.drop_constraint("fk_produtos_fornecedor_id", "produtos", type_="foreignkey", if_exists=True)

    # Tornar colunas nullable
    op.alter_column("produtos", "categoria_id", existing_type=sa.Integer(), nullable=True)
    op.alter_column("produtos", "fornecedor_id", existing_type=sa.Integer(), nullable=True)

    # Criar novas FKs com ON DELETE SET NULL
    op.create_foreign_key(
        "fk_produtos_categoria_id",
        "produtos", "categorias",
        local_cols=["categoria_id"],
        remote_cols=["categoria_id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_produtos_fornecedor_id",
        "produtos", "fornecedores",
        local_cols=["fornecedor_id"],
        remote_cols=["fornecedor_id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    bind = op.get_bind()

    # Validar se há NULLs antes de reverter
    res = bind.execute(sa.text("SELECT COUNT(*) FROM produtos WHERE categoria_id IS NULL OR fornecedor_id IS NULL;")).scalar()
    if res > 0:
        raise RuntimeError("Downgrade abortado: existem produtos com categoria_id ou fornecedor_id IS NULL.")

    # Drop FKs
    op.drop_constraint("fk_produtos_categoria_id", "produtos", type_="foreignkey")
    op.drop_constraint("fk_produtos_fornecedor_id", "produtos", type_="foreignkey")

    # Tornar NOT NULL
    op.alter_column("produtos", "categoria_id", existing_type=sa.Integer(), nullable=False)
    op.alter_column("produtos", "fornecedor_id", existing_type=sa.Integer(), nullable=False)

    # Recriar FKs com RESTRICT
    op.create_foreign_key(
        "fk_produtos_categoria_id",
        "produtos", "categorias",
        local_cols=["categoria_id"],
        remote_cols=["categoria_id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_produtos_fornecedor_id",
        "produtos", "fornecedores",
        local_cols=["fornecedor_id"],
        remote_cols=["fornecedor_id"],
        ondelete="RESTRICT",
    )
