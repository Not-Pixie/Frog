from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.database import Base

class Categoria(Base):
    __tablename__ = "categorias"

    categoria_id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(100), unique=True, nullable=False)

    produtos = relationship("Produto", back_populates="categoria")
