from sqlalchemy.orm import Session

from app.models import ComercioUsuario
from app.models import Usuario
from app.models import Comercio


def usuario_tem_acesso_comercio(user: Usuario, commerce: Comercio, db: Session) -> bool:
    """
    Verifica se o usuário tem acesso ao comércio.
    Aceita `user` e `commerce` como objetos (com .id) ou como ids (int/str).
    Retorna True se existir registro em ComercioUsuario (e, opcionalmente, ativo).
    """
    user_id = getattr(user, "usuario_id", None)
    commerce_id = getattr(commerce, "comercio_id", None)

    if user_id is None or commerce_id is None:
        return False

    registro = (
        db.query(ComercioUsuario)
        .filter(
            ComercioUsuario.usuario_id == user_id,
            ComercioUsuario.comercio_id == commerce_id,
        )
        .first()
    )

    return bool(registro)
