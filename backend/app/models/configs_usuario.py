from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database.database import Base

class ConfiguracaoUsuario(Base):
    __tablename__ = "configuracoes_usuario"

    id = Column(Integer, primary_key=True, autoincrement=True)
    # ASSUMI que o PK do usuário é `usuario_id`. Se o seu model Usuario usa `id`,
    # troque abaixo para ForeignKey("usuarios.id").
    usuario_id = Column(Integer, ForeignKey("usuarios.usuario_id", ondelete="CASCADE"), nullable=False)
    idioma_preferido = Column(String(10), server_default='pt-BR')
    tema_preferido = Column(String(50), nullable=True)
    notificacoes_email = Column(Boolean, server_default="true", nullable=False)
    notificacoes_push = Column(Boolean, server_default="true", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    usuario = relationship("Usuario", back_populates="configuracoes")
