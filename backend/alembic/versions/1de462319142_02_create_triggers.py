"""02_create_triggers

Revision ID: 1de462319142
Revises: 8403cfcbee61
Create Date: 2025-09-29 12:54:36.136807

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1de462319142'
down_revision: Union[str, Sequence[str], None] = '8403cfcbee61'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
        # Triggers de timestamp automático
    op.execute(sa.DDL("""
    CREATE TRIGGER trg_set_timestamp_usuarios
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp();
    """))

    op.execute(sa.DDL("""
    CREATE TRIGGER trg_set_timestamp_comercios
    BEFORE UPDATE ON comercios
    FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp();
    """))

    op.execute(sa.DDL("""
    CREATE TRIGGER trg_set_timestamp_convites
    BEFORE UPDATE ON convites
    FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp();
    """))

    # Triggers de log de alterações (UPDATE e DELETE)
    op.execute(sa.DDL("""
    CREATE TRIGGER trg_log_usuarios
    AFTER UPDATE OR DELETE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_log_alteracoes();
    """))

    op.execute(sa.DDL("""
    CREATE TRIGGER trg_log_comercios
    AFTER UPDATE OR DELETE ON comercios
    FOR EACH ROW EXECUTE FUNCTION fn_log_alteracoes();
    """))

    op.execute(sa.DDL("""
    CREATE TRIGGER trg_log_convites
    AFTER UPDATE OR DELETE ON convites
    FOR EACH ROW EXECUTE FUNCTION fn_log_alteracoes();
    """))

    # CRUD logs para outros recursos
    op.execute(sa.DDL("""
    CREATE TRIGGER trg_fornecedor_changes
    AFTER UPDATE OR DELETE ON fornecedores
    FOR EACH ROW EXECUTE FUNCTION fn_log_alteracoes();
    """))

    op.execute(sa.DDL("""
    CREATE TRIGGER trg_produto_changes
    AFTER UPDATE OR DELETE ON produtos
    FOR EACH ROW EXECUTE FUNCTION fn_log_alteracoes();
    """))
    
    op.execute(sa.DDL("""
    CREATE TRIGGER trg_check_max_comercios
    BEFORE INSERT ON comercios
    FOR EACH ROW
    EXECUTE FUNCTION check_max_comercios_for_user();
    """))
    pass


def downgrade() -> None:
        # remove triggers (IF EXISTS para segurança)
    op.execute("DROP TRIGGER IF EXISTS trg_produto_changes ON produtos;")
    op.execute("DROP TRIGGER IF EXISTS trg_fornecedor_changes ON fornecedores;")
    op.execute("DROP TRIGGER IF EXISTS trg_log_convites ON convites;")
    op.execute("DROP TRIGGER IF EXISTS trg_log_comercios ON comercios;")
    op.execute("DROP TRIGGER IF EXISTS trg_log_usuarios ON usuarios;")
    op.execute("DROP TRIGGER IF EXISTS trg_set_timestamp_convites ON convites;")
    op.execute("DROP TRIGGER IF EXISTS trg_set_timestamp_comercios ON comercios;")
    op.execute("DROP TRIGGER IF EXISTS trg_set_timestamp_usuarios ON usuarios;")
    op.execute("DROP TRIGGER IF EXISTS trg_check_max_comercios ON comercios;")
    pass
