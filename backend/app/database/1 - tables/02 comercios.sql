CREATE TABLE comercios (
    comercio_id SERIAL PRIMARY KEY,
    proprietario_id INTEGER NOT NULL REFERENCES usuarios(usuario_id),
    nome VARCHAR(255) NOT NULL UNIQUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
)