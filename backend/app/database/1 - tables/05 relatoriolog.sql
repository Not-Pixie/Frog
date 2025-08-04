CREATE TABLE relatorio_log (
    id              SERIAL PRIMARY KEY,
    tabela_nome      VARCHAR(100)    NOT NULL,
    record_id       INTEGER         NOT NULL,
    operacao       VARCHAR(10)     NOT NULL,
    alterado_por      INTEGER         REFERENCES usuario(id),
    alterado_em      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    antigo_dado       JSONB,
    novo_dado        JSONB
);