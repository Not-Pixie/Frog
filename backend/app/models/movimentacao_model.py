from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum, CheckConstraint, func
from sqlalchemy.orm import relationship
from app.database.database import Base

class Movimentacao(Base):
    __tablename__ = "movimentacoes"

    mov_id = Column(Integer, primary_key=True, autoincrement=True)

    tipo = Column(String(7), nullable=False)  # 'entrada' = 7 chars, 'saida' = 5 chars
    
    # Add the check constraint to the table
    __table_args__ = (
        CheckConstraint("tipo IN ('entrada','saida')", name='ck_movimentacoes_tipo'),
    )

    link = Column(String(16), nullable=False, unique=True)

    # ligação com carrinho (nullable caso queira registrar movimentação sem carrinho)
    carrinho_id = Column(Integer, ForeignKey("carrinhos.carrinho_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)

    # valor final armazenado (imutar por segurança/histórico)
    valor_total = Column(Numeric(12, 4), nullable=False)

    # forma de pagamento e desconto em percentual (ex: 10.5% = 10.5)
    forma_pagamento = Column(String(100), nullable=True)
    desconto_percentual = Column(Numeric(6, 4), nullable=True)

    comercio_id = Column(Integer, ForeignKey("comercios.comercio_id", ondelete="CASCADE"), nullable=False)

    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # relacionamentos (opcionais)
    carrinho = relationship("Carrinho", lazy="joined")
    comercio = relationship("Comercio", back_populates="movimentacoes")