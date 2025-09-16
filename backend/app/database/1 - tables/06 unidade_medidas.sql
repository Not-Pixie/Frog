CREATE TABLE IF NOT EXISTS unidade_medidas (
    unimed_id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    sigla VARCHAR(10) NOT NULL UNIQUE,

    comercio_id INTEGER NOT NULL REFERENCES comercios(comercio_id) ON DELETE CASCADE;
    
    ENABLE ROW LEVEL SECURITY
);

