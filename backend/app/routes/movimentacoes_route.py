from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from flask import Blueprint, current_app, request, jsonify, g
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.middleware.auth import token_required
from app.database.database import SessionLocal

from app.services.usuarios_service import usuario_tem_acesso_ao_comercio
from app.utils.model_utils import model_to_dict
from app.models.movimentacao_model import Movimentacao
from app.models.carrinho_model import Carrinho
from app.services.movimentacao_service import (
    adicionar_produto_em_carrinho,
    get_itens_carrinho,
    criar_movimentacao_vazia,
)
from app.models.produtos_model import Produto
from app.models.carrinho_item_model import CarrinhoItem

bp = Blueprint("movimentacoes", __name__, url_prefix="/movimentacoes")


def _format_cart_with_items(db, cart: Carrinho):
    """
    Retorna dicionário consistente do carrinho com:
    - Nome do produto
    - Preço correto (vindo da tabela produtos)
    - Cálculo de subtotal considerando quantidade
    """
    # Busca os objetos do banco (assumindo que lazy='joined' trará os produtos)
    itens_objs = get_itens_carrinho(db=db, carrinho_id=cart.carrinho_id)
    
    itens_formatados = []
    total_carrinho = Decimal("0.00")

    for item in itens_objs:
        try:
            # Acessa o produto através do relacionamento definido no model
            produto = item.produto
            
            if not produto:
                # Caso de inconsistência (item no carrinho sem produto linkado)
                current_app.logger.error(f"Item {item.item_id} sem produto associado.")
                continue

            # Conversão segura para Decimal
            preco = Decimal(produto.preco)
            quantidade = Decimal(item.quantidade)
            
            # Cálculo base
            subtotal = preco * quantidade

            # (Opcional) Se você quiser aplicar o desconto do item aqui:
            if item.desconto_percentual:
                 fator_desconto = Decimal(item.desconto_percentual) / 100
                 valor_desconto = subtotal * fator_desconto
                 subtotal = subtotal - valor_desconto

            # Acumula no total geral
            total_carrinho += subtotal

            # Monta o dicionário do item manualmente para garantir os campos certos
            item_dict = {
                "item_id": item.item_id,
                "produto_id": produto.produto_id,
                "nome_produto": produto.nome,      # Aqui está o nome solicitado
                "imagem": produto.imagem if hasattr(produto, 'imagem') else None, # Se tiver imagem
                "preco_unitario": str(preco.quantize(Decimal("0.01"))), # Preço formatado
                "quantidade": int(quantidade),
                "desconto_percentual": str(item.desconto_percentual) if item.desconto_percentual else "0",
                "subtotal": str(subtotal.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
            }
            
            itens_formatados.append(item_dict)

        except Exception as e:
            current_app.logger.exception(f"Erro ao formatar item {item.item_id}: {str(e)}")
            continue

    # Arredondamento final do carrinho
    total_carrinho = total_carrinho.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # Monta a resposta final
    # Usamos model_to_dict no carrinho apenas para pegar campos básicos (id, datas)
    # mas sobrescrevemos 'itens' e 'valor_total'
    cart_dict = model_to_dict(cart)
    cart_dict["itens"] = itens_formatados
    cart_dict["valor_total"] = str(total_carrinho)
    
    return cart_dict


@bp.route("/<string:link>/carrinho", methods=["GET"])
@token_required
def get_carrinho_de_mov(link):
    """
    Retorna o carrinho completo associado à movimentação (por link).
    Se o mov/carrinho não existir, retorna 400 com msg clara.
    """
    usuario = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    comercio_id = request.args.get("comercio_id")
    current_app.logger.debug("Começou")

    if usuario is None or usuario_id is None or comercio_id is None:
        current_app.logger.debug("É aqui mesmo")
        return jsonify({"msg": "erro de autenticação"}), 401

    db = SessionLocal()
    try:
        #O código a seguir não está me identificando ;-;
        #if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            # return jsonify({"msg": "erro de autenticação"}), 401
        
        current_app.logger.debug("Passou")

        mov = db.query(Movimentacao).filter(Movimentacao.link == link).first()
        if mov is None:
            return jsonify({"msg": "mov não encontrado"}), 400

        cart = db.query(Carrinho).filter(Carrinho.carrinho_id == mov.carrinho_id).first()
        if cart is None:
            return jsonify({"msg": "carrinho não encontrado"}), 400

        cart_dict = _format_cart_with_items(db, cart)
        return jsonify({"carrinho": cart_dict}), 200

    except SQLAlchemyError:
        db.rollback()
        current_app.logger.exception("Erro ao pegar carrinho")
        return jsonify({"error": "Erro interno ao pegar carrinho."}), 500
    except Exception:
        db.rollback()
        current_app.logger.exception("Erro inesperado ao pegar carrinho")
        return jsonify({"error": "Erro interno."}), 500
    finally:
        db.close()


@bp.route("/<string:link>/carrinho", methods=["POST"])
@token_required
def create_carrinho_for_mov(link):
    """
    Cria uma movimentação + carrinho vazio associada ao link (se necessário).
    Útil quando o frontend quer garantir que exista um carrinho para o link.
    Retorna o carrinho criado no formato consistente.
    """
    usuario = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    data = request.get_json() or {}
    comercio_id = data.get("comercio_id")

    if not all([usuario, usuario_id, comercio_id]):
        return jsonify({"msg": "erro de autenticação"}), 401

    comercio_id = int(comercio_id)
    db = SessionLocal()
    try:
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "autoridade insuficiente"}), 401

        # cria movimentação vazia (que cria carrinho internamente) e retorna mov
        mov = criar_movimentacao_vazia(db=db, tipo="entrada", comercio_id=comercio_id)
        db.commit()
        db.refresh(mov)

        cart = db.query(Carrinho).filter(Carrinho.carrinho_id == mov.carrinho_id).first()
        if cart is None:
            return jsonify({"msg": "falha ao criar carrinho"}), 500

        cart_dict = _format_cart_with_items(db, cart)
        return jsonify({"carrinho": cart_dict}), 201

    except IntegrityError:
        db.rollback()
        current_app.logger.exception("Falha de integridade ao criar movimentação/carrinho")
        return jsonify({"error": "Erro ao criar movimentação/carrinho."}), 500
    except Exception:
        db.rollback()
        current_app.logger.exception("Erro inesperado ao criar movimentação/carrinho")
        return jsonify({"error": "Erro interno."}), 500
    finally:
        db.close()


@bp.route("/<string:link>/carrinho/p/<int:produto_id>", methods=["POST"])
@token_required
def add_item_a_mov(link, produto_id):
    """
    Adiciona/atualiza um item no carrinho associado ao link.
    Espera JSON { comercio_id, quantidade, [desconto_percentual] }.
    Retorna o carrinho completo atualizado.
    """
    usuario = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None

    data = request.get_json() or {}
    comercio_id = data.get("comercio_id")
    quantidade = data.get("quantidade")
    desconto = data.get("desconto_percentual", None)

    if not all([usuario, usuario_id, comercio_id]):
        return jsonify({"msg": "erro de autenticação"}), 401

    try:
        comercio_id = int(comercio_id)
        quantidade = int(quantidade)
    except (TypeError, ValueError):
        return jsonify({"msg": "comercio_id e quantidade inválidos"}), 400

    db = SessionLocal()
    try:
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "autoridade insuficiente"}), 401

        mov = db.query(Movimentacao).filter(Movimentacao.link == link).first()
        if mov is None:
            return jsonify({"msg": "mov não encontrado"}), 400

        cart = db.query(Carrinho).filter(Carrinho.carrinho_id == mov.carrinho_id).first()
        if cart is None:
            return jsonify({"msg": "carrinho não encontrado"}), 400

        prod = db.query(Produto).filter(Produto.produto_id == produto_id).first()
        if prod is None:
            return jsonify({"msg": "produto não encontrado"}), 400

        # adicionar produto (serviço lida com criação/atualização do item)
        item = adicionar_produto_em_carrinho(
            db=db,
            produto_id=produto_id,
            carrinho_id=cart.carrinho_id,
            comercio_id=comercio_id,
            quantidade=quantidade,
            desconto_percentual=(Decimal(str(desconto)) if desconto is not None else None),
        )

        if item is None:
            return jsonify({"msg": "falha ao adicionar item"}), 400

        db.commit()
        db.refresh(cart)

        cart_dict = _format_cart_with_items(db, cart)
        return jsonify({"carrinho": cart_dict}), 200

    except ValueError as ve:
        db.rollback()
        return jsonify({"msg": str(ve)}), 400
    except SQLAlchemyError:
        db.rollback()
        current_app.logger.exception("Erro ao adicionar item ao carrinho")
        return jsonify({"error": "Erro interno ao adicionar item."}), 500
    except Exception:
        db.rollback()
        current_app.logger.exception("Erro inesperado ao adicionar item")
        return jsonify({"error": "Erro interno."}), 500
    finally:
        db.close()


@bp.route("/<string:link>/carrinho/item/<int:item_id>", methods=["DELETE"])
@token_required
def delete_item_from_cart(link, item_id):
    """
    Remove um item do carrinho associado ao link.
    Retorna o carrinho atualizado.
    """
    usuario = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    comercio_id = request.args.get("comercio_id") or (request.get_json() or {}).get("comercio_id")

    if not all([usuario, usuario_id, comercio_id]):
        return jsonify({"msg": "erro de autenticação"}), 401

    try:
        comercio_id = int(comercio_id)
    except (TypeError, ValueError):
        return jsonify({"msg": "comercio_id inválido"}), 400

    db = SessionLocal()
    try:
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "autoridade insuficiente"}), 401

        mov = db.query(Movimentacao).filter(Movimentacao.link == link).first()
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
        db.refresh(cart)

        cart_dict = _format_cart_with_items(db, cart)
        return jsonify({"carrinho": cart_dict}), 200

    except SQLAlchemyError:
        db.rollback()
        current_app.logger.exception("Erro ao deletar item do carrinho")
        return jsonify({"error": "Erro interno ao deletar item."}), 500
    except Exception:
        db.rollback()
        current_app.logger.exception("Erro inesperado ao deletar item")
        return jsonify({"error": "Erro interno."}), 500
    finally:
        db.close()


# Opcional: rota para deletar/cancelar carrinho/movimentação (se quiser)
@bp.route("/<string:link>/carrinho", methods=["DELETE"])
@token_required
def delete_carrinho_and_mov(link):
    """
    Exclui (ou marca como cancelada) a movimentação/carrinho associado ao link.
    IMPORTANTE: atue com cuidado — este endpoint deve refletir a política do negócio.
    """
    usuario = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    comercio_id = request.args.get("comercio_id") or (request.get_json() or {}).get("comercio_id")

    if not all([usuario, usuario_id, comercio_id]):
        return jsonify({"msg": "erro de autenticação"}), 401

    try:
        comercio_id = int(comercio_id)
    except (TypeError, ValueError):
        return jsonify({"msg": "comercio_id inválido"}), 400

    db = SessionLocal()
    try:
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "autoridade insuficiente"}), 401

        mov = db.query(Movimentacao).filter(Movimentacao.link == link).first()
        if mov is None:
            return jsonify({"msg": "mov não encontrado"}), 400

        cart = db.query(Carrinho).filter(Carrinho.carrinho_id == mov.carrinho_id).first()
        if cart is None:
            return jsonify({"msg": "carrinho não encontrado"}), 400

        # Excluir itens primeiro
        db.query(CarrinhoItem).filter(CarrinhoItem.carrinho_id == cart.carrinho_id).delete()
        # Opcional: remover carrinho e/ou marcar mov como cancelada
        db.delete(cart)
        # marcar movimentacao como cancelada/excluida em vez de remover? depende da regra de negócio
        mov.estado = "cancelada"
        db.commit()
        return jsonify({"msg": "carrinho e movimentacao cancelados"}), 200

    except SQLAlchemyError:
        db.rollback()
        current_app.logger.exception("Erro ao deletar carrinho")
        return jsonify({"error": "Erro interno ao deletar carrinho."}), 500
    except Exception:
        db.rollback()
        current_app.logger.exception("Erro inesperado ao deletar carrinho")
        return jsonify({"error": "Erro interno."}), 500
    finally:
        db.close()
