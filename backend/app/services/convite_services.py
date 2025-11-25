from typing import Optional
from app.utils.link_utils import criar_link
from app.models.convites_model import Convite


def novo_link_convite(db, max_attempts: Optional[int] =8):
    """Gera um link aleatório e verifica unicidade na tabela convites."""
    for _ in range(max_attempts):
        link = criar_link()
        exists = db.query(Convite).filter(Convite.link == link).first()
        if not exists:
            return link
    raise ValueError("Não foi possível gerar link único após várias tentativas")