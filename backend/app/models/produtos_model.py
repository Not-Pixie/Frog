from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.database import Base

class Produto(Base):
    __tablename__ = "produtos"

    produto_id = Column(Integer, primary_key=True, autoincrement=True)
    codigo = Column(String(50), unique=True, nullable=False)
    nome = Column(String(150), nullable=False)
    preco = Column(Numeric(10, 2), nullable=False)
    quantidade_estoque = Column(Integer, nullable=False, default=0)
    tags = Column(String(100), nullable=True)

    # nomes de coluna alinhados ao SQL: unimed_id, categoria_id, fornecedor_id, comercio_id
    unimed_id = Column(Integer, ForeignKey("unidade_medidas.unimed_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias.categoria_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    fornecedor_id = Column(Integer, ForeignKey("fornecedores.fornecedor_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    comercio_id = Column(Integer, ForeignKey("comercios.comercio_id", ondelete="CASCADE"), nullable=False)

    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    unidade_medida = relationship("UnidadeMedida", back_populates="produtos", lazy="joined")
    categoria = relationship("Categoria", back_populates="produtos", lazy="joined")
    fornecedor = relationship("Fornecedor", back_populates="produtos", lazy="joined")
    comercio = relationship("Comercio", back_populates="produtos", lazy="joined")
