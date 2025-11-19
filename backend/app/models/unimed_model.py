from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.database import Base

class UnidadeMedida(Base):
    __tablename__ = "unidade_medidas"

    unimed_id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(50), nullable=False)
    sigla = Column(String(10), unique=True, nullable=False)

    comercio_id = Column(Integer, ForeignKey("comercios.comercio_id", ondelete="CASCADE"), nullable=True)

    produtos = relationship("Produto", back_populates="unidade_medida")
    comercio = relationship("Comercio", back_populates="unidade_medidas")
    configuracoes_comercio = relationship(
        "ConfiguracaoComercio",
        back_populates="unidade_medida"
    )
    
