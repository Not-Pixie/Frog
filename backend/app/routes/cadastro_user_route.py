from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session
from ..services.cadastro_user__service import cadastrar_usuario
from config import SessionLocal

cadastro_bp = Blueprint("cadastro", __name__, url_prefix="/cadastro")


@cadastro_bp.route("/", methods=["POST"])
def cadastrar_usuario_route():
    db: Session = SessionLocal()
    print("Recebendo requisição de cadastro de usuário")
    try:
        data = request.json

        nome = data.get("nome")
        email = data.get("email")
        senha = data.get("senha")

        if not nome or not email or not senha:
            return jsonify({"erro": "Nome, e-mail e senha são obrigatórios."}), 400

        usuario = cadastrar_usuario(db, nome, email, senha)

        return jsonify({
            "mensagem": "Cadastro realizado com sucesso.",
            "usuario_id": usuario.usuario_id
        }), 201

    except ValueError as ve:
        # Erro esperado, como e-mail já cadastrado
        return jsonify({"erro": str(ve)}), 400
    except Exception as e:
        # Erro inesperado
        return jsonify({"erro": "Erro interno no servidor.", "detalhes": str(e)}), 500
    finally:
        db.close()
