CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email_id        INTEGER UNIQUE REFERENCES email(id),
    full_name       VARCHAR(255)    NOT NULL,
    password_hash   TEXT            NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);