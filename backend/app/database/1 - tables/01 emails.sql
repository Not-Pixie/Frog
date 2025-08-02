CREATE TABLE email (
    id              SERIAL PRIMARY KEY,
    address         VARCHAR(255)    NOT NULL UNIQUE,
    is_verified     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);