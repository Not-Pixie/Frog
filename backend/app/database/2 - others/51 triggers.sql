usuario_atual := current_setting('app.usuario_id', true)::INTEGER;
usuario_atual := COALESCE(usuario_atual, 0);

-- Triggers de timestamp automático
CREATE TRIGGER trg_set_timestamp_usuarios
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp();

CREATE TRIGGER trg_set_timestamp_comercios
BEFORE UPDATE ON comercios
FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp();

CREATE TRIGGER trg_set_timestamp_convites
BEFORE UPDATE ON convites
FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp();

-- Triggers de log de alterações
CREATE TRIGGER trg_log_usuarios
AFTER UPDATE OR DELETE ON usuarios
FOR EACH ROW EXECUTE FUNCTION fn_log_updates();

CREATE TRIGGER trg_log_comercios
AFTER UPDATE OR DELETE ON comercios
FOR EACH ROW EXECUTE FUNCTION fn_log_updates();

CREATE TRIGGER trg_log_convites
AFTER UPDATE OR DELETE ON convites
FOR EACH ROW EXECUTE FUNCTION fn_log_updates();
