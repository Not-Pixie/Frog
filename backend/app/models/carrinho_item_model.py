from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database.database import Base

class CarrinhoItem(Base):
    __tablename__ = "carrinho_itens"

    item_id = Column(Integer, primary_key=True, autoincrement=True)
    carrinho_id = Column(Integer, ForeignKey("carrinhos.carrinho_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    produto_id = Column(Integer, ForeignKey("produtos.produto_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    quantidade = Column(Integer, nullable=False, default=1)
    desconto_percentual = Column(Numeric(6, 4), nullable=True) # Desconto em percentual (ex: 10.5% = 10.5)

    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    comercio_id = Column(Integer, ForeignKey("comercios.comercio_id", ondelete="CASCADE"), nullable=False)

    carrinho = relationship("Carrinho", back_populates="itens", lazy="joined")
    produto = relationship("Produto", lazy="joined") 
    comercio = relationship("Comercio", back_populates="carrinhoitens" )

    __table_args__ = (
        UniqueConstraint("carrinho_id", "produto_id", name="uq_carrinho_produto"),
    )