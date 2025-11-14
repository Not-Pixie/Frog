from sqlalchemy.orm import Session
from app.models.carrinho_model import Carrinho, CarrinhoItem, Movimentacao


def criar_carrinho_vazio(db: Session, comercio_id: int) -> Carrinho:
    car = Carrinho(
        comercio_id=comercio_id
    )
    return car


def criar_movimentacao_vazia(db: Session, tipo: str, comercio_id: int) -> Movimentacao:
    carrinho = criar_carrinho_vazio(db, comercio_id)
    
    mov = Movimentacao(
        tipo=tipo,
        carrinho_id=carrinho.carrinho_id,
        comercio_id = comercio_id,
        valor_total=0,
        forma_pagamento="",
        desconto_percentual=0
    )
    
    db.add(mov)
    db.commit()
    db.refresh(mov)
    return mov
