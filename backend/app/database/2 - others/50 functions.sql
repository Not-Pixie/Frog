CREATE OR REPLACE FUNCTION fn_set_timestamp() RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_log_updates() RETURNS TRIGGER AS $$
DECLARE
    usuario_atual INTEGER := current_setting('app.usuario_id', true)::INTEGER;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO logs(tabela_nome, record_id, operacao, alterado_por, antigo_dado, novo_dado)
        VALUES (
            TG_TABLE_NAME,
            COALESCE(OLD.id, NEW.id),
            TG_OP,
            usuario_atual,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO logs(tabela_nome, record_id, operacao, alterado_por, antigo_dado, novo_dado)
        VALUES (
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
