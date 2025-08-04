from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, TIMESTAMP, func, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base

class Email(Base):
    __tablename__ = "email"

    id = Column(Integer, primary_key=True)
    endereco = Column(String(255), nullable=False, unique=True)
    verificado = Column(Boolean, nullable=False, default=False)
    criado_em = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    atualizado_em = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    usuario = relationship("Usuario", back_populates="email", uselist=False)
    negocios_verificados = relationship("NegocioEmailVerificado", back_populates="email")