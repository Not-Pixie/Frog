from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database.database import Base

class Produto(Base):
    __tablename__ = "produtos"

    produto_id = Column(Integer, primary_key=True, autoincrement=True)
    codigo = Column(Integer, nullable=False)
    nome = Column(String(150), nullable=False)
    preco = Column(Numeric(10, 2), nullable=False)
    quantidade_estoque = Column(Integer, nullable=False, default=0)
    tags = Column(String(100), nullable=True)
    limite_estoque = Column(Integer, nullable=True)

    unimed_id = Column(Integer, ForeignKey("unidade_medidas.unimed_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias.categoria_id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)
    fornecedor_id = Column(Integer, ForeignKey("fornecedores.fornecedor_id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)
    comercio_id = Column(Integer, ForeignKey("comercios.comercio_id", ondelete="CASCADE"), nullable=False)

    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    unidade_medida = relationship("UnidadeMedida", back_populates="produtos", lazy="select")
    categoria = relationship("Categoria", back_populates="produtos", lazy="select")
    fornecedor = relationship("Fornecedor", back_populates="produtos", lazy="select")
    comercio = relationship("Comercio", back_populates="produtos", lazy="select")

    __table_args__ = (
        UniqueConstraint("comercio_id", "codigo", name="produtos_comercio_key"),
    )