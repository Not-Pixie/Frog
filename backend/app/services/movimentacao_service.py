# service corrigido (trecho)
from sqlalchemy.exc import IntegrityError  # trocar psycopg2 por sqlalchemy.exc
from sqlalchemy.orm import Session
from app.models.carrinho_model import Carrinho
from app.models.movimentacao_model import Movimentacao
from typing import Literal, Optional

from app.utils.link_utils import criar_link


def criar_carrinho_vazio(db: Session, comercio_id: int) -> Carrinho:
    car = Carrinho(comercio_id=comercio_id)
    db.add(car)
    db.flush()
    return car


def criar_movimentacao_vazia(db: Session, tipo: Literal["entrada", "saida"], comercio_id: int, tentativas: Optional[int] = None) -> Movimentacao:
    MAX_TRIES = tentativas or 6

    for attempt in range(1, MAX_TRIES + 1):
        try:
            carrinho = criar_carrinho_vazio(db, comercio_id)
            link = criar_link()

            mov = Movimentacao(
                tipo=tipo,
                carrinho_id=carrinho.carrinho_id,
                comercio_id=comercio_id,
                valor_total=0,
                forma_pagamento="",
                link=link,
                estado="aberta"
            )
            db.add(mov)
            db.flush()
            db.refresh(mov)
            return mov

        except IntegrityError as e:
            try:
                db.rollback()
            except Exception:
                pass

            if attempt == MAX_TRIES:
                raise RuntimeError("Não foi possível gerar um link único após várias tentativas") from e

    raise RuntimeError("Erro inesperado ao criar movimentação")
