from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from app.database.database import Base

class Fornecedor(Base):
    __tablename__ = "fornecedores"

    fornecedor_id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(150), nullable=False)
    cnpj = Column(String(18), unique=True)
    telefone = Column(String(20))
    email = Column(String(100))
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    produtos = relationship("Produto", back_populates="fornecedor")
