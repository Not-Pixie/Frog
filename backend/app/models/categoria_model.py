from sqlalchemy import (
    Column, String, Integer, Numeric, DateTime,
    ForeignKey, UniqueConstraint, func
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(100), unique=True, nullable=False)

    produtos = relationship("Produto", back_populates="categoria")
