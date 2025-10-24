"""Arruma policies para novo formato de unidade_medidas

Revision ID: ce51fffa5490
Revises: b41500154f68
Create Date: 2025-10-24 13:38:42.557804

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ce51fffa5490'
down_revision: Union[str, Sequence[str], None] = 'b41500154f68'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1) Make comercio_id nullable
    op.alter_column('unidade_medidas', 'comercio_id',
                    existing_type=sa.INTEGER(),
                    nullable=True)
    
     # 1.5) --- Normalize existing sigla values to lower + trim, but first check for collisions ---
    conn = op.get_bind()

    # detect duplicates that would collide after lowercasing (e.g., 'A' and 'a')
    dup_count = conn.scalar(sa.text(
        "SELECT COUNT(*) FROM ("
        "  SELECT lower(sigla) AS l, COUNT(*) "
        "  FROM unidade_medidas "
        "  WHERE sigla IS NOT NULL "
        "  GROUP BY lower(sigla) "
        "  HAVING COUNT(*) > 1"
        ") t"
    ))

    if dup_count and dup_count > 0:
        # fail early, because the automatic lowercasing would create unique constraint conflicts
        raise sa.exc.OperationalError(
            f"Cannot normalize sigla: found {dup_count} sets of siglas que colidem ao converter para lower(). "
            "Please deduplicate/merge these rows before running the migration."
        )

    # perform normalization (trim + lower) for existing rows
    op.execute(sa.DDL(
        "UPDATE unidade_medidas SET sigla = lower(btrim(sigla)) WHERE sigla IS NOT NULL"
    ))

    # 1.75) Create function + trigger to automatically normalize future inserts/updates
    op.execute(sa.DDL("""
    CREATE OR REPLACE FUNCTION unidade_medidas_normalize_sigla()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF NEW.sigla IS NOT NULL THEN
        NEW.sigla := lower(btrim(NEW.sigla));
      END IF;
      RETURN NEW;
    END;
    $$;
    """))

    op.execute(sa.DDL("""
    CREATE TRIGGER trg_unimed_sigla_normalize
      BEFORE INSERT OR UPDATE ON unidade_medidas
      FOR EACH ROW
      EXECUTE FUNCTION unidade_medidas_normalize_sigla();
    """))

    # 2) Create partial unique indexes using Alembic operations
    op.create_index('ux_unimed_sigla_global',
                    'unidade_medidas',
                    [sa.text('lower(sigla)')],
                    unique=True,
                    postgresql_where=sa.text('comercio_id IS NULL'))

    op.create_index('ux_unimed_comercio_sigla',
                    'unidade_medidas',
                    ['comercio_id', sa.text('lower(sigla)')],
                    unique=True,
                    postgresql_where=sa.text('comercio_id IS NOT NULL'))

    # 3) Enable RLS
    op.execute(sa.DDL("ALTER TABLE unidade_medidas ENABLE ROW LEVEL SECURITY"))

    policies = [
    """CREATE POLICY unidade_medidas_select ON unidade_medidas
       FOR SELECT
       USING (
         comercio_id IS NULL
         OR EXISTS (
           SELECT 1 FROM comercios_usuarios cu
           WHERE cu.comercio_id = unidade_medidas.comercio_id
             AND cu.usuario_id = app_usuario_id()
         )
       )""",

    """CREATE POLICY unidade_medidas_insert ON unidade_medidas
       FOR INSERT
       WITH CHECK (
         -- permite inserir unidades globais (comercio_id IS NULL) ou inserir para um comércio
         -- para inserir em um comércio é necessário ter permissao 'operador' nesse comércio
         comercio_id IS NULL
         OR EXISTS (
           SELECT 1 FROM comercios_usuarios cu
           WHERE cu.comercio_id = unidade_medidas.comercio_id
             AND cu.usuario_id = app_usuario_id()
         )
       )""",

    """CREATE POLICY unidade_medidas_update ON unidade_medidas
       FOR UPDATE
       USING (
         -- para ver a linha atual (e permitir o UPDATE) usuário deve ser membro do comércio ou a unidade ser global
         comercio_id IS NULL
         OR EXISTS (
           SELECT 1 FROM comercios_usuarios cu
           WHERE cu.comercio_id = unidade_medidas.comercio_id
             AND cu.usuario_id = app_usuario_id()
         )
       )
       WITH CHECK (
         -- após o UPDATE o row deve continuar obedecendo: se associar a um comércio, o usuário precisa ser 'operador' nesse comércio
         comercio_id IS NULL
         OR EXISTS (
           SELECT 1 FROM comercios_usuarios cu
           WHERE cu.comercio_id = unidade_medidas.comercio_id
             AND cu.usuario_id = app_usuario_id()
         )
       )""",

    """CREATE POLICY unidade_medidas_delete ON unidade_medidas
       FOR DELETE
       USING (
         -- só pode deletar se for global (NULL) ou se for 'operador' no comércio
         comercio_id IS NULL
         OR EXISTS (
           SELECT 1 FROM comercios_usuarios cu
           WHERE cu.comercio_id = unidade_medidas.comercio_id
             AND cu.usuario_id = app_usuario_id()
             AND cu.permissao = 'operador'
         )
       )"""
]


    for policy in policies:
        op.execute(sa.DDL(policy))


def downgrade():
    policy_names = [
        'unidade_medidas_delete',
        'unidade_medidas_update',
        'unidade_medidas_insert',
        'unidade_medidas_select'
    ]

    for policy_name in policy_names:
        op.execute(sa.DDL(f"DROP POLICY IF EXISTS {policy_name} ON unidade_medidas"))

    # 2) Disable RLS
    op.execute(sa.DDL("ALTER TABLE unidade_medidas DISABLE ROW LEVEL SECURITY"))

    # 3) Drop indexes
    op.drop_index('ux_unimed_comercio_sigla', 'unidade_medidas')
    op.drop_index('ux_unimed_sigla_global', 'unidade_medidas')

    # 4) Drop trigger and function that normalized sigla
    op.execute(sa.DDL("DROP TRIGGER IF EXISTS trg_unimed_sigla_normalize ON unidade_medidas"))
    op.execute(sa.DDL("DROP FUNCTION IF EXISTS unidade_medidas_normalize_sigla()"))

    # 5) Check for null values before making column NOT NULL
    conn = op.get_bind()
    null_count = conn.scalar(
        sa.text("SELECT COUNT(*) FROM unidade_medidas WHERE comercio_id IS NULL")
    )

    if null_count > 0:
        raise sa.exc.OperationalError(
            f"Cannot downgrade: found {null_count} rows with null comercio_id"
        )

    op.alter_column('unidade_medidas', 'comercio_id',
                    existing_type=sa.INTEGER(),
                    nullable=False)