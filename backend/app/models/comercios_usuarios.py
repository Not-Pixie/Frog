from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ComercioUsuario(Base):
    __tablename__ = "comercios_usuarios"

    comercio_id = Column(Integer, ForeignKey("comercios.id", ondelete="CASCADE"), primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.usuarios_id", ondelete="CASCADE"), primary_key=True)

    
    # Relacionamentos
    comercio = relationship("Comercio", back_populates="membros")
    usuario = relationship("Usuario")
