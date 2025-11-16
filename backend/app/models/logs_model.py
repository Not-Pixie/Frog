from sqlalchemy import Column, Integer, String, TIMESTAMP, JSON, ForeignKey, Text, func
from app.database.database import Base

class Log(Base):
    __tablename__ = "logs"

    log_id = Column(Integer, primary_key=True, autoincrement=True)
    tabela_nome = Column(String(100), nullable=False)
    record_id = Column(Text, nullable=False) #NÃO TRANSFORMAR EM INTEGER!!
    operacao = Column(String(10), nullable=False)
    alterado_por = Column(Integer, ForeignKey("usuarios.usuario_id"))
    alterado_em = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    antigo_dado = Column(JSON)
    novo_dado = Column(JSON)
