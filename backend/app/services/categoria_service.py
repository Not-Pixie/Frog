# app/services/categoria_service.py
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy import or_
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


def delete_categoria(db, categoria_id: int, comercio_id: int) -> bool:
    """
    Deleta categoria garantindo que pertença ao comercio_id.
    Com ON DELETE SET NULL no DB, os produtos terão categoria_id = NULL automaticamente.
    Retorna True se deletado; ValueError se não encontrado; relança IntegrityError/SQLAlchemyError em erro de DB.
    """
    # localizar pela PK correta
    conds = []
    if hasattr(Categoria, "categoria_id"):
        conds.append(Categoria.categoria_id == categoria_id)
    if hasattr(Categoria, "id"):
        conds.append(Categoria.id == categoria_id)

    if not conds:
        raise RuntimeError("Modelo Categoria não possui atributo 'categoria_id' nem 'id'")

    try:
        cat = db.query(Categoria).filter(or_(*conds), Categoria.comercio_id == comercio_id).one_or_none()
        if cat is None:
            raise ValueError("Categoria não encontrada para este comércio")

        db.delete(cat)
        db.commit()
        return True

    except IntegrityError:
        db.rollback()
        raise
    except SQLAlchemyError:
        db.rollback()
        raise

