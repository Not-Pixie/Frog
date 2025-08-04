CREATE TABLE usuario (
    id              SERIAL PRIMARY KEY,
    email_id        INTEGER UNIQUE REFERENCES email(id),
    nome_completo       VARCHAR(255)    NOT NULL,
    senha_hash   TEXT            NOT NULL,
    criado_em      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    atualizado_em      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);