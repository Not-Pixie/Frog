"""01_create_app_functions

Revision ID: 8403cfcbee61
Revises: d70a08d23020
Create Date: 2025-09-29 12:54:29.509369

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8403cfcbee61'
down_revision: Union[str, Sequence[str], None] = 'd70a08d23020'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
        # app_usuario_id
    op.execute(sa.DDL("""
    CREATE OR REPLACE FUNCTION app_usuario_id() RETURNS integer AS $$
      SELECT (current_setting('app.usuario_id', true))::int;
    $$ LANGUAGE sql STABLE;
    """))

    # fn_set_timestamp
    op.execute(sa.DDL("""
    CREATE OR REPLACE FUNCTION fn_set_timestamp() RETURNS trigger AS $$
    BEGIN
        NEW.atualizado_em := NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """))

    # fn_log_alteracoes
    op.execute(sa.DDL("""
    CREATE OR REPLACE FUNCTION fn_log_alteracoes() RETURNS trigger AS $$
    DECLARE
        usuario_atual INTEGER := COALESCE(app_usuario_id(), 0);
        pk_col TEXT;
        rec_id TEXT;
    BEGIN
        SELECT a.attname INTO pk_col
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = TG_RELID AND i.indisprimary
        LIMIT 1;

        IF TG_OP = 'UPDATE' THEN
            IF pk_col IS NOT NULL THEN
                EXECUTE format('SELECT ($1).%%I::text', pk_col) INTO rec_id USING OLD;
            END IF;
            INSERT INTO logs(
                tabela_nome,
                record_id,
                operacao,
                alterado_por,
                antigo_dado,
                novo_dado
            ) VALUES (
                TG_TABLE_NAME,
                rec_id,
                TG_OP,
                usuario_atual,
                to_jsonb(OLD),
                to_jsonb(NEW)
            );
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            IF pk_col IS NOT NULL THEN
                EXECUTE format('SELECT ($1).%%I::text', pk_col) INTO rec_id USING OLD;
            END IF;
            INSERT INTO logs(
                tabela_nome,
                record_id,
                operacao,
                alterado_por,
                antigo_dado,
                novo_dado
            ) VALUES (
                TG_TABLE_NAME,
                rec_id,
                TG_OP,
                usuario_atual,
                to_jsonb(OLD),
                NULL
            );
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END;
    $$ LANGUAGE plpgsql;
    """))
    pass


def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS fn_log_alteracoes();")
    op.execute("DROP FUNCTION IF EXISTS fn_set_timestamp();")
    op.execute("DROP FUNCTION IF EXISTS app_usuario_id();")
    pass
