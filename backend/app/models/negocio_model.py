from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, TIMESTAMP, func, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base

class Negocio(Base):
    __tablename__ = "negocio"

    id = Column(Integer, primary_key=True)
    criador_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)
    nome = Column(String(255), nullable=False, unique=True)
    criado_em = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    atualizado_em = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    criador = relationship("Usuario", back_populates="negocios")
    emails_verificados = relationship("NegocioEmailVerificado", back_populates="negocio")