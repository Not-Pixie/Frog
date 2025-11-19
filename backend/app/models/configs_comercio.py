from sqlalchemy import Column, Integer, String, Numeric, DateTime, CHAR, func, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

class ConfiguracaoComercio(Base):
    __tablename__ = "configuracoes_comercio"

    id = Column(Integer, primary_key=True, autoincrement=True)
    unidade_padrao = Column(String(20), nullable=False, server_default='un')
    unimed_id = Column(Integer, ForeignKey('unidade_medidas.unimed_id', ondelete="SET NULL"), nullable=True)
    nivel_alerta_minimo = Column(Numeric(14,3), nullable=False, server_default="0.00")
    moeda_padrao = Column(CHAR(3), nullable=False, server_default='BRL')
    linguagem = Column(String(10), nullable=False, server_default='pt-BR')
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


    unidade_medida = relationship("UnidadeMedida", back_populates="configuracoes_comercio")