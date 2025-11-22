from decimal import Decimal
from flask import Blueprint, current_app, request, jsonify, g
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.middleware.auth import token_required
from app.database.database import SessionLocal

from app.services.usuarios_service import usuario_tem_acesso_ao_comercio
from app.utils.model_utils import model_to_dict
from app.services.fornecedor_service import create_fornecedor, get_fornecedor_por_id, update_fornecedor, delete_fornecedor
from app.services.categoria_service import create_categoria, delete_categoria, get_categoria_por_id, update_categoria
from app.models.movimentacao_model import Movimentacao
from decimal import ROUND_HALF_UP, InvalidOperation
from app.models.carrinho_model import Carrinho


bp = Blueprint("movimentacoes", __name__, url_prefix="/comercios")

@bp.route("/<int:link>/carrinho", methods=["GET"])
@token_required
def get_carrinho_de_mov(link):
    """PENDENTE"""
    usuario = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    comercio_id = request.args.get("comercio_id")
    
    if usuario is None or usuario_id is None or comercio_id is None:
        return jsonify({"msg": "erro de autenticação"}), 401


    db = SessionLocal()
    try:
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "erro de autenticação"}), 401
        
        mov = db.query(Movimentacao).filter(Movimentacao.link == link).first()
        
        cart = db.query(Carrinho).filter(
            Carrinho.carrinho_id == mov.carrinho_id
        ).first()
        
        if cart is None:
            return jsonify({"msg": "carrinho não encontrado(como isso é possível?)"}), 400
        
        return jsonify({"carrinho": cart}), 200
    
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
        

@bp.route("/<int:link>/carrinho/p/<int:produto_id>", methods=["POST"])
@token_required
def get_carrinho_de_mov(link, produto_id):
    """PENDENTE"""
    usuario = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    comercio_id = request.args.get("comercio_id")
    
    if usuario is None or usuario_id is None or comercio_id is None:
        return jsonify({"msg": "erro de autenticação"}), 401


    db = SessionLocal()
    try:
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "erro de autenticação"}), 401
        
        mov = db.query(Movimentacao).filter(Movimentacao.link == link).first()
        
        cart = db.query(Carrinho).filter(
            Carrinho.carrinho_id == mov.carrinho_id
        ).first()
        
        if cart is None:
            return jsonify({"msg": "carrinho não encontrado(como isso é possível?)"}), 400
        
        
    
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