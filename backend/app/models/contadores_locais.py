from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

class ContadorLocal(Base):
    __tablename__ = "contadores_locais"
    
    comercio_id = Column(Integer, ForeignKey("comercios.comercio_id", ondelete="CASCADE"), nullable=False, primary_key=True)
    ultimo_codigo = Column(Integer, nullable=False, server_default="0")
    
    comercio = relationship("Comercio", back_populates="contador")