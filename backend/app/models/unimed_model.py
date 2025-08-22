from sqlalchemy import (
    Column, String, Integer, Numeric, DateTime,
    ForeignKey, UniqueConstraint, func
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class UnidadeMedida(Base):
    __tablename__ = "unidade_medidas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(50), nullable=False)
    sigla = Column(String(10), unique=True, nullable=False)

    produtos = relationship("Produto", back_populates="unidade_medida")