CREATE TABLE convites (
    id SERIAL PRIMARY KEY,
    id_negocio INTEGER NOT NULL REFERENCES comercios(id),
    link VARCHAR(16) NOT NULL UNIQUE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
);