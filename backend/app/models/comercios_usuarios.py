from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

class ComercioUsuario(Base):
    __tablename__ = "comercios_usuarios"


    id = Column(Integer, primary_key=True, autoincrement=True)
    comercio_id = Column(Integer, ForeignKey("comercios.comercio_id", ondelete="CASCADE"), primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.usuario_id", ondelete="CASCADE"), primary_key=True)

    # Relacionamentos
    comercio = relationship("Comercio", back_populates="membros")
    usuario = relationship("Usuario", back_populates="comercios_assoc")
