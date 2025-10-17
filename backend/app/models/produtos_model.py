# app/models/produto.py
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base  # ou sua configuração atual de Base
from datetime import datetime

class Produto(Base):
    __tablename__ = "produtos"

    produto_id = Column(Integer, primary_key=True, autoincrement=True)
    codigo = Column(String(50), nullable=False, unique=True)
    nome = Column(String(150), nullable=False)
    preco = Column(Numeric(10, 2), nullable=False)
    quantidade_estoque = Column(Integer, nullable=False, default=0)
    unimed_id = Column(Integer, ForeignKey("unidade_medidas.unimed_id"), nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias.categoria_id"), nullable=False)
    fornecedor_id = Column(Integer, ForeignKey("fornecedores.fornecedor_id"), nullable=False)
    comercio_id = Column(Integer, ForeignKey("comercios.comercio_id"), nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default="now()", nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default="now()", nullable=False)

    # relationships (não mudam o schema)
    categoria = relationship("Categoria", lazy="joined")   # junta automaticamente por JOIN
    fornecedor = relationship("Fornecedor", lazy="joined")
    unidade_medida = relationship("UnidadeMedida", lazy="joined")

    def to_dict(self):
        return {
            "produtoId": self.produto_id,
            "codigo": self.codigo,
            "nome": self.nome,
            "preco": float(self.preco) if self.preco is not None else 0.0,
            "quantidade": int(self.quantidade_estoque or 0),
            "categoriaId": self.categoria_id,
            "categoriaNome": self.categoria.nome if self.categoria else None,
            "fornecedorId": self.fornecedor_id,
            "fornecedorNome": self.fornecedor.nome if self.fornecedor else None,
            "unimedId": self.unimed_id,
            "unimedNome": self.unidade_medida.nome if self.unidade_medida else None,
            "comercioId": self.comercio_id,
            "criadoEm": self.criado_em.isoformat() if self.criado_em else None,
            "atualizadoEm": self.atualizado_em.isoformat() if self.atualizado_em else None,
        }
