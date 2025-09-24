# app/models/comercios_model.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.database import Base

class Comercio(Base):
    __tablename__ = "comercios"

    comercio_id = Column(Integer, primary_key=True, autoincrement=True)
    proprietario_id = Column(Integer, ForeignKey("usuarios.usuario_id", ondelete="RESTRICT"), nullable=False)
    nome = Column(String(255), nullable=False, unique=True)

    # Nova coluna: FK para configuracao
    configuracao_id = Column(Integer, ForeignKey("configuracoes_comercio.id", ondelete="SET NULL"), nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relacionamento com Usuario (dono)
    proprietario = relationship("Usuario", back_populates="comercios")

    # relacionamentos para configs
    configuracao = relationship("ConfiguracaoComercio", backref="comercio", uselist=False)

    # Relacionamento N:N através da tabela associativa
    membros = relationship("ComercioUsuario", back_populates="comercio", cascade="all, delete-orphan")
