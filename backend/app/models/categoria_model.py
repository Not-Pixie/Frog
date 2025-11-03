from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, DateTime, func
from sqlalchemy.orm import relationship
from app.database.database import Base

class Categoria(Base):
    __tablename__ = "categorias"

    categoria_id = Column(Integer, primary_key=True, autoincrement=True)
    codigo = Column(Integer, nullable=False)
    nome = Column(String(100), nullable=False)

    comercio_id = Column(Integer, ForeignKey("comercios.comercio_id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        UniqueConstraint("comercio_id", "codigo", name="uq_categoria_comercio_codigo"),
        UniqueConstraint("comercio_id", "nome", name="uq_categoria_comercio_nome"),
    )

    produtos = relationship("Produto", back_populates="categoria")
    comercio = relationship("Comercio", back_populates="categorias")
