# app/services/comercio_service.py
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.models.comercios_model import Comercio
from app.models.comercios_usuarios import ComercioUsuario  # sua tabela associativa

def criar_comercio(proprietario_id: int, nome: str, configs: dict | None = None) -> Comercio:
    """
    Cria um comercio e a relação com o usuario (proprietario).
    Lança IntegrityError se o nome for duplicado.
    Retorna a instância Comercio preenchida.
    """
    session: Session = SessionLocal()
    try:
        comercio = Comercio(proprietario_id=proprietario_id, nome=nome)
        session.add(comercio)
        session.flush()  # garante que comercio.comercio_id esteja populado

        # cria associação (assumindo que ComercioUsuario tem comercio_id e usuario_id)
        assoc = ComercioUsuario(comercio_id=comercio.comercio_id, usuario_id=proprietario_id)
        session.add(assoc)

        # se quiser salvar configs em outra tabela/coluna, trate aqui.
        # commit final
        session.commit()
        session.refresh(comercio)
        return comercio
    except IntegrityError:
        session.rollback()
        raise
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
