# app/routes/comercios.py
from flask import Blueprint, current_app, request, jsonify
from sqlalchemy.exc import IntegrityError
from app.services.cadastro_comercio_service import criar_comercio
from app.api.auth import get_current_user
from app.middleware.auth import token_required
from app.services.usuarios_service import get_comercios_que_usuario_tem_acesso
from app.database.database import SessionLocal 

bp = Blueprint("comercios", __name__, url_prefix="/api/comercios")

@bp.route("", methods=["POST"])
@token_required
def create_comercio():
    user = get_current_user()
    if not user:
        return jsonify({"msg": "Autenticação necessária."}), 401
    
    comercios = get_comercios_que_usuario_tem_acesso(usuario_id=getattr(user, "usuario_id"), db=SessionLocal())
    qtd_comercios = len(comercios)
    if qtd_comercios >= 5: 
        return jsonify({"msg":"Limite de Comercios atingido"}), 400
        
    body = request.get_json() or {}
    nome = (body.get("nome") or "").strip()
    configs = body.get("configs") or None

    if not nome:
        return jsonify({"msg": "Campo 'nome' é obrigatório."}), 400

    try:
        comercio = criar_comercio(user.usuario_id, nome, configs=configs)
    except IntegrityError:
        return jsonify({"msg": "Nome de comércio já existe."}), 409
    except Exception as e:
        # ideal: log do erro real (logger.exception)
        current_app.logger.debug(e)
        return jsonify({"msg": "Erro interno."}), 500

    return jsonify({
        "comercio_id": comercio.comercio_id,
        "nome": comercio.nome,
        "configuracao_id": comercio.configuracao_id,
        "criado_em": comercio.criado_em.isoformat() if comercio.criado_em else None
    }), 201

