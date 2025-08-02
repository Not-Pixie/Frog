CREATE TABLE business (
    id              SERIAL PRIMARY KEY,
    creator_id      INTEGER         NOT NULL REFERENCES users(id),
    name            VARCHAR(255)    NOT NULL UNIQUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);