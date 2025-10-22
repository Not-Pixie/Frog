# app/models/endereco.py
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from app.database.database import Base


class Endereco(Base):
    __tablename__ = "enderecos"

    endereco_id = Column(Integer, primary_key=True, autoincrement=True)
    cep = Column(String(9), nullable=False)
    logradouro = Column(String(200), nullable=True)
    numero = Column(String(20), nullable=True)
    complemento = Column(String(50), nullable=True)
    bairro = Column(String(100), nullable=True)
    cidade = Column(String(100), nullable=True)
    estado = Column(String(2), nullable=True)
    pais = Column(String(64), nullable=False, server_default="BR")

    # metadata para o fluxo de enriquecimento / auditing
    status = Column(String(20), nullable=False, server_default="placeholder")  # 'placeholder'|'partial'|'verified'
    source = Column(String(20), nullable=False, server_default="user")        # 'user'|'api'|'migration' etc

    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    fornecedores = relationship("Fornecedor", back_populates="endereco", passive_deletes=True)