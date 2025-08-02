-- timestamps
CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp();

CREATE TRIGGER set_timestamp_email
BEFORE UPDATE ON email
FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp();

CREATE TRIGGER set_timestamp_business
BEFORE UPDATE ON business
FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp();

-- logging 
CREATE TRIGGER trg_users_changes
AFTER UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION fn_log_updates();

CREATE TRIGGER trg_email_changes
AFTER UPDATE OR DELETE ON email
FOR EACH ROW EXECUTE FUNCTION fn_log_updates();

CREATE TRIGGER trg_business_changes
AFTER UPDATE OR DELETE ON business
FOR EACH ROW EXECUTE FUNCTION fn_log_updates();