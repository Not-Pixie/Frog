# app/routes/produtos_lista_route.py
from flask import Blueprint, jsonify, current_app
from sqlalchemy.exc import SQLAlchemyError
from app.models import Produto
from app.models import Categoria       # ajuste caminhos conforme seu projeto
from app.models import Fornecedor
from app.database.database import db_session      # ou import db / session conforme sua infra

# importe o decorator token_required do seu módulo de auth
from app.api.auth import token_required

produtos_bp = Blueprint("produtos_bp", __name__, url_prefix="/api/comercios/<int:comercio_id>/produtos")

@produtos_bp.route("", methods=["GET"])
@token_required
def listar_produtos(comercio_id):
    """
    Retorna todos os produtos de um comercio, já com categoriaNome e fornecedorNome.
    """
    try:
        # Usando ORM com relationships lazy='joined' (se definido no model, já faz o JOIN)
        produtos = db_session.query(Produto).filter(Produto.comercio_id == comercio_id).all()

        items = [p.to_dict() for p in produtos]
        return jsonify({"items": items, "total": len(items)}), 200
    except SQLAlchemyError:
        current_app.logger.exception("Erro ao listar produtos com join")
        return jsonify({"error": "Erro interno ao listar produtos"}), 500
