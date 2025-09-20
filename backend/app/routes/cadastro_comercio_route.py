# app/routes/comercios.py
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from app.services.cadastro_comercio_service import criar_comercio
# import your auth helper to get current user. Ajuste conforme seu projeto:
from app.api.auth import get_current_user  # exemplo; troque se usar flask_jwt_extended

bp = Blueprint("comercios", __name__, url_prefix="/api/comercios")

@bp.route("", methods=["POST"])
def create_comercio():
    # Requer autenticação: implemente decorador se necessário
    user = get_current_user()  # deve devolver o usuário logado ou None
    if not user:
        return jsonify({"msg": "Autenticação necessária."}), 401

    body = request.get_json() or {}
    nome = (body.get("nome") or "").strip()
    email = body.get("email")
    configs = body.get("configs")  # objeto opcional com campos

    if not nome:
        return jsonify({"msg": "Campo 'nome' é obrigatório."}), 400

    try:
        comercio = criar_comercio(user.usuario_id, nome, configs=configs)
    except IntegrityError:
        # nome duplicado
        return jsonify({"msg": "Nome de comércio já existe."}), 409
    except Exception as e:
        # logar erro real no servidor
        return jsonify({"msg": "Erro interno."}), 500

    # resposta minimal: id e nome (coloque o que quiser)
    return jsonify({
        "comercio_id": comercio.comercio_id,
        "nome": comercio.nome,
        "criado_em": comercio.criado_em.isoformat() if comercio.criado_em else None
    }), 201
