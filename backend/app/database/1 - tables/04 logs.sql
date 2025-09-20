CREATE TABLE logs (
    log_id              SERIAL PRIMARY KEY,
    tabela_nome      VARCHAR(100)    NOT NULL,
    record_id       VARCHAR(255)         NOT NULL,
    operacao       VARCHAR(10)     NOT NULL,
    alterado_por      INTEGER         REFERENCES usuarios(usuario_id),
    alterado_em      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    antigo_dado       JSONB,
    novo_dado        JSONB
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_tabela_record
  ON logs (tabela_nome, record_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_tabela_record_date
  ON logs (tabela_nome, record_id, alterado_em DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_alterado_por
  ON logs (alterado_por);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_alterado_em
  ON logs (alterado_em);