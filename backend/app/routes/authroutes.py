from flask import Blueprint, request, jsonify
from config import get_db
from app.services.userservice import get_usuario_por_email
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

        senha_correta = bcrypt.checkpw(senha.encode('utf-8'), usuario.senha.encode('utf-8'))
        if not senha_correta:
            return jsonify({"mensagem": "Senha incorreta"}), 401

        token = jwt.encode({
            "user_id": usuario.id_usuario,
            "email": usuario.email,
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
        }, SECRET_KEY, algorithm="HS256")

        return jsonify({
            "token": token,
            "usuario": {
                "id": usuario.id_usuario,
                "email": usuario.email,
                "nome": usuario.nome
            }
        })
    finally:
        db_gen.close()
