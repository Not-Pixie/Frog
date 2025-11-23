from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum, CheckConstraint, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database.database import Base

class Movimentacao(Base):
    __tablename__ = "movimentacoes"

    mov_id = Column(Integer, primary_key=True, autoincrement=True)
    tipo = Column(String(7), nullable=False)  # 'entrada' = 7 chars, 'saida' = 5 chars
    estado = Column(String(7), nullable=False, default="aberta") # 'aberta' ou 'fechada'
    link = Column(String(16), nullable=False, unique=True)
    codigo = Column(Integer, nullable=False)

    carrinho_id = Column(Integer, ForeignKey("carrinhos.carrinho_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    comercio_id = Column(Integer, ForeignKey("comercios.comercio_id", ondelete="CASCADE"), nullable=False)
    
    valor_total = Column(Numeric(12, 4), nullable=False)
    forma_pagamento = Column(String(100), nullable=True)
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fechado_em = Column(DateTime(timezone=True), nullable=True)
    
     # Add the check constraint to the table
    __table_args__ = (
        CheckConstraint("tipo IN ('entrada','saida')", name='ck_movimentacoes_tipo'),
        CheckConstraint("estado IN ('aberta','fechada')", name='ck_movimentacoes_estado'),
        UniqueConstraint("comercio_id", "tipo", "codigo", name="uq_movimentacoes_comercio_codigo")
    )

    # relacionamentos (opcionais)
    carrinho = relationship("Carrinho", lazy="joined")
    comercio = relationship("Comercio", back_populates="movimentacoes")