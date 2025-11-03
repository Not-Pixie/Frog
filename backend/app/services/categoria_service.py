# app/services/categoria_service.py
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.categoria_model import Categoria
from app.utils.contador_utils import next_codigo

def create_categoria(db: Session, comercio_id: int, nome: str) -> Categoria:
    nome = (nome or "").strip()
    if not nome:
        raise ValueError("Campo 'nome' é obrigatório")

    try:
        codigo_local = next_codigo(db, comercio_id, "categorias")

        categoria = Categoria(
            comercio_id=comercio_id,
            codigo=codigo_local,
            nome=nome
        )
        db.add(categoria)
        db.flush()
        db.commit()
        db.refresh(categoria)
        return categoria

    except Exception:
        try:
            db.rollback()
        except Exception:
            pass
        raise

