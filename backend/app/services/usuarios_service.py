from typing import List
from sqlalchemy.orm import Session
from app.models.comercios_model import Comercio
from app.models.comercios_usuarios import ComercioUsuario
from app.models.usuarios_model import Usuario
from app.services.cadastro_comercio_service import ComercioServiceError

def get_comercios_que_usuario_tem_acesso(db: Session, usuario_id: int) -> List[Comercio]:
    comercio_pk = getattr(Comercio, "comercio_id", None) or getattr(Comercio, "id", None)
    cu_comercio_col = getattr(ComercioUsuario, "comercio_id", None) or getattr(ComercioUsuario, "id", None)
    cu_usuario_col = getattr(ComercioUsuario, "usuario_id", None) or getattr(ComercioUsuario, "usuario", None)

    if comercio_pk is None or cu_comercio_col is None or cu_usuario_col is None:
        raise ComercioServiceError(
            "Não foi possível detectar colunas PK/FK nos models."
        )

    q = (
        db.query(Comercio)
        .join(ComercioUsuario, comercio_pk == cu_comercio_col)
        .filter(cu_usuario_col == usuario_id)
        .distinct()
    )
    
    return q.all()

def get_usuario_por_email(db: Session, email: str) -> Usuario | None:
    """Busca usuário pelo e-mail"""
    return db.query(Usuario).filter(Usuario.email == email).first()

def get_usuario_por_id(db: Session, usuario_id: int) -> Usuario | None:
    """Busca usuário pelo ID"""
    return db.query(Usuario).filter(Usuario.usuario_id == usuario_id).first()
