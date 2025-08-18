from sqlalchemy import Column, Integer, String, Text, DateTime, func
from app.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    usuario_id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    nome_completo = Column(String(255), nullable=False)
    senha_hash = Column(Text, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

