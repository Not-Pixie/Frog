"""02_create_triggers

Revision ID: 479411710663
Revises: b0c6690d878d
Create Date: 2025-09-27 11:11:51.587928

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '479411710663'
down_revision: Union[str, Sequence[str], None] = 'fc77bd603db4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
        # timestamp triggers: dropar se existirem e criar
    op.execute("DROP TRIGGER IF EXISTS trg_set_timestamp_usuarios ON usuarios;")
    op.execute(sa.DDL("""
    CREATE TRIGGER trg_set_timestamp_usuarios
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp();
    """))

    op.execute("DROP TRIGGER IF EXISTS trg_set_timestamp_comercios ON comercios;")
    op.execute(sa.DDL("""
    CREATE TRIGGER trg_set_timestamp_comercios
    BEFORE UPDATE ON comercios
    FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp();
    """))

    op.execute("DROP TRIGGER IF EXISTS trg_set_timestamp_convites ON convites;")
    op.execute(sa.DDL("""
    CREATE TRIGGER trg_set_timestamp_convites
    BEFORE UPDATE ON convites
    FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp();
    """))

    # log triggers: dropar e criar
    op.execute("DROP TRIGGER IF EXISTS trg_log_usuarios ON usuarios;")
    op.execute(sa.DDL("""
    CREATE TRIGGER trg_log_usuarios
    AFTER UPDATE OR DELETE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_log_alteracoes();
    """))

    op.execute("DROP TRIGGER IF EXISTS trg_log_comercios ON comercios;")
    op.execute(sa.DDL("""
    CREATE TRIGGER trg_log_comercios
    AFTER UPDATE OR DELETE ON comercios
    FOR EACH ROW EXECUTE FUNCTION fn_log_alteracoes();
    """))

    op.execute("DROP TRIGGER IF EXISTS trg_log_convites ON convites;")
    op.execute(sa.DDL("""
    CREATE TRIGGER trg_log_convites
    AFTER UPDATE OR DELETE ON convites
    FOR EACH ROW EXECUTE FUNCTION fn_log_alteracoes();
    """))

    # outras tabelas que usam o mesmo logger
    op.execute("DROP TRIGGER IF EXISTS trg_fornecedor_changes ON fornecedores;")
    op.execute(sa.DDL("""
    CREATE TRIGGER trg_fornecedor_changes
    AFTER UPDATE OR DELETE ON fornecedores
    FOR EACH ROW EXECUTE FUNCTION fn_log_alteracoes();
    """))

    op.execute("DROP TRIGGER IF EXISTS trg_produto_changes ON produtos;")
    op.execute(sa.DDL("""
    CREATE TRIGGER trg_produto_changes
    AFTER UPDATE OR DELETE ON produtos
    FOR EACH ROW EXECUTE FUNCTION fn_log_alteracoes();
    """))

    pass


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_set_timestamp_usuarios ON usuarios;")
    op.execute("DROP TRIGGER IF EXISTS trg_set_timestamp_comercios ON comercios;")
    op.execute("DROP TRIGGER IF EXISTS trg_set_timestamp_convites ON convites;")

    op.execute("DROP TRIGGER IF EXISTS trg_log_usuarios ON usuarios;")
    op.execute("DROP TRIGGER IF EXISTS trg_log_comercios ON comercios;")
    op.execute("DROP TRIGGER IF EXISTS trg_log_convites ON convites;")

    op.execute("DROP TRIGGER IF EXISTS trg_fornecedor_changes ON fornecedores;")
    op.execute("DROP TRIGGER IF EXISTS trg_produto_changes ON produtos;")
    pass
