from functools import wraps
from flask import request, jsonify
import jwt
import os

SECRET_KEY = os.getenv("SECRET_KEY", "secreto")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'mensagem': 'Token ausente!'}), 401

        try:
            dados = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({'mensagem': 'Token expirado!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'mensagem': 'Token inválido!'}), 401

        return f(*args, **kwargs)

    return decorated
