CREATE TABLE comercio_usuario (
    id SERIAL PRIMARY KEY,
    comercio_id INTEGER NOT NULL REFERENCES comercio(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    permissao VARCHAR(50) NOT NULL, -- 'admin', 'gerente', 'funcionario'
    entrou_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_comercio_usuario UNIQUE (comercio_id, usuario_id)
);