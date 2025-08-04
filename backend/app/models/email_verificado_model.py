from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, TIMESTAMP, func, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base

class NegocioEmailVerificado(Base):
    __tablename__ = "negocio_email_verificado"
    __table_args__ = (
        UniqueConstraint("negocio_id", "email_id", name="pk_negocio_email_verificado"),
    )

    negocio_id = Column(Integer, ForeignKey("negocio.id", ondelete="CASCADE"), primary_key=True)
    email_id = Column(Integer, ForeignKey("email.id", ondelete="CASCADE"), primary_key=True)
    senha_hash = Column(Text, nullable=False)

    negocio = relationship("Negocio", back_populates="emails_verificados")
    email = relationship("Email", back_populates="negocios_verificados")