from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class Comercio(Base):
    __tablename__ = "comercios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    proprietario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    nome = Column(String(255), nullable=False, unique=True)
    criado_em = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relacionamento com usuarios
    proprietario = relationship("Usuario", back_populates="comercios")
    membros = relationship("ComercioUsuario", back_populates="comercio")
