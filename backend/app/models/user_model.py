from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, TIMESTAMP, func, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base

class Usuario(Base):
    __tablename__ = "usuario"

    id = Column(Integer, primary_key=True)
    email_id = Column(Integer, ForeignKey("email.id"), unique=True)
    nome_completo = Column(String(255), nullable=False)
    senha_hash = Column(Text, nullable=False)
    criado_em = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    atualizado_em = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    email = relationship("Email", back_populates="usuario")
    negocios = relationship("Negocio", back_populates="criador")
    alteracoes = relationship("RelatorioLog", back_populates="alterado_por")
