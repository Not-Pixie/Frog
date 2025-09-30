from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, CheckConstraint, func
from sqlalchemy.orm import relationship
from app.database.database import Base

class ComercioUsuario(Base):
    __tablename__ = "comercios_usuarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    comercio_id = Column(Integer, ForeignKey("comercios.comercio_id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.usuario_id", ondelete="CASCADE"), nullable=False)

    permissao = Column(String(50), nullable=False)
    entrou_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # constraints coerentes com o SQL
    __table_args__ = (
        UniqueConstraint("comercio_id", "usuario_id", name="uq_comercio_usuario"),
        CheckConstraint("permissao IN ('operador','membro')", name="ck_comercios_usuarios_permissao"),
    )

    # relacionamentos (ajuste os nomes em Comercio/Usuario se necessário)
    comercio = relationship("Comercio", back_populates="membros")
    usuario = relationship("Usuario", back_populates="comercios_assoc")
