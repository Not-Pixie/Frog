# service corrigido (trecho)
from decimal import Decimal
from sqlalchemy.exc import IntegrityError  # trocar psycopg2 por sqlalchemy.exc
from sqlalchemy.orm import Session
from app.models.carrinho_model import Carrinho
from app.models.movimentacao_model import Movimentacao
from typing import Literal, Optional

from app.utils.link_utils import criar_link
from app.utils.contador_utils import next_codigo
from app.models.produtos_model import Produto
from app.models.carrinho_item_model import CarrinhoItem


def criar_carrinho_vazio(db: Session, comercio_id: int) -> Carrinho:
    car = Carrinho(comercio_id=comercio_id)
    db.add(car)
    db.flush()
    return car


def criar_movimentacao_vazia(db: Session,
                             #Não mude tipo para outros valores sem antes alterar contadores_locais 
                             tipo: Literal["entrada", "saida"], comercio_id: int, tentativas: Optional[int] = None) -> Movimentacao:
    MAX_TRIES = tentativas or 6

    for attempt in range(1, MAX_TRIES + 1):
        try:
            carrinho = criar_carrinho_vazio(db, comercio_id)
            link = criar_link()
            
            codigo = next_codigo(db, comercio_id, f"mov_{tipo}")
            #Se seu erro é na linha superior, ver cq em contadores_locais :)

            mov = Movimentacao(
                codigo=codigo,
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

def adicionar_produto_em_carrinho(db: Session, carrinho_id: int, produto_id: int, quantidade: int, comercio_id: int, desconto_percentual: Optional[Decimal] = None) -> CarrinhoItem:
    if desconto_percentual:
        if not (Decimal('0.00') <= desconto_percentual < Decimal('100.00')):
             raise ValueError(f"O desconto deve estar entre 0 e 99.9999%. Valor recebido: {desconto_percentual}")
    
    item_existente = db.query(CarrinhoItem).filter_by(
        carrinho_id=carrinho_id, 
        produto_id=produto_id
    ).first()

    if item_existente:
        # Cenário A: O produto já está lá, apenas aumentamos a quantidade
        item_existente.quantidade += quantidade
        if desconto_percentual is not None:
            item_existente.desconto_percentual = desconto_percentual
        item = item_existente
    else:
        item = CarrinhoItem(
            carrinho_id=carrinho_id,
            produto_id=produto_id,
            quantidade=quantidade,
            comercio_id=comercio_id,
            desconto_percentual=desconto_percentual
        )
        db.add(item)
    db.flush()
    db.refresh(item)
    return item

def get_itens_carrinho(db: Session, carrinho_id: int) -> list[CarrinhoItem]:
    return db.query(CarrinhoItem).filter(
        CarrinhoItem.carrinho_id == carrinho_id
    ).all()
    
