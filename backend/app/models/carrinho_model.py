from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database.database import Base

# __NOTE__: o Produto já existe como você mostrou.

class Carrinho(Base):
    __tablename__ = "carrinhos"

    carrinho_id = Column(Integer, primary_key=True, autoincrement=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    comercio_id = Column(Integer, ForeignKey("comercios.comercio_id", ondelete="CASCADE"), nullable=False)

    # relacionamento para itens
    itens = relationship("CarrinhoItem", back_populates="carrinho", cascade="all, delete-orphan", lazy="joined")
    comercio = relationship("Comercio", back_populates="carrinhos")