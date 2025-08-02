CREATE TABLE change_log (
    id              SERIAL PRIMARY KEY,
    table_name      VARCHAR(100)    NOT NULL,
    record_id       INTEGER         NOT NULL,
    operation       VARCHAR(10)     NOT NULL,
    changed_by      INTEGER         REFERENCES users(id),
    changed_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    old_data        JSONB,
    new_data        JSONB
);