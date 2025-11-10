from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy.orm import Session
from app.models.carrinho_model import Carrinho, CarrinhoItem, Movimentacao


def criar_carrinho_vazio(db: Session) -> Carrinho:
    
    return carrinho


def criar_movimentacao_vazia(db: Session, tipo: str,) -> Movimentacao:

    mov = Movimentacao(
        tipo=tipo,
        carrinho_id=carrinho_id,
        valor_total=0,
        forma_pagamento=forma_pagamento,
        desconto_percentual=desconto_percentual
    )
    db.add(mov)
    db.commit()
    db.refresh(mov)
    return mov
