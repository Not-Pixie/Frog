CREATE TABLE IF NOT EXISTS fornecedores (
    fornecedor_id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(100),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    comercio_id INTEGER NOT NULL REFERENCES comercios(comercio_id) ON DELETE CASCADE;
    
    ENABLE ROW LEVEL SECURITY
);