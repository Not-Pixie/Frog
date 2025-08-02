CREATE OR REPLACE FUNCTION fn_set_timestamp() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION fn_log_updates() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO change_log(table_name, record_id, operation, changed_by, old_data, new_data)
        VALUES (
            TG_TABLE_NAME,
            COALESCE(OLD.id, NEW.id),
            TG_OP,
            NULL,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO change_log(table_name, record_id, operation, changed_by, old_data, new_data)
        VALUES (
            TG_TABLE_NAME,
            OLD.id,
            TG_OP,
            NULL,
            to_jsonb(OLD),
            NULL
        );
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;