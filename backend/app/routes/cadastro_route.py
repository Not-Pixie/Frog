from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session
from app.services.cadastro_service import cadastrar_completo
from config import SessionLocal

cadastro_bp = Blueprint("cadastro", __name__, url_prefix="/cadastro")

@cadastro_bp.route("/", methods=["POST"])
def cadastrar_usuario():
    db: Session = SessionLocal()
    try:
        data = request.json
        nome = data["nome_completo"]
        email = data["email"]
        senha = data["senha"]
        nome_negocio = data["nome_negocio"]

        usuario, negocio = cadastrar_completo(db, nome, email, senha, nome_negocio)

        return jsonify({
            "mensagem": "Cadastro realizado com sucesso.",
            "usuario_id": usuario.id,
            "negocio_id": negocio.id
        }), 201
    except Exception as e:
        return jsonify({"erro": str(e)}), 400
    finally:
        db.close()
