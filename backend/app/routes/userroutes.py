from flask import Blueprint, jsonify, request
from sqlalchemy.orm import Session
from backend.config import SessionLocal
from backend.app.services import userservice

usuario_bp = Blueprint("usuario", __name__, url_prefix="/usuarios")

@usuario_bp.route("/", methods=["GET"])
def listar():
    db: Session = SessionLocal()
    usuarios = userservice.listar_usuarios(db)
    return jsonify([{
        "id": u.id_usuario,
        "nome": u.nome,
        "email": u.email,
        "ativado": u.ativado
    } for u in usuarios])

@usuario_bp.route("/", methods=["POST"])
def criar():
    db: Session = SessionLocal()
    dados = request.json
    usuario = userservice.criar_usuario(db, dados)
    return jsonify({
        "id": usuario.id_usuario,
        "nome": usuario.nome,
        "email": usuario.email,
        "ativado": usuario.ativado
    }), 201
