CREATE TABLE comercios_usuarios (
    id SERIAL PRIMARY KEY,
    comercio_id INTEGER NOT NULL REFERENCES comercios(comercio_id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(usuario_id) ON DELETE CASCADE,
    permissao VARCHAR(50) IN ('operador', 'membro') NOT NULL,
    entrou_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_comercio_usuario UNIQUE (comercio_id, usuario_id);

    ENABLE ROW LEVEL SECURITY;
);