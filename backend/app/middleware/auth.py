from functools import wraps
from flask import request, jsonify, g
import jwt
import os

SECRET_KEY = os.getenv("SECRET_KEY", "muda_esse_segredo")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get("access_token")

        if not token:
            return jsonify({'mensagem': 'Token ausente!'}), 401

        try:
            dados = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            g.user = dados  # guarda no contexto da request
        except jwt.ExpiredSignatureError:
            return jsonify({'mensagem': 'Token expirado!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'mensagem': 'Token inválido!'}), 401

        return f(*args, **kwargs)

    return decorated
