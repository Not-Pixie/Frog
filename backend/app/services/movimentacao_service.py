from decimal import Decimal
from typing import Literal, Optional
from datetime import datetime, timezone

from sqlalchemy import case, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, load_only, noload

from app.models.carrinho_model import Carrinho
from app.models.movimentacao_model import Movimentacao
from app.models.carrinho_item_model import CarrinhoItem
from app.models.produtos_model import Produto

from app.utils.link_utils import criar_link
from app.utils.contador_utils import next_codigo
from app.utils.model_utils import model_to_dict


def criar_carrinho_vazio(db: Session, comercio_id: int) -> Carrinho:
    car = Carrinho(comercio_id=comercio_id)
    db.add(car)
    db.flush()
    return car


def criar_movimentacao_vazia(db: Session,
                             tipo: Literal["entrada", "saida"],
                             comercio_id: int,
                             tentativas: Optional[int] = None,
                             link_param: Optional[str] = None) -> Movimentacao:
    MAX_TRIES = tentativas or 6
    for attempt in range(1, MAX_TRIES + 1):
        try:
            carrinho = criar_carrinho_vazio(db, comercio_id)
            link = link_param or criar_link()
            
            ultimo_codigo = db.query(func.max(Movimentacao.codigo)).filter(
                Movimentacao.comercio_id == comercio_id
            ).scalar() or 0
            
            codigo = ultimo_codigo + 1
            
            mov = Movimentacao(
                codigo=codigo,
                tipo=tipo,
                carrinho_id=carrinho.carrinho_id,
                comercio_id=comercio_id,
                valor_total=0,
                total_itens=0,
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


def adicionar_produto_em_carrinho(db: Session,
                                  carrinho_id: int,
                                  produto_id: int,
                                  quantidade: int,
                                  comercio_id: int,
                                  desconto_percentual: Optional[Decimal] = None) -> CarrinhoItem:
    if quantidade <= 0:
        raise ValueError("Quantidade deve ser maior que zero.")
    if desconto_percentual is not None and not (Decimal('0.00') <= desconto_percentual < Decimal('100.00')):
        raise ValueError("Desconto deve ser entre 0 e 99.9999%.")

    carrinho = db.query(Carrinho).filter_by(carrinho_id=carrinho_id).first()
    if not carrinho or int(carrinho.comercio_id) != int(comercio_id):
        raise ValueError("Carrinho inválido.")

    produto = (
        db.query(Produto)
          .options(load_only(Produto.produto_id, Produto.preco, Produto.quantidade_estoque, Produto.comercio_id))
          .filter_by(produto_id=produto_id)
          .first()
    )
    if not produto or int(produto.comercio_id) != int(comercio_id):
        raise ValueError("Produto não encontrado ou pertence a outro comercio.")

    preco_unitario = Decimal(produto.preco)

    item_existente = db.query(CarrinhoItem).filter_by(
        carrinho_id=carrinho_id,
        produto_id=produto_id
    ).first()

    if item_existente:
        item_existente.quantidade += quantidade
        if desconto_percentual is not None:
            item_existente.desconto_percentual = desconto_percentual
        item_existente.preco_unitario = preco_unitario
        item_existente.subtotal = (preco_unitario * item_existente.quantidade) * (Decimal(1) - (item_existente.desconto_percentual or Decimal(0)) / 100)
        item = item_existente
    else:
        item = CarrinhoItem(
            carrinho_id=carrinho_id,
            produto_id=produto_id,
            quantidade=quantidade,
            comercio_id=comercio_id,
            desconto_percentual=desconto_percentual,
            preco_unitario=preco_unitario,
            subtotal=(preco_unitario * Decimal(quantidade) * (Decimal(1) - (desconto_percentual or Decimal(0)) / 100))
        )
        db.add(item)

    db.flush()
    db.refresh(item)
    return item


def get_itens_carrinho(db: Session, carrinho_id: int) -> list[CarrinhoItem]:
    return db.query(CarrinhoItem).filter(CarrinhoItem.carrinho_id == carrinho_id).all()


def finalizar_movimentacao(db: Session, mov_id: int, comercio_id: int, tipo: Literal["entrada", "saida"]) -> Movimentacao:
    """
    Finaliza a movimentação SEM gerenciar transação
    """

    # Busca movimentação com lock
    mov = (
        db.query(Movimentacao)
          .filter(
              Movimentacao.mov_id == mov_id,
              Movimentacao.comercio_id == comercio_id,
              Movimentacao.estado == "aberta"
          )
          .with_for_update()
          .first()
    )
    if not mov:
        raise ValueError("Movimentação não encontrada ou já fechada.")

    # Busca itens do carrinho
    itens = db.query(CarrinhoItem).filter(CarrinhoItem.carrinho_id == mov.carrinho_id).all()
    if not itens:
        raise ValueError("Carrinho vazio")

    produto_ids = [item.produto_id for item in itens]

    produtos = (
        db.query(Produto)
          .filter(Produto.produto_id.in_(produto_ids), Produto.comercio_id == comercio_id)
          .with_for_update()
          .all()
    )
    produtos_map = {p.produto_id: p for p in produtos}

    total = Decimal("0.00")
    quantidade_total = 0

    for item in itens:
        prod = produtos_map.get(item.produto_id)
        if not prod:
            raise ValueError(f"Produto {item.produto_id} não encontrado.")

        quantidade = item.quantidade
        quantidade_total += quantidade

        if tipo == "saida":
            if prod.quantidade_estoque < quantidade:
                raise ValueError(f"Estoque insuficiente para {prod.nome}")
            prod.quantidade_estoque -= quantidade
        else:
            #entrada
            prod.quantidade_estoque += quantidade

        if item.subtotal is not None:
            total += item.subtotal
        else:
            total += (item.preco_unitario or prod.preco) * quantidade

    mov.valor_total = total
    mov.total_itens = quantidade_total
    mov.estado = "fechada"
    mov.fechado_em = datetime.now(timezone.utc)

    return mov

def deletar_item_de_carrinho(db: Session, item_id: int) -> bool:
    """
    Remove item e atualiza totais.
    Retorna True se sucesso, lança exceção se falhar.
    """
    item: CarrinhoItem = db.query(CarrinhoItem).get(item_id)
    if not item:
        return False

    mov: Movimentacao = db.query(Movimentacao).get(item.carrinho_id)
    if not mov:
        return False

    novo_total_itens = Movimentacao.total_itens - item.quantidade
    novo_valor_total = Movimentacao.valor_total - (item.quantidade * item.preco_unitario)

    # Lógica sql demoníaca
    mov.total_itens = case(
        (novo_total_itens < 0, 0),  
        else_=novo_total_itens      
    )

    mov.valor_total = case(
        (novo_valor_total < 0, 0),
        else_=novo_valor_total
    )

    db.delete(item)
    db.commit() 
    return True

    
    
    
    

def _format_cart_with_items(db: Session, cart: Carrinho):
    itens_objs = get_itens_carrinho(db=db, carrinho_id=cart.carrinho_id)
    itens_formatados = []
    total_carrinho = Decimal("0.00")

    for item in itens_objs:
        produto = item.produto
        if not produto:
            continue

        preco = Decimal(produto.preco) if produto.preco is not None else Decimal("0.00")
        quantidade = Decimal(item.quantidade)
        subtotal = preco * quantidade

        if item.desconto_percentual:
            fator = Decimal(item.desconto_percentual) / Decimal("100")
            subtotal = subtotal * (Decimal("1") - fator)

        total_carrinho += subtotal

        itens_formatados.append({
            "item_id": item.item_id,
            "carrinho_id": item.carrinho_id,
            "produto_id": produto.produto_id,
            "nome_produto": produto.nome,
            "imagem": getattr(produto, "imagem", None),
            "preco_unitario": str(preco.quantize(Decimal("0.01"))),
            "quantidade": int(item.quantidade),
            "desconto_percentual": (str(item.desconto_percentual)
                                    if item.desconto_percentual is not None else None),
            "subtotal": str(subtotal.quantize(Decimal("0.01")))
        })

    cart_dict = model_to_dict(cart)
    cart_dict["itens"] = itens_formatados
    cart_dict["valor_total"] = str(total_carrinho.quantize(Decimal("0.01")))
    cart_dict["total_itens"] = len(itens_formatados)
    return cart_dict