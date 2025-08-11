CREATE TABLE IF NOT EXISTS unidade_medida (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    sigla VARCHAR(10) NOT NULL UNIQUE
);

INSERT INTO unidade_medida (nome, sigla) VALUES
('Unidade', 'un'),
('Quilograma', 'kg'),
('Grama', 'g'),
('Litro', 'L'),
('Mililitro', 'ml'),
('Metro', 'm'),
('Centímetro', 'cm'),
('Milímetro', 'mm'),
('Caixa', 'cx'),
('Pacote', 'pct'),
('Galão', 'gal'),
('Par', 'par'),
('Dúzia', 'dz'),
('Saco', 'sc');
