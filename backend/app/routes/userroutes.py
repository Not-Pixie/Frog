from flask import Blueprint, jsonify, request
from sqlalchemy.orm import Session
from config import SessionLocal
from app.services import userservice
from app.middleware.auth_middleware import token_required

usuario_bp = Blueprint("usuario", __name__, url_prefix="/usuarios")

@usuario_bp.route("/", methods=["GET"])
def listar():
    db: Session = SessionLocal()
    try:
        usuarios = userservice.listar_usuarios(db)
        return jsonify([{
            "id": u.id_usuario,
            "nome": u.nome,
            "email": u.email,
            "ativado": u.ativado
        } for u in usuarios])
    finally:
        db.close()

@usuario_bp.route("/", methods=["POST"])
def criar():
    db: Session = SessionLocal()
    try:
        dados = request.json
        print("DEBUG criar():", dados)
        usuario = userservice.criar_usuario(db, dados)
        return jsonify({
            "id": usuario.id_usuario,
            "nome": usuario.nome,
            "email": usuario.email,
            "ativado": usuario.ativado
        }), 201
    finally:
        db.close()

@usuario_bp.route('/dados', methods=['GET'])
@token_required
def dados_usuario():
    return jsonify({"mensagem": "Você acessou uma rota protegida!"})
