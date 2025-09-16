from flask import Blueprint, jsonify
from app.utils.model_utils import model_to_dict

from ..services.usuarios_service import get_comercios_que_usuario_tem_acesso
from ..middleware.login_middleware import token_required
from ..models.comercios_model import Comercio

user = Blueprint("user", __name__)


@user.route('/usuarios/<int:usuario_id>/comercios', methods=["GET"])
@token_required
def query_comercios(usuario_id):
    # busca via serviço (retorna lista de instâncias Comercio)
    comercios = get_comercios_que_usuario_tem_acesso(usuario_id)

    # Detectar nome da coluna de proprietario no model Comercio (várias convenções possíveis)
    proprietario_attr = None
    for cand in ("proprietario_id", "proprietario"):
        if hasattr(Comercio, cand):
            proprietario_attr = cand
            break

    # Serializa e marca se cada comercio tem usuario_id como proprietario
    comercios_serializados = []
    for c in comercios:
        cdict = model_to_dict(c)

        # marca individual (se detectamos o atributo)
        is_owner = False
        if proprietario_attr is not None:
            is_owner = getattr(c, proprietario_attr, None) == usuario_id
        else:
            # fallback: tentar detectar por chave no dict
            is_owner = cdict.get("proprietario_id") == usuario_id or cdict.get("proprietario") == usuario_id

        # adiciona flag por comércio
        cdict["is_proprietario"] = is_owner
        comercios_serializados.append(cdict)

    resp = {
        "comercios": comercios_serializados,
    }

    return jsonify(resp), 200
