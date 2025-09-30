from sqlalchemy import Column, Integer, String, Numeric, DateTime, CHAR, func
from app.database.database import Base

class ConfiguracaoComercio(Base):
    __tablename__ = "configuracoes_comercio"

    id = Column(Integer, primary_key=True, autoincrement=True)
    unidade_padrao = Column(String(20), nullable=False, server_default='un')
    nivel_alerta_minimo = Column(Numeric(14,2), nullable=False, server_default="0.00")
    moeda_padrao = Column(CHAR(3), nullable=False, server_default='BRL')
    linguagem = Column(String(10), nullable=False, server_default='pt-BR')
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
