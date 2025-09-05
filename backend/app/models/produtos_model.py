from sqlalchemy import (
    Column, String, Integer, Numeric, DateTime,
    ForeignKey, UniqueConstraint, func
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class Produto(Base):
    __tablename__ = "produtos"

    produto_id = Column(Integer, primary_key=True, autoincrement=True)
    codigo = Column(String(50), unique=True, nullable=False)
    nome = Column(String(150), nullable=False)
    preco = Column(Numeric(10, 2), nullable=False)
    quantidade_estoque = Column(Integer, nullable=False, default=0)

    unidade_medida_id = Column(Integer, ForeignKey("unidade_medida.id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    categoria_id = Column(Integer, ForeignKey("categoria.id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    fornecedor_id = Column(Integer, ForeignKey("fornecedor.id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)

    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    unidade_medida = relationship("UnidadeMedida", back_populates="produtos")
    categoria = relationship("Categoria", back_populates="produtos")
    fornecedor = relationship("Fornecedor", back_populates="produtos")