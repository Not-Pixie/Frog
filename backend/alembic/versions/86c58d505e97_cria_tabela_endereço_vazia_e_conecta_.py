"""cria tabela enderecos e conecta com fornecedores

Revision ID: 86c58d505e97
Revises: 1975711c13f0
Create Date: 2025-10-20 11:07:40.623286

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '86c58d505e97'
down_revision: Union[str, Sequence[str], None] = '1975711c13f0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # 1) Criar tabela enderecos
    op.create_table(
        'enderecos',
        sa.Column('endereco_id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column('cep', sa.String(length=9), nullable=False),
        sa.Column('logradouro', sa.String(length=200), nullable=True),
        sa.Column('numero', sa.String(length=20), nullable=True),
        sa.Column('complemento', sa.String(length=50), nullable=True),
        sa.Column('bairro', sa.String(length=100), nullable=True),
        sa.Column('cidade', sa.String(length=100), nullable=True),
        sa.Column('estado', sa.String(length=2), nullable=True),
        sa.Column('pais', sa.String(length=64), nullable=False, server_default=sa.text("'BR'")),
        sa.Column('status', sa.String(length=20), nullable=False, server_default=sa.text("'placeholder'")),
        sa.Column('source', sa.String(length=20), nullable=False, server_default=sa.text("'user'")),
        sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('atualizado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # índice para buscas por CEP
    op.create_index(op.f('ix_enderecos_cep'), 'enderecos', ['cep'])

    # 2) Adicionar coluna endereco_id em fornecedores
    op.add_column('fornecedores', sa.Column('endereco_id', sa.Integer(), nullable=True))

    # 3) Criar FK fornecedores.endereco_id -> enderecos.endereco_id
    op.create_foreign_key(
        "fk_fornecedores_endereco_id",
        "fornecedores",
        "enderecos",
        ['endereco_id'],
        ['endereco_id'],
        ondelete="SET NULL"
    )

    op.create_index(op.f('ix_fornecedores_endereco_id'), 'fornecedores', ['endereco_id'])

    # 4) Criar triggers condicionais usando as funções que você forneceu:
    #    - public.fn_set_timestamp  (esperado: FUNCTION RETURNS trigger)
    #    - public.fn_log_alteracoes (esperado: FUNCTION RETURNS trigger)
    #
    #    Se as funções não existirem, os DO blocks NÃO criarão os triggers (evita falha da migration).

    # trigger para atualizar timestamps antes de UPDATE (usando fn_set_timestamp)
    op.execute("""
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'fn_set_timestamp' AND n.nspname = 'public'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      WHERE t.tgname = 'trg_enderecos_set_timestamp' AND c.relname = 'enderecos'
    ) THEN
      EXECUTE 'CREATE TRIGGER trg_enderecos_set_timestamp BEFORE UPDATE ON enderecos FOR EACH ROW EXECUTE FUNCTION public.fn_set_timestamp();';
    END IF;
  END IF;
END;
$$;
""")

    # trigger para log/ audit (após INSERT/UPDATE/DELETE) usando fn_log_alteracoes
    op.execute("""
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'fn_log_alteracoes' AND n.nspname = 'public'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      WHERE t.tgname = 'trg_enderecos_log' AND c.relname = 'enderecos'
    ) THEN
      EXECUTE 'CREATE TRIGGER trg_enderecos_log AFTER INSERT OR UPDATE OR DELETE ON enderecos FOR EACH ROW EXECUTE FUNCTION public.fn_log_alteracoes();';
    END IF;
  END IF;
END;
$$;
""")


def downgrade() -> None:
    """Downgrade schema."""

    # 1) Dropar triggers (se existirem) antes de dropar a tabela
    try:
        op.execute("DROP TRIGGER IF EXISTS trg_enderecos_set_timestamp ON enderecos;")
    except Exception:
        pass

    try:
        op.execute("DROP TRIGGER IF EXISTS trg_enderecos_log ON enderecos;")
    except Exception:
        pass

    # 2) Dropar FK e index, e coluna endereco_id
    try:
        op.drop_constraint('fk_fornecedores_endereco_id', 'fornecedores', type_='foreignkey')
    except Exception:
        pass

    try:
        op.drop_index(op.f('ix_fornecedores_endereco_id'), table_name='fornecedores')
    except Exception:
        pass

    try:
        op.drop_column('fornecedores', 'endereco_id')
    except Exception:
        pass

    # 3) Dropar índice e tabela enderecos
    try:
        op.drop_index(op.f('ix_enderecos_cep'), table_name='enderecos')
    except Exception:
        pass

    op.drop_table('enderecos')
