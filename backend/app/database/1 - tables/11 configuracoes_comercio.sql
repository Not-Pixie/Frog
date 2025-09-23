CREATE TABLE configuracoes_comercio (
    id SERIAL PRIMARY KEY,
    unidade_padrao VARCHAR(20) NOT NULL DEFAULT 'un',      -- ex.: un, kg, litro
    nivel_alerta_minimo NUMERIC(14,2) DEFAULT 0.00,        -- nível de estoque para alerta
    moeda_padrao CHAR(3) DEFAULT 'BRL',
    linguagem VARCHAR(10) DEFAULT 'pt-BR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);