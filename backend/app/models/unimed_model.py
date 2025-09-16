from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.database import Base

class UnidadeMedida(Base):
    __tablename__ = "unidade_medidas"

    unimed_id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(50), nullable=False)
    sigla = Column(String(10), unique=True, nullable=False)

    produtos = relationship("Produto", back_populates="unidade_medida")
