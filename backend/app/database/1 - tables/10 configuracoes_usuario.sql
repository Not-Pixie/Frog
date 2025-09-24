CREATE TABLE configuracoes_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    idioma_preferido VARCHAR(10) DEFAULT 'pt-BR',
    tema_preferido VARCHAR(50),                             -- claro/escuro
    notificacoes_email BOOLEAN DEFAULT TRUE,
    notificacoes_push BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);