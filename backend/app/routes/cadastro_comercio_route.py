# app/routes/comercio_route.py
from flask import Blueprint, request, jsonify, g
from app.database.database import get_db
from ..middleware.login_middleware import token_required
from ..services.cadastro_comercio_service import (
    criar_comercio,
    get_comercio_por_id,
    listar_comercios_do_proprietario,
    usuario_eh_membro,
    adicionar_membro_por_email,
    adicionar_membro_por_id,
    remover_membro,
    listar_membros,
    ComercioServiceError,
)

comercio_bp = Blueprint("comercio", __name__)


# POST /comercios  -> cria um novo comércio (dono = usuário do token)
@comercio_bp.route("/comercios", methods=["POST"])
@token_required
def criar_comercio_route():
    data = request.get_json() or {}
    nome = data.get("nome")

    user_id = g.user.get("user_id")
    db_gen = get_db()
    db = next(db_gen)
    try:
        comercio = criar_comercio(db, proprietario_id=user_id, nome=nome)
        return jsonify({
            "id": comercio.id,
            "nome": comercio.nome,
            "proprietario_id": comercio.proprietario_id,
            "criado_em": comercio.criado_em.isoformat() if comercio.criado_em else None,
            "atualizado_em": comercio.atualizado_em.isoformat() if comercio.atualizado_em else None,
        }), 201
    except ComercioServiceError as e:
        return jsonify({"mensagem": str(e)}), 400
    finally:
        db_gen.close()


# GET /comercios/meus  -> lista comércios onde o usuário é PROPRIETÁRIO
@comercio_bp.route("/comercios/meus", methods=["GET"])
@token_required
def listar_meus_comercios():
    user_id = g.user.get("user_id")
    db_gen = get_db()
    db = next(db_gen)
    try:
        comercios = listar_comercios_do_proprietario(db, user_id)
        return jsonify([
            {
                "id": c.id,
                "nome": c.nome,
                "proprietario_id": c.proprietario_id,
                "criado_em": c.criado_em.isoformat() if c.criado_em else None,
                "atualizado_em": c.atualizado_em.isoformat() if c.atualizado_em else None,
            } for c in comercios
        ])
    finally:
        db_gen.close()


# GET /comercios/<id>  -> detalhe (apenas dono ou membro)
@comercio_bp.route("/comercios/<int:comercio_id>", methods=["GET"])
@token_required
def detalhe_comercio(comercio_id: int):
    user_id = g.user.get("user_id")
    db_gen = get_db()
    db = next(db_gen)
    try:
        comercio = get_comercio_por_id(db, comercio_id)
        if not comercio:
            return jsonify({"mensagem": "Comércio não encontrado."}), 404

        is_owner = comercio.proprietario_id == user_id
        is_member = usuario_eh_membro(db, comercio_id, user_id)
        if not (is_owner or is_member):
            return jsonify({"mensagem": "Acesso negado."}), 403

        return jsonify({
            "id": comercio.id,
            "nome": comercio.nome,
            "proprietario_id": comercio.proprietario_id,
            "criado_em": comercio.criado_em.isoformat() if comercio.criado_em else None,
            "atualizado_em": comercio.atualizado_em.isoformat() if comercio.atualizado_em else None,
            "sou_proprietario": is_owner,
            "sou_membro": is_member,
        })
    finally:
        db_gen.close()


# POST /comercios/<id>/membros  -> adicionar membro (apenas dono)
# body: { "email": "..." }  OR { "usuario_id": ... }  (prefer email)
@comercio_bp.route("/comercios/<int:comercio_id>/membros", methods=["POST"])
@token_required
def adicionar_membro_route(comercio_id: int):
    data = request.get_json() or {}
    email = data.get("email")
    usuario_id_body = data.get("usuario_id")

    if not email and not usuario_id_body:
        return jsonify({"mensagem": "Forneça 'email' ou 'usuario_id'."}), 400

    user_id = g.user.get("user_id")

    db_gen = get_db()
    db = next(db_gen)
    try:
        comercio = get_comercio_por_id(db, comercio_id)
        if not comercio:
            return jsonify({"mensagem": "Comércio não encontrado."}), 404

        if comercio.proprietario_id != user_id:
            return jsonify({"mensagem": "Apenas o proprietário pode adicionar membros."}), 403

        if email:
            rel = adicionar_membro_por_email(db, comercio_id, email)
        else:
            rel = adicionar_membro_por_id(db, comercio_id, int(usuario_id_body))

        return jsonify({
            "comercio_id": rel.comercio_id,
            "usuario_id": rel.usuario_id,
            "mensagem": "Membro adicionado."
        }), 201
    except ComercioServiceError as e:
        return jsonify({"mensagem": str(e)}), 400
    finally:
        db_gen.close()


# DELETE /comercios/<id>/membros/<usuario_id>  -> remover membro (apenas dono)
@comercio_bp.route("/comercios/<int:comercio_id>/membros/<int:usuario_id>", methods=["DELETE"])
@token_required
def remover_membro_route(comercio_id: int, usuario_id: int):
    user_id = g.user.get("user_id")

    db_gen = get_db()
    db = next(db_gen)
    try:
        comercio = get_comercio_por_id(db, comercio_id)
        if not comercio:
            return jsonify({"mensagem": "Comércio não encontrado."}), 404

        if comercio.proprietario_id != user_id:
            return jsonify({"mensagem": "Apenas o proprietário pode remover membros."}), 403

        remover_membro(db, comercio_id, usuario_id)
        return jsonify({"mensagem": "Membro removido."}), 200
    except ComercioServiceError as e:
        return jsonify({"mensagem": str(e)}), 400
    finally:
        db_gen.close()


# GET /comercios/<id>/membros  -> listar membros (apenas dono ou membro)
@comercio_bp.route("/comercios/<int:comercio_id>/membros", methods=["GET"])
@token_required
def listar_membros_route(comercio_id: int):
    user_id = g.user.get("user_id")

    db_gen = get_db()
    db = next(db_gen)
    try:
        comercio = get_comercio_por_id(db, comercio_id)
        if not comercio:
            return jsonify({"mensagem": "Comércio não encontrado."}), 404

        if not (comercio.proprietario_id == user_id or usuario_eh_membro(db, comercio_id, user_id)):
            return jsonify({"mensagem": "Acesso negado."}), 403

        membros = listar_membros(db, comercio_id)
        return jsonify(membros), 200
    finally:
        db_gen.close()
