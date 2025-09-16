from sqlalchemy import Column, Integer, String, Text, DateTime, func
from sqlalchemy.orm import relationship
from app.database.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    usuario_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False)
    nome_completo = Column(String(255), nullable=False)
    senha_hash = Column(Text, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Se o usuário for proprietário de comercios
    comercios = relationship("Comercio", back_populates="proprietario", cascade="all, delete-orphan")

    # Relacionamento muitos-para-muitos via tabela associativa
    comercios_assoc = relationship("ComercioUsuario", back_populates="usuario", cascade="all, delete-orphan")
