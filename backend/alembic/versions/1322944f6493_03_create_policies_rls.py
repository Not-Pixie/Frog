"""03_create_policies_rls

Revision ID: 1322944f6493
Revises: 479411710663
Create Date: 2025-09-27 11:12:08.983501

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1322944f6493'
down_revision: Union[str, Sequence[str], None] = 'dee737bed88c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Comercios
    op.execute("ALTER TABLE IF EXISTS comercios ENABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY IF EXISTS comercios_select ON comercios;")
    op.execute(sa.DDL("""
    CREATE POLICY comercios_select ON comercios
      FOR SELECT
      USING (
        proprietario_id = app_usuario_id()
        OR EXISTS (
          SELECT 1 FROM comercios_usuarios cu 
          WHERE cu.comercio_id = comercios.comercio_id 
            AND cu.usuario_id = app_usuario_id()
        )
      );
    """))

    op.execute("DROP POLICY IF EXISTS comercios_update ON comercios;")
    op.execute(sa.DDL("""
    CREATE POLICY comercios_update ON comercios
      FOR UPDATE
      USING (
        proprietario_id = app_usuario_id()
        OR EXISTS (
          SELECT 1 FROM comercios_usuarios cu 
          WHERE cu.comercio_id = comercios.comercio_id 
            AND cu.usuario_id = app_usuario_id()
            AND cu.permissao IN ('operador')
        )
      )
      WITH CHECK (
        proprietario_id = app_usuario_id()
        OR EXISTS (
          SELECT 1 FROM comercios_usuarios cu 
          WHERE cu.comercio_id = comercios.comercio_id 
            AND cu.usuario_id = app_usuario_id()
            AND cu.permissao IN ('operador')
        )
      );
    """))

    op.execute("DROP POLICY IF EXISTS comercios_insert ON comercios;")
    op.execute(sa.DDL("""
    CREATE POLICY comercios_insert ON comercios
      FOR INSERT
      WITH CHECK (proprietario_id = app_usuario_id());
    """))

    # comercios_usuarios (associação n-n)
    op.execute("ALTER TABLE IF EXISTS comercios_usuarios ENABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY IF EXISTS comercios_usuarios_select ON comercios_usuarios;")
    op.execute(sa.DDL("""
    CREATE POLICY comercios_usuarios_select ON comercios_usuarios
      FOR SELECT
      USING (
        usuario_id = app_usuario_id()
        OR EXISTS (
          SELECT 1 FROM comercios_usuarios cu2
          WHERE cu2.comercio_id = comercios_usuarios.comercio_id
            AND cu2.usuario_id = app_usuario_id()
            AND cu2.permissao IN ('operador')
        )
      );
    """))

    op.execute("DROP POLICY IF EXISTS comercios_usuarios_manage ON comercios_usuarios;")
    op.execute(sa.DDL("""
    CREATE POLICY comercios_usuarios_manage ON comercios_usuarios
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM comercios_usuarios cu2
          WHERE cu2.comercio_id = comercios_usuarios.comercio_id
            AND cu2.usuario_id = app_usuario_id()
            AND cu2.permissao = 'operador'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM comercios_usuarios cu2
          WHERE cu2.comercio_id = comercios_usuarios.comercio_id
            AND cu2.usuario_id = app_usuario_id()
            AND cu2.permissao = 'operador'
        )
      );
    """))

    # produtos
    op.execute("ALTER TABLE IF EXISTS produtos ENABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY IF EXISTS produtos_select ON produtos;")
    op.execute(sa.DDL("""
    CREATE POLICY produtos_select ON produtos
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM comercios_usuarios cu
          WHERE cu.comercio_id = produtos.comercio_id
            AND cu.usuario_id = app_usuario_id()
        )
      );
    """))

    op.execute("DROP POLICY IF EXISTS produtos_update ON produtos;")
    op.execute(sa.DDL("""
    CREATE POLICY produtos_update ON produtos
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM comercios_usuarios cu
          WHERE cu.comercio_id = produtos.comercio_id
            AND cu.usuario_id = app_usuario_id()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM comercios_usuarios cu
          WHERE cu.comercio_id = produtos.comercio_id
            AND cu.usuario_id = app_usuario_id()
        )
      );
    """))

    op.execute("DROP POLICY IF EXISTS produtos_insert ON produtos;")
    op.execute(sa.DDL("""
    CREATE POLICY produtos_insert ON produtos
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM comercios_usuarios cu
          WHERE cu.comercio_id = produtos.comercio_id
            AND cu.usuario_id = app_usuario_id()
        )
      );
    """))

    # convites
    op.execute("ALTER TABLE IF EXISTS convites ENABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY IF EXISTS convites_select ON convites;")
    op.execute(sa.DDL("""
    CREATE POLICY convites_select ON convites
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM comercios_usuarios cu
          WHERE cu.comercio_id = convites.comercio_id
            AND cu.usuario_id = app_usuario_id()
        )
      );
    """))

    op.execute("DROP POLICY IF EXISTS convites_insert ON convites;")
    op.execute(sa.DDL("""
    CREATE POLICY convites_insert ON convites
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM comercios_usuarios cu
          WHERE cu.comercio_id = convites.comercio_id
            AND cu.usuario_id = app_usuario_id()
            AND cu.permissao IN ('operador')
        )
      );
    """))
    pass


def downgrade() -> None:
    # convites
    op.execute("DROP POLICY IF EXISTS convites_insert ON convites;")
    op.execute("DROP POLICY IF EXISTS convites_select ON convites;")
    op.execute("ALTER TABLE IF EXISTS convites DISABLE ROW LEVEL SECURITY;")

    # produtos
    op.execute("DROP POLICY IF EXISTS produtos_insert ON produtos;")
    op.execute("DROP POLICY IF EXISTS produtos_update ON produtos;")
    op.execute("DROP POLICY IF EXISTS produtos_select ON produtos;")
    op.execute("ALTER TABLE IF EXISTS produtos DISABLE ROW LEVEL SECURITY;")

    # comercios_usuarios
    op.execute("DROP POLICY IF EXISTS comercios_usuarios_manage ON commercios_usuarios;")
    op.execute("DROP POLICY IF EXISTS comercios_usuarios_select ON comercios_usuarios;")
    op.execute("ALTER TABLE IF EXISTS comercios_usuarios DISABLE ROW LEVEL SECURITY;")

    # comercios
    op.execute("DROP POLICY IF EXISTS comercios_insert ON comercios;")
    op.execute("DROP POLICY IF EXISTS comercios_update ON comercios;")
    op.execute("DROP POLICY IF EXISTS comercios_select ON comercios;")
    op.execute("ALTER TABLE IF EXISTS comercios DISABLE ROW LEVEL SECURITY;")

    pass
