CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    preco NUMERIC(10, 2) NOT NULL,
    quantidade_estoque INT NOT NULL DEFAULT 0,

    unidade_medida_id INT NOT NULL,
    categoria_id INT NOT NULL,
    fornecedor_id INT NOT NULL,

	criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (unidade_medida_id) REFERENCES unidade_medidas(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

