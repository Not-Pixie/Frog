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
FOR EACH ROW EXECUTE FUNCTION fn_log_alteracoes();

CREATE TRIGGER trg_log_comercios
AFTER UPDATE OR DELETE ON comercios
FOR EACH ROW EXECUTE FUNCTION fn_log_alteracoes();

CREATE TRIGGER trg_log_convites
AFTER UPDATE OR DELETE ON convites
FOR EACH ROW EXECUTE FUNCTION fn_log_alteracoes();

-- crud
CREATE TRIGGER trg_fornecedor_changes
AFTER UPDATE OR DELETE ON fornecedores
FOR EACH ROW EXECUTE FUNCTION fn_log_alteracoes();

CREATE TRIGGER trg_produto_changes
AFTER UPDATE OR DELETE ON produtos
FOR EACH ROW EXECUTE FUNCTION fn_log_alteracoes();