from typing import List
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.comercios_model import Comercio
from app.models.comercios_usuarios import ComercioUsuario
from app.models.usuarios_model import Usuario
from app.services.errors import ComercioServiceError

def get_comercios_que_usuario_tem_acesso(db: Session, usuario_id: int) -> List[Comercio]:
    comercio_pk = getattr(Comercio, "comercio_id", None) or getattr(Comercio, "comercio_id", None)
    cu_comercio_col = getattr(ComercioUsuario, "comercio_id", None) or getattr(ComercioUsuario, "comercio_id", None)
    cu_usuario_col = getattr(ComercioUsuario, "usuario_id", None) or getattr(ComercioUsuario, "usuario", None)

    if comercio_pk is None or cu_comercio_col is None or cu_usuario_col is None:
        raise ComercioServiceError(
            "Não foi possível detectar colunas PK/FK nos models."
        )

    subq = (
        db.query(
            ComercioUsuario.comercio_id.label("comercio_id"),
            func.max(ComercioUsuario.entrou_em).label("last_entrou")
        )
        .filter(ComercioUsuario.usuario_id == usuario_id)
        .group_by(ComercioUsuario.comercio_id)
    ).subquery()

    q = (
        db.query(Comercio)
        .join(subq, Comercio.comercio_id == subq.c.comercio_id)
        .order_by(subq.c.last_entrou.asc())
    )
    
    return q.all()

def get_usuario_por_email(db: Session, email: str) -> Usuario | None:
    """Busca usuário pelo e-mail"""
    return db.query(Usuario).filter(Usuario.email == email).first()

def get_usuario_por_id(db: Session, usuario_id: int) -> Usuario | None:
    """Busca usuário pelo ID"""
    return db.query(Usuario).filter(Usuario.usuario_id == usuario_id).first()

def usuario_tem_acesso_ao_comercio(db, usuario_id: int, comercio_id: int) -> bool:
    return db.query(Comercio).filter(
        Comercio.comercio_id == comercio_id,
        Comercio.proprietario_id == usuario_id
    ).first() is not None
