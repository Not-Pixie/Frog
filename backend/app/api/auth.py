# app/api/auth.py
from flask import Blueprint, request, jsonify, g, current_app, make_response
from werkzeug.security import check_password_hash
import jwt
import datetime
from app.database.database import SessionLocal
from app.models.usuarios_model import Usuario
from app.middleware.auth import token_required  # ajusta o path se necessário

comercio_bp = Blueprint("comercio_api", __name__, url_prefix="/api/comercio")

# login: valida credenciais, retorna token e seta cookie httpOnly
@comercio_bp.route("/login", methods=["POST"])
def login():
    body = request.get_json() or {}
    email = body.get("email")
    senha = body.get("senha")

    if not email or not senha:
        return jsonify({"mensagem": "email e senha obrigatórios"}), 400

    db = SessionLocal()
    try:
        user = db.query(Usuario).filter(Usuario.email == email).first()
        if not user:
            return jsonify({"mensagem": "Credenciais inválidas"}), 401

        # supondo que Usuario tenha atributo 'senha_hash'
        if not check_password_hash(user.senha_hash, senha):
            return jsonify({"mensagem": "Credenciais inválidas"}), 401

        payload = {
            "usuario_id": user.usuario_id,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8)  # ajuste expiração
        }
        token = jwt.encode(payload, current_app.config.get("SECRET_KEY"), algorithm="HS256")

        resp = make_response(jsonify({"access_token": token}))  # opcional: retorno do token também
        # Cookie: HttpOnly para segurança. Em produção use secure=True (https).
        resp.set_cookie(
            "access_token",
            token,
            httponly=True,
            samesite="Lax",  # ou "Strict"/"None" se preciso
            secure=False,    # coloque True em produção (https)
            max_age=8*3600
        )
        return resp
    finally:
        db.close()


# rota para retornar info do usuario atual (protegida)
@comercio_bp.route("/me", methods=["GET"])
@token_required
def me():
    # token_required colocou o payload decodificado em g.usuario
    payload = g.get("usuario")
    usuario_id = payload.get("usuario_id")
    if not usuario_id:
        return jsonify({"usuario": None}), 200

    db = SessionLocal()
    try:
        user = db.query(Usuario).get(usuario_id)
        if not user:
            return jsonify({"usuario": None}), 200

        return jsonify({
            "usuario": {
                "usuario_id": user.usuario_id,
                "email": user.email,
                "nome": getattr(user, "nome", None)
            }
        }), 200
    finally:
        db.close()


# função utilitária para outras rotas obterem o user model
def get_current_user():
    payload = g.get("usuario") or None
    current_app.logger.debug(payload)
    usuario_id = payload.get("usuario_id")
    if not usuario_id:
        return None
    db = SessionLocal()
    try:
        return db.query(Usuario).get(usuario_id)
    finally:
        db.close()
