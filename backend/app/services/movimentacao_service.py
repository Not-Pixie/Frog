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
from app.models.unimed_model import UnidadeMedida


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

    mov = db.query(Movimentacao).filter(
        Movimentacao.carrinho_id == carrinho_id
    ).with_for_update().first()

    if not mov:
        raise ValueError("Carrinho/Movimentação não encontrada.")

    produto = (
        db.query(Produto)
        .options(load_only(Produto.produto_id, Produto.preco, Produto.comercio_id))
        .filter_by(produto_id=produto_id)
        .first()
    )

    if not produto or int(produto.comercio_id) != int(comercio_id):
        raise ValueError("Produto inválido.")
    
    preco_unitario = Decimal(produto.preco)
    desconto = desconto_percentual if desconto_percentual is not None else Decimal(0)
    
    item_existente = db.query(CarrinhoItem).filter_by(
        carrinho_id=carrinho_id, 
        produto_id=produto_id
    ).first()

    item_final = None

    if item_existente:
        mov.valor_total -= item_existente.subtotal
        

        item_existente.quantidade += quantidade
        item_existente.preco_unitario = preco_unitario 
        if desconto_percentual is not None:
            item_existente.desconto_percentual = desconto
            
        novo_subtotal = (
            item_existente.preco_unitario * item_existente.quantidade * (Decimal(1) - (item_existente.desconto_percentual or Decimal(0)) / 100)
        )
        item_existente.subtotal = novo_subtotal
        
        mov.total_itens += quantidade 
        mov.valor_total += novo_subtotal
        
        item_final = item_existente

    else:
        subtotal = (
            preco_unitario * Decimal(quantidade) * (Decimal(1) - (desconto / 100))
        )
        
        novo_item = CarrinhoItem(
            carrinho_id=carrinho_id,
            produto_id=produto_id,
            quantidade=quantidade,
            comercio_id=comercio_id,
            desconto_percentual=desconto_percentual,
            preco_unitario=preco_unitario,
            subtotal=subtotal
        )
        db.add(novo_item)
        
        mov.total_itens += quantidade
        mov.valor_total += subtotal
        
        item_final = novo_item

    # Só por garantia, né? Vai que
    if mov.valor_total < 0: mov.valor_total = 0

    db.flush() 
    db.commit() 
    
    db.refresh(item_final) 
    return item_final


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

def deletar_item_de_carrinho(db: Session, item_id: int) -> Carrinho:
    """
    Remove item e atualiza totais.
    Retorna True se sucesso, lança exceção se falhar.
    """
    item: CarrinhoItem = db.query(CarrinhoItem).get(item_id)
    if not item:
        return None

    mov: Movimentacao = db.query(Movimentacao).get(item.carrinho_id)
    if not mov:
        return None

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
    
    cart = db.query(Carrinho).get(item.carrinho_id)

    db.delete(item)
    db.commit()
    db.refresh(cart)
    return cart

    
    
    
    

def _format_cart_with_items(db: Session, cart: Carrinho):
    itens_objs = get_itens_carrinho(db=db, carrinho_id=cart.carrinho_id)
    itens_formatados = []
    total_carrinho = Decimal("0.00")

    for item in itens_objs:
        produto: Produto = item.produto
        if not produto:
            continue

        unidade: UnidadeMedida = db.query(UnidadeMedida).get(produto.unimed_id)

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
            "unidade": unidade.nome,
            "nome_produto": produto.nome,
            "preco_unitario": str(preco.quantize(Decimal("0.01"))),
            "quantidade": int(item.quantidade),
            "desconto_percentual": (str(item.desconto_percentual)
                                    if item.desconto_percentual is not None else None),
            "subtotal": str(subtotal.quantize(Decimal("0.01")))
        })

    cart_dict = model_to_dict(cart)
    cart_dict["itens"] = itens_formatados
    cart_dict["valor_total"] = str(total_carrinho.quantize(Decimal("0.01")))
    return cart_dict