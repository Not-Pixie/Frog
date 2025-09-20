CREATE TABLE convites (
    id SERIAL PRIMARY KEY,
    comercio_id INTEGER NOT NULL REFERENCES comercios(comercio_id),
    link VARCHAR(16) NOT NULL UNIQUE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
