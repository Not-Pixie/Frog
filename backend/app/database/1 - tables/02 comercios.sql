CREATE TABLE comercios (
    comercio_id SERIAL PRIMARY KEY,
    proprietario_id INTEGER NOT NULL REFERENCES usuarios(usuario_id),
	configuracoes_comercio_id INTEGER NOT NULL REFERENCES configuracoes_comercio(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL UNIQUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS comercios ENABLE ROW LEVEL SECURITY;