from flask import Blueprint, make_response, request, jsonify
from config import get_db
from app.services.cadastro_service import get_usuario_por_email
import bcrypt
import jwt
import datetime
import os

auth = Blueprint("auth", __name__)
SECRET_KEY = os.getenv("SECRET_KEY", "secreto")

@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    senha = data.get('senha')

    db_gen = get_db()
    db = next(db_gen)

    try:
        usuario = get_usuario_por_email(db, email)
        if not usuario:
            return jsonify({"mensagem": "Usuário não encontrado"}), 404

        if not bcrypt.checkpw(senha.encode('utf-8'), usuario.senha.encode('utf-8')):
            return jsonify({"mensagem": "Senha incorreta"}), 401

        token = jwt.encode({
            "user_id": usuario.id_usuario,
            "email": usuario.email,
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
        }, SECRET_KEY, algorithm="HS256")
        
        resp = make_response(
            jsonify({
            "token": token,
            "usuario": {
                "id": usuario.id_usuario,
                "email": usuario.email,
                "nome": usuario.nome
            }
        })
        )
        
        resp.set_cookie("token", token, httponly=True, samesite='Strict', secure=True)

        return resp; 200
    finally:
        db_gen.close()
