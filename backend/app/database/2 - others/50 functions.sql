CREATE OR REPLACE FUNCTION app_usuario_id() RETURNS integer AS $$
  SELECT (current_setting('app.usuario_id', true))::int;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION fn_set_timestamp() RETURNS trigger AS $$
BEGIN
    NEW.atualizado_em := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION fn_log_alteracoes() RETURNS trigger AS $$
DECLARE
    usuario_atual INTEGER := COALESCE(app_usuario_id(), 0);
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO logs(
            tabela_nome,
            record_id,
            operacao,
            alterado_por,
            antigo_dado,
            novo_dado
        ) VALUES (
            TG_TABLE_NAME,
            COALESCE(OLD.id, NEW.id),
            TG_OP,
            usuario_atual,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO logs(
            tabela_nome,
            record_id,
            operacao,
            alterado_por,
            antigo_dado,
            novo_dado
        ) VALUES (
            TG_TABLE_NAME,
            OLD.id,
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