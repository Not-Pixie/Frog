from flask import Blueprint, current_app, request, jsonify, g
from sqlalchemy.exc import IntegrityError

from app.middleware.auth import token_required
from app.database.database import SessionLocal
from app.models.categoria_model import Categoria

from app.services.usuarios_service import get_comercios_que_usuario_tem_acesso, usuario_tem_acesso_ao_comercio
from app.api.auth import get_current_user
from app.services.cadastro_comercio_service import criar_comercio  # supondo que exista

bp = Blueprint("comercios", __name__, url_prefix="/comercios")

@bp.route("", methods=["POST"])
@token_required
def create_comercio():
    user = get_current_user()
    if not user:
        return jsonify({"msg": "Autenticação necessária."}), 401
    
    comercios = get_comercios_que_usuario_tem_acesso(usuario_id=getattr(user, "usuario_id"), db=SessionLocal())
    qtd_comercios = len(comercios)
    if qtd_comercios >= 5: 
        return jsonify({"msg":"Limite de Comercios atingido"}), 400
        
    body = request.get_json() or {}
    nome = (body.get("nome") or "").strip()
    configs = body.get("configs") or None

    if not nome:
        return jsonify({"msg": "Campo 'nome' é obrigatório."}), 400

    try:
        comercio = criar_comercio(user.usuario_id, nome, configs=configs)
    except IntegrityError:
        return jsonify({"msg": "Nome de comércio já existe."}), 409
    except Exception as e:
        # ideal: log do erro real (logger.exception)
        current_app.logger.debug(e)
        return jsonify({"msg": "Erro interno."}), 500

    return jsonify({
        "comercio_id": comercio.comercio_id,
        "nome": comercio.nome,
        "configuracao_id": comercio.configuracao_id,
        "criado_em": comercio.criado_em.isoformat() if comercio.criado_em else None
    }), 201


@bp.route('/<int:comercio_id>/categorias', methods=['POST'])
@token_required
def criar_categoria_no_comercio(comercio_id: int):
    usuario: dict = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    if usuario is None or usuario_id is None:
        return jsonify({"msg": "erro de autenticação"}), 401

    data = request.get_json() or {}
    nome = (data.get('nome') or "").strip()
    if not nome:
        return jsonify({"msg": "Campo 'nome' é obrigatório."}), 400
    if len(nome) > 100:  # exemplo de validação
        return jsonify({"msg": "Campo 'nome' muito longo."}), 400

    with SessionLocal() as db:
        # autoriza
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "Usuário não tem acesso a este comércio."}), 403

        try:
            categoria = Categoria(nome=nome, comercio_id=comercio_id)
            db.add(categoria)
            db.commit()
            db.refresh(categoria)
            location = f"/comercios/{comercio_id}/categorias/{categoria.categoria_id}"
            resp = jsonify({
                "categoria_id": categoria.categoria_id,
                "nome": categoria.nome,
                "comercio_id": categoria.comercio_id
            })
            resp.status_code = 201
            resp.headers['Location'] = location
            return resp
        except IntegrityError:
            db.rollback()
            return jsonify({"msg": "Categoria com esse nome já existe."}), 409
        except Exception as e:
            db.rollback()
            return jsonify({"msg": "Erro ao criar categoria.", "detail": str(e)}), 500