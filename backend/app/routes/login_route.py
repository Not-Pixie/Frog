from flask import Blueprint, make_response, request, jsonify, g
from config import get_db
from app.services.cadastro_user__service import get_usuario_por_email
from passlib.hash import bcrypt
import jwt
import datetime
import os
import uuid

auth = Blueprint("auth", __name__)
SECRET_KEY = os.getenv("SECRET_KEY", "muda_esse_segredo")

# === utilitário para criar tokens ===
def _make_jwt(payload: dict, expire_minutes: int = 60) -> str:
    claims = payload.copy()
    claims.update({
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=expire_minutes),
        "iat": datetime.datetime.utcnow(),
        "jti": str(uuid.uuid4())
    })
    token = jwt.encode(claims, SECRET_KEY, algorithm="HS256")
    if isinstance(token, bytes):
        token = token.decode()
    return token


# === rota de login ===
@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    senha = data.get('senha')

    if not email or not senha:
        return jsonify({"mensagem": "Email e senha são obrigatórios"}), 400

    db_gen = get_db()
    db = next(db_gen)

    try:
        usuario = get_usuario_por_email(db, email)
        if not usuario:
            return jsonify({"mensagem": "Credenciais inválidas"}), 401

        if not bcrypt.verify(senha, usuario.senha_hash):
            return jsonify({"mensagem": "Credenciais inválidas"}), 401

        access = _make_jwt({"user_id": usuario.id, "email": usuario.email}, expire_minutes=60)
        refresh = _make_jwt({"user_id": usuario.id, "type": "refresh"}, expire_minutes=60*24*7)

        resp = make_response(jsonify({
            "usuario": {
                "id": usuario.id,
                "email": usuario.email,
                "nome": usuario.nome_completo
            }
        }))

        # em dev pode deixar secure=False
        secure_flag = os.getenv("FLASK_ENV") == "production"

        resp.set_cookie("access_token", access, httponly=True, samesite='Strict', secure=secure_flag)
        resp.set_cookie("refresh_token", refresh, httponly=True, samesite='Strict', secure=secure_flag)

        return resp, 200
    finally:
        db_gen.close()


# === rota para refresh ===
@auth.route('/refresh', methods=['POST'])
def refresh():
    refresh_token = request.cookies.get('refresh_token')
    if not refresh_token:
        return jsonify({'mensagem': 'Refresh token ausente'}), 401

    try:
        dados = jwt.decode(refresh_token, SECRET_KEY, algorithms=["HS256"])
        if dados.get('type') != 'refresh':
            return jsonify({'mensagem': 'Token inválido'}), 401

        new_access = _make_jwt({"user_id": dados['user_id']}, expire_minutes=60)
        resp = make_response(jsonify({'mensagem': 'ok'}))
        secure_flag = os.getenv("FLASK_ENV") == "production"
        resp.set_cookie("access_token", new_access, httponly=True, samesite='Strict', secure=secure_flag)
        return resp
    except jwt.ExpiredSignatureError:
        return jsonify({'mensagem': 'Refresh token expirado'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'mensagem': 'Token inválido'}), 401


# === rota de logout ===
@auth.route('/logout', methods=['POST'])
def logout():
    resp = make_response(jsonify({'mensagem': 'Deslogado'}))
    resp.delete_cookie('access_token')
    resp.delete_cookie('refresh_token')
    return resp

# === Rota de verificação de autenticação ===
@auth.route('/api/me', methods=['GET'])
def me():
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({'mensagem': 'Token de acesso ausente'}), 401

    try:
        dados = jwt.decode(access_token, SECRET_KEY, algorithms=["HS256"])
        user_id = dados.get('user_id')
        if not user_id:
            return jsonify({'mensagem': 'Token inválido'}), 401

        db_gen = get_db()
        db = next(db_gen)
        usuario = get_usuario_por_email(db, dados['email'])
        
        if not usuario:
            return jsonify({'mensagem': 'Usuário não encontrado'}), 404

        return jsonify({
            'user': {
                'id': usuario.id,
                'email': usuario.email,
                'nome': usuario.nome_completo
            }
        }), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'mensagem': 'Token expirado'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'mensagem': 'Token inválido'}), 401
    finally:
        db_gen.close()