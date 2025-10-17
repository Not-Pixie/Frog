from flask import Blueprint, request, jsonify, g
from sqlalchemy.exc import IntegrityError
from app.middleware.auth import token_required
from app.database.database import SessionLocal
from app.models.categoria_model import Categoria
from app.services.usuarios_service import get_comercios_que_usuario_tem_acesso

bp = Blueprint("categorias", __name__, url_prefix="/categorias")

@bp.route('/', methods=['POST'])
@token_required
def criar_categoria():
    usuario: dict = g.get("usuario")
    usuario_id: int = usuario.get("usuario_id") if usuario else None

    if usuario is None or usuario_id is None:
        return jsonify({"msg": "erro de autenticação"}), 401

    data = request.get_json() or {}
    nome = data.get('nome')
    comercio_id = data.get('comercio_id')

    if not nome or not str(nome).strip():
        return jsonify({"msg": "Campo 'nome' é obrigatório."}), 400

    if comercio_id is None:
        return jsonify({"msg": "Campo 'comercio_id' é obrigatório."}), 400

    # verify user has access to the comercio
    try:
        comercios = get_comercios_que_usuario_tem_acesso(SessionLocal(), usuario_id)
        allowed_ids = {c.comercio_id for c in comercios}
        if comercio_id not in allowed_ids:
            return jsonify({"msg": "Usuário não tem acesso a este comércio."}), 403
    except Exception:
        # if there is an error checking access, return server error
        return jsonify({"msg": "Erro ao verificar acesso ao comércio."}), 500

    db = SessionLocal()
    try:
        categoria = Categoria(nome=nome.strip(), comercio_id=comercio_id)
        db.add(categoria)
        db.commit()
        db.refresh(categoria)

        return jsonify({
            "id": categoria.categoria_id,
            "nome": categoria.nome,
            "comercio_id": categoria.comercio_id
        }), 201

    except IntegrityError:
        db.rollback()
        return jsonify({"msg": "Categoria com esse nome já existe."}), 409
    except Exception as e:
        db.rollback()
        return jsonify({"msg": "Erro ao criar categoria.", "detail": str(e)}), 500
    finally:
        db.close()
