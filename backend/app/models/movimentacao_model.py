from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database.database import Base

class Movimentacao(Base):
    __tablename__ = "movimentacoes"

    mov_id = Column(Integer, primary_key=True, autoincrement=True)

    # tipo restrito a 'entrada' ou 'saida' (Enum no DB)
    tipo = Column(Enum("entrada", "saida", name="movimento_tipo"), nullable=False)

    link = Column(String(16), nullable=False, unique=True)

    # ligação com carrinho (nullable caso queira registrar movimentação sem carrinho)
    carrinho_id = Column(Integer, ForeignKey("carrinhos.carrinho_id", ondelete="SET NULL", onupdate="CASCADE"), nullable=False)

    # valor final armazenado (imutar por segurança/histórico)
    valor_total = Column(Numeric(12, 4), nullable=False)

    # forma de pagamento e desconto em percentual (ex: 10.5% = 10.5)
    forma_pagamento = Column(String(100), nullable=True)
    desconto_percentual = Column(Numeric(6, 4), nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # relacionamentos (opcionais)
    carrinho = relationship("Carrinho", lazy="joined")