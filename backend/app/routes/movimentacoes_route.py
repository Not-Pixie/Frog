from decimal import Decimal
from flask import Blueprint, request, jsonify, g, current_app
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from app.database.database import SessionLocal
from app.middleware.auth import token_required
from app.services.movimentacao_service import (
    criar_movimentacao_vazia,
    adicionar_produto_em_carrinho,
    get_itens_carrinho,
    finalizar_movimentacao,
)
from app.services.usuarios_service import usuario_tem_acesso_ao_comercio
from app.utils.model_utils import model_to_dict
from app.models.movimentacao_model import Movimentacao
from app.models.carrinho_model import Carrinho
from app.models.carrinho_item_model import CarrinhoItem
from app.models.produtos_model import Produto

bp = Blueprint("movimentacoes", __name__, url_prefix="/movimentacoes")


def _format_cart_with_items(db, cart: Carrinho):
    itens_objs = get_itens_carrinho(db=db, carrinho_id=cart.carrinho_id)
    itens_formatados = []
    total_carrinho = Decimal("0.00")

    for item in itens_objs:
        produto = item.produto
        if not produto:
            current_app.logger.error(f"Item {item.item_id} sem produto associado.")
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
    return cart_dict


def _parse_comercio_id(val):
    try:
        return int(val)
    except Exception:
        return None


@bp.route("/<string:link>/carrinho", methods=["GET"])
@token_required
def get_carrinho_de_mov(link):
    usuario = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    comercio_id = _parse_comercio_id(request.args.get("comercio_id"))

    if not all([usuario, usuario_id, comercio_id]):
        return jsonify({"msg": "erro de autenticação"}), 401

    db = SessionLocal()
    try:
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "autoridade insuficiente"}), 401

        mov = db.query(Movimentacao).filter(
            Movimentacao.link == link,
            Movimentacao.comercio_id == comercio_id
        ).first()
        if mov is None:
            return jsonify({"msg": "mov não encontrado"}), 400

        cart = db.query(Carrinho).filter(Carrinho.carrinho_id == mov.carrinho_id).first()
        if cart is None:
            return jsonify({"msg": "carrinho não encontrado"}), 400

        cart_dict = _format_cart_with_items(db, cart)
        return jsonify({"carrinho": cart_dict, "movimentacao": model_to_dict(mov)}), 200
    except SQLAlchemyError:
        current_app.logger.exception("Erro ao pegar carrinho")
        return jsonify({"error": "Erro interno ao pegar carrinho."}), 500
    finally:
        db.close()


@bp.route("/<string:link>/carrinho", methods=["POST"])
@token_required
def create_carrinho_for_mov(link):
    usuario = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    data = request.get_json() or {}
    comercio_id = _parse_comercio_id(data.get("comercio_id"))

    if not all([usuario, usuario_id, comercio_id]):
        return jsonify({"msg": "erro de autenticação"}), 401

    db = SessionLocal()
    try:
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "autoridade insuficiente"}), 401

        mov = db.query(Movimentacao).filter(
            Movimentacao.link == link,
            Movimentacao.comercio_id == comercio_id
        ).first()

        if mov is None:
            mov = criar_movimentacao_vazia(db=db, tipo="entrada", comercio_id=comercio_id, link_param=link)
            db.commit()
            db.refresh(mov)

        cart = db.query(Carrinho).filter(Carrinho.carrinho_id == mov.carrinho_id).first()
        if cart is None:
            return jsonify({"msg": "falha ao criar carrinho"}), 500

        cart_dict = _format_cart_with_items(db, cart)
        return jsonify({"carrinho": cart_dict, "movimentacao": model_to_dict(mov)}), 201
    except IntegrityError:
        current_app.logger.exception("Falha de integridade ao criar movimentação/carrinho")
        return jsonify({"error": "Erro ao criar movimentação/carrinho."}), 500
    except Exception:
        current_app.logger.exception("Erro inesperado ao criar movimentação/carrinho")
        return jsonify({"error": "Erro interno."}), 500
    finally:
        db.close()


@bp.route("/<string:link>/carrinho/p/<int:produto_id>", methods=["POST"])
@token_required
def add_item_a_mov(link, produto_id):
    usuario = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    data = request.get_json() or {}
    comercio_id = _parse_comercio_id(data.get("comercio_id"))
    quantidade = data.get("quantidade")
    desconto = data.get("desconto_percentual", None)

    if not all([usuario, usuario_id, comercio_id]):
        return jsonify({"msg": "erro de autenticação"}), 401

    try:
        quantidade = int(quantidade)
    except (TypeError, ValueError):
        return jsonify({"msg": "comercio_id e quantidade inválidos"}), 400

    db = SessionLocal()
    try:
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "autoridade insuficiente"}), 401

        mov = db.query(Movimentacao).filter(
            Movimentacao.link == link,
            Movimentacao.comercio_id == comercio_id
        ).first()
        if mov is None:
            return jsonify({"msg": "mov não encontrado"}), 400

        cart = db.query(Carrinho).filter(Carrinho.carrinho_id == mov.carrinho_id).first()
        if cart is None:
            return jsonify({"msg": "carrinho não encontrado"}), 400

        prod = db.query(Produto).filter(
            Produto.produto_id == produto_id,
            Produto.comercio_id == comercio_id
        ).first()
        if prod is None:
            return jsonify({"msg": "produto não encontrado"}), 400

        item = adicionar_produto_em_carrinho(
            db=db,
            carrinho_id=cart.carrinho_id,
            produto_id=produto_id,
            quantidade=quantidade,
            comercio_id=comercio_id,
            desconto_percentual=(Decimal(str(desconto)) if desconto is not None else None),
        )
        if item is None:
            return jsonify({"msg": "falha ao adicionar item"}), 400

        db.commit()
        # refresh do cart não é estritamente necessário aqui, porque formatamos lendo itens do DB
        cart_dict = _format_cart_with_items(db, cart)
        return jsonify({"carrinho": cart_dict}), 200
    except ValueError as ve:
        db.rollback()
        return jsonify({"msg": str(ve)}), 400
    except SQLAlchemyError:
        db.rollback()
        current_app.logger.exception("Erro ao adicionar item ao carrinho")
        return jsonify({"error": "Erro interno ao adicionar item."}), 500
    finally:
        db.close()


@bp.route("/<string:link>/carrinho/item/<int:item_id>", methods=["DELETE"])
@token_required
def delete_item_from_cart(link, item_id):
    usuario = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    comercio_id = _parse_comercio_id(request.args.get("comercio_id") or (request.get_json() or {}).get("comercio_id"))

    if not all([usuario, usuario_id, comercio_id]):
        return jsonify({"msg": "erro de autenticação"}), 401

    db = SessionLocal()
    try:
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "autoridade insuficiente"}), 401

        mov = db.query(Movimentacao).filter(
            Movimentacao.link == link,
            Movimentacao.comercio_id == comercio_id
        ).first()
        if mov is None:
            return jsonify({"msg": "mov não encontrado"}), 400

        cart = db.query(Carrinho).filter(Carrinho.carrinho_id == mov.carrinho_id).first()
        if cart is None:
            return jsonify({"msg": "carrinho não encontrado"}), 400

        item = db.query(CarrinhoItem).filter(
            CarrinhoItem.item_id == item_id,
            CarrinhoItem.carrinho_id == cart.carrinho_id
        ).first()
        if item is None:
            return jsonify({"msg": "item não encontrado no carrinho"}), 400

        db.delete(item)
        db.commit()
        cart_dict = _format_cart_with_items(db, cart)
        return jsonify({"carrinho": cart_dict}), 200
    except SQLAlchemyError:
        db.rollback()
        current_app.logger.exception("Erro ao deletar item do carrinho")
        return jsonify({"error": "Erro interno ao deletar item."}), 500
    finally:
        db.close()


@bp.route("", methods=["POST"])
@token_required
def salvar_movimentacao():
    usuario = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    data = request.get_json() or {}

    comercio_id = _parse_comercio_id(data.get("comercio_id"))
    carrinho_id = _parse_comercio_id(data.get("carrinho_id"))
    tipo = data.get("tipo")

    if not all([usuario, usuario_id, comercio_id, carrinho_id, tipo]):
        return jsonify({"msg": "dados incompletos"}), 400

    db = SessionLocal()
    try:
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            db.close()
            return jsonify({"msg": "autoridade insuficiente"}), 401

        mov = db.query(Movimentacao).filter(
            Movimentacao.carrinho_id == carrinho_id,
            Movimentacao.comercio_id == comercio_id,
            Movimentacao.estado == "aberta"
        ).first()

        if mov is None:
            db.close()
            return jsonify({"msg": "movimentação não encontrada ou já fechada"}), 400

        mov = finalizar_movimentacao(db=db, mov_id=mov.mov_id, comercio_id=comercio_id, tipo=tipo)
        
        db.commit()
        
        return jsonify({"movimentacao": model_to_dict(mov)}), 200
        
    except ValueError as ve:
        db.rollback()
        return jsonify({"msg": str(ve)}), 400
    except Exception as e:
        db.rollback()
        current_app.logger.exception("Erro ao salvar movimentação")
        return jsonify({"error": "Erro interno."}), 500
    finally:
        db.close()
