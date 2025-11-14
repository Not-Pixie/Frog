from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum, CheckConstraint, func
from sqlalchemy.orm import relationship
from app.database.database import Base

class Movimentacao(Base):
    __tablename__ = "movimentacoes"

    mov_id = Column(Integer, primary_key=True, autoincrement=True)
    tipo = Column(String(7), nullable=False)  # 'entrada' = 7 chars, 'saida' = 5 chars
    link = Column(String(16), nullable=False, unique=True)

    carrinho_id = Column(Integer, ForeignKey("carrinhos.carrinho_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)

    valor_total = Column(Numeric(12, 4), nullable=False)

    # forma de pagamento e 
    forma_pagamento = Column(String(100), nullable=True)
    

    comercio_id = Column(Integer, ForeignKey("comercios.comercio_id", ondelete="CASCADE"), nullable=False)

    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
     # Add the check constraint to the table
    __table_args__ = (
        CheckConstraint("tipo IN ('entrada','saida')", name='ck_movimentacoes_tipo'),
    )

    # relacionamentos (opcionais)
    carrinho = relationship("Carrinho", lazy="joined")
    comercio = relationship("Comercio", back_populates="movimentacoes")