# app/blueprints/convites.py
import os
from flask import Blueprint, current_app, g, request, jsonify
from app.middleware.auth import token_required  #
from app.database.database import SessionLocal, get_db
from app.utils.convites_utils import validar_convite, aceitar_convite
from sqlalchemy.exc import SQLAlchemyError

bp = Blueprint("convites", __name__, url_prefix="/convites")

@bp.route('/', methods=['GET'])
@bp.route('/<invite_code>', methods=['GET'])
@token_required
def get_convite(invite_code=None):
    """
    GET /convites?inviteCode=xxx  OR GET /convites/<invite_code>
    Retorna JSON compatível com o front:
    { isValid: bool, comercio: {...}?, message?: "..." }
    """
    current_app.logger.debug(f"ENTROU /convites, invite_code={invite_code}, headers={dict(request.headers)}")
    # prioriza path param, depois query param
    if not invite_code:
        invite_code = request.args.get("inviteCode")
        
    usuario: dict = g.get("usuario")

    db_gen = None
    try:
        db_gen = get_db()
        db = next(db_gen)
        result = validar_convite(invite_code, usuario, db)
        return jsonify(result), 200 if result.get("isValid") else 400
    except SQLAlchemyError as e:
        current_app.logger.exception("Erro DB em get_convite")
        return jsonify({"isValid": False, "message": "Erro interno do servidor"}), 500
    finally:
        if db_gen:
            db_gen.close()


@bp.route('/', methods=['POST'])
@token_required
def post_convite():
    """
    POST /convites
    Body JSON: { "inviteCode": "..." }
    Exige token (token_required) — pega usuário em g
    """
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({"success": False, "message": "Payload JSON ausente"}), 400

    invite_code = payload.get("inviteCode") or payload.get("invite_code") or payload.get("code")
    if not invite_code:
        return jsonify({"success": False, "message": "inviteCode obrigatório"}), 400

    usuario = g.get("usuario")
    if not usuario or not usuario.get("usuario_id"):
        current_app.logger.debug("Usuario ausente no g no endpoint de aceitar convite")
        return jsonify({"success": False, "message": "Usuário não autenticado"}), 401

    usuario_id = usuario.get("usuario_id")

    db_gen = None
    try:
        db_gen = get_db()
        db = next(db_gen)

        result = aceitar_convite(invite_code, usuario_id, db)
        if result.get("success"):
            return jsonify({"success": True, "message": result.get("message", "")}), 200
        else:
            # falha de validação -> 400
            return jsonify({"success": False, "message": result.get("message", "")}), 400

    except Exception as e:
        current_app.logger.exception("Erro ao aceitar convite")
        return jsonify({"success": False, "message": "Erro interno do servidor"}), 500
    finally:
        if db_gen:
            db_gen.close()
