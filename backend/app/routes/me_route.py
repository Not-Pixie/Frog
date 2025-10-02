import os
from flask import Blueprint, current_app, g, request, jsonify
import jwt
from sqlalchemy.exc import IntegrityError
from app.services.cadastro_comercio_service import criar_comercio
from app.api.auth import get_current_user
from app.middleware.auth import token_required
from app.services.usuarios_service import get_comercios_que_usuario_tem_acesso, get_usuario_por_id
from app.database.database import SessionLocal, get_db
from app.models.comercios_model import Comercio
from app.utils.model_utils import model_to_dict 


bp = Blueprint("me", __name__, url_prefix="/api/me")
SECRET_KEY = os.getenv("SECRET_KEY", "muda_esse_segredo")

@bp.route('/', methods=['GET'])
def me():
    auth_header = request.headers.get('Authorization', None)
    token = None
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ', 1)[1].strip()
    else:
        token = request.cookies.get('access_token')

    if not token:
        return jsonify({'mensagem': 'Token de acesso ausente'}), 401

    db_gen = None
    try:
        dados = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        usuario_id = dados.get('usuario_id')
        if not usuario_id:
            return jsonify({'mensagem': 'Token inválido'}), 401

        db_gen = get_db()
        db = next(db_gen)
        usuario = get_usuario_por_id(db, usuario_id)

        if not usuario:
            return jsonify({'mensagem': 'Usuário não encontrado'}), 404

        return jsonify({
            'usuario': {
                'usuario_id': usuario.usuario_id,
                'email': usuario.email,
                'nome': usuario.nome_completo
            }
        }), 200

    except jwt.ExpiredSignatureError:
        return jsonify({'mensagem': 'Token expirado'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'mensagem': 'Token inválido'}), 401
    finally:
        if db_gen:
            db_gen.close()


@bp.route('/comercios', methods=["GET"])
@token_required
def query_comercios():
    usuario: dict = g.get("usuario")
    usuario_id: int = usuario.get("usuario_id")

    if usuario is None or usuario_id is None:
        current_app.logger.debug("Usuario não achado no g")
        return jsonify({"msg":"erro de atutenticação"}), 401
    
    comercios = get_comercios_que_usuario_tem_acesso(SessionLocal(), usuario_id)

    comercios_serializados = []
    for c in comercios:
        comercios_serializados.append({
            'comercio_id': c.comercio_id,
            'nome': c.nome,
            'is_proprietario': c.proprietario_id == usuario_id
        })

    resp = {
        "comercios": comercios_serializados,
    }

    return jsonify(resp), 200
