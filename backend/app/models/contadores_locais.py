# models.py
from sqlalchemy import Column, Integer, String, CheckConstraint, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database.database import Base

class ContadorLocal(Base):
    __tablename__ = "contadores_locais"

    comercio_id = Column(Integer, ForeignKey("comercios.comercio_id", ondelete="CASCADE"), nullable=False, primary_key=True)
    scope = Column(String(32), nullable=False, primary_key=True)  
    ultimo_codigo = Column(Integer, nullable=False, server_default="0")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("scope IN ('produtos','fornecedores','categorias','unidade_medidas', 'mov_entrada', 'mov_saida')", name="ck_contadores_scope_allowed"),
    )

