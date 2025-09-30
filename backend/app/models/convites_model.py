from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.database import Base

class Convite(Base):
    __tablename__ = "convites"

    id = Column(Integer, primary_key=True, autoincrement=True)
    comercio_id = Column(Integer, ForeignKey("comercios.comercio_id", ondelete="CASCADE"), nullable=False)
    link = Column(String(16), nullable=False, unique=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    comercio = relationship("Comercio", back_populates="convites")
