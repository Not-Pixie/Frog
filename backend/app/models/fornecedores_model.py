from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database.database import Base


class Fornecedor(Base):
    __tablename__ = "fornecedores"

    fornecedor_id = Column(Integer, primary_key=True, autoincrement=True)
    codigo = Column(Integer, nullable=False)
    nome = Column(String(150), nullable=False)
    cnpj = Column(String(18))
    telefone = Column(String(20))
    email = Column(String(100))

    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    comercio_id = Column(Integer, ForeignKey("comercios.comercio_id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
            UniqueConstraint("comercio_id", "codigo", name="uq_fornecedor_comercio_codigo"),
            UniqueConstraint("comercio_id", "cnpj", name="uq_fornecedor_comercio_cnpj"),
        )

    
    endereco_id = Column(Integer, ForeignKey("enderecos.endereco_id", ondelete="SET NULL"), nullable=True)
    endereco = relationship("Endereco", back_populates="fornecedores", uselist=False)

    produtos = relationship("Produto", back_populates="fornecedor")
    comercio = relationship("Comercio", back_populates="fornecedores")

