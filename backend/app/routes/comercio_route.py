from flask import Blueprint, current_app, request, jsonify, g
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.middleware.auth import token_required
from app.database.database import SessionLocal
from app.models.categoria_model import Categoria
from app.models.produtos_model import Produto


from app.services.usuarios_service import get_comercios_que_usuario_tem_acesso, usuario_tem_acesso_ao_comercio
from app.api.auth import get_current_user
from app.services.cadastro_comercio_service import criar_comercio
from app.services.comercio_service import get_produtos_de_comercio_por_id
from app.utils.model_utils import model_to_dict  # supondo que exista

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
            return jsonify({"msg": "Erro ao criar categoria.", "detail": str(e)}), 
            
@bp.route('/<int:comercio_id>/categorias', methods=['GET'])
@token_required
def listar_categorias_do_comercio(comercio_id: int):
    """
    GET /comercios/<comercio_id>/categorias
    Retorna: { "items": [...], "total": n }
    Cada item: { "categoria_id": int, "nome": str, "comercio_id": int, "criado_em": iso | None }
    """
    usuario: dict = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    if usuario is None or usuario_id is None:
        return jsonify({"msg": "erro de autenticação"}), 401

    db = SessionLocal()
    try:
        # verifica permissão do usuário sobre o comércio
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "Usuário não tem acesso a este comércio."}), 403

        categorias = db.query(Categoria).filter(Categoria.comercio_id == comercio_id).order_by(getattr(Categoria, "criado_em", None).desc() if hasattr(Categoria, "criado_em") else Categoria.categoria_id.desc()).all()

        items = []
        for c in categorias:
            # normaliza saída (compatível com frontend)
            items.append({
                "categoria_id": getattr(c, "categoria_id", None) or getattr(c, "id", None),
                "id": getattr(c, "categoria_id", None) or getattr(c, "id", None),
                "nome": getattr(c, "nome", None),
                "comercio_id": getattr(c, "comercio_id", None),
                "criado_em": getattr(c, "criado_em", None).isoformat() if getattr(c, "criado_em", None) else None
            })

        return jsonify({"items": items, "total": len(items)}), 200

    except SQLAlchemyError:
        current_app.logger.exception("Erro ao listar categorias")
        return jsonify({"error": "Erro interno ao listar categorias"}), 500
    except Exception:
        current_app.logger.exception("Erro inesperado ao listar categorias")
        return jsonify({"error": "Erro interno"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão do DB em listar_categorias")


@bp.route('/<int:comercio_id>/categorias/<int:categoria_id>', methods=['DELETE'])
@token_required
def deletar_categoria_cascade_setnull(comercio_id: int, categoria_id: int):
    """
    DELETE /comercios/<comercio_id>/categorias/<categoria_id>
    Comportamento: remove referência categoria_id nos produtos (set NULL) e depois deleta a categoria.
    Retornos: 204 no sucesso, 400/403/404/500 conforme o caso.
    """
    usuario: dict = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    if usuario is None or usuario_id is None:
        return jsonify({"msg": "erro de autenticação"}), 401

    db = SessionLocal()
    try:
        # verifica permissão do usuário
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "Usuário não tem acesso a este comércio."}), 403

        # busca categoria
        categoria = db.query(Categoria).filter(
            Categoria.categoria_id == categoria_id,
            Categoria.comercio_id == comercio_id
        ).first()

        if categoria is None:
            return jsonify({"msg": "Categoria não encontrada."}), 404

        # Atualiza produtos vinculados: seta categoria_id = NULL
        # Filtra por comercio_id também para garantir segurança
        db.query(Produto).filter(
            Produto.categoria_id == categoria_id,
            Produto.comercio_id == comercio_id
        ).update({Produto.categoria_id: None}, synchronize_session=False)

        # Deleta a categoria
        db.delete(categoria)

        # commit transacional
        db.commit()

        # 204 No Content
        return "", 204

    except SQLAlchemyError:
        db.rollback()
        current_app.logger.exception("Erro ao deletar categoria em cascade (set null)")
        return jsonify({"error": "Erro interno ao deletar categoria"}), 500
    except Exception:
        db.rollback()
        current_app.logger.exception("Erro inesperado ao deletar categoria em cascade (set null)")
        return jsonify({"error": "Erro interno"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão do DB em deletar_categoria")


        
@bp.route('/<int:comercio_id>/produtos', methods=['GET'])
@token_required
def listar_produtos(comercio_id):
    """
    GET /comercio/<comercio_id>/produtos
    Args:
      - comercio_id: id do comércio cujos produtos serão listados
    Retorna (200):
      JSON { "items": [ ... ], "total": <int> }
      onde cada item é um dict do produto (campos da tabela) + categoriaNome, fornecedorNome, unidadeMedidaNome
    Erros:
      - 500 em caso de SQLAlchemyError (registro do erro no logger)
    """
    db = SessionLocal()
    try:
        produtos = get_produtos_de_comercio_por_id(db, comercio_id)
        items = []
        for p in produtos:
            pd = model_to_dict(p)
            pd["categoriaNome"] = getattr(p.categoria, "nome", None) if getattr(p, "categoria", None) is not None else None
            pd["fornecedorNome"] = getattr(p.fornecedor, "nome", None) if getattr(p, "fornecedor", None) is not None else None
            pd["unidadeMedidaNome"] = getattr(p.unidade_medida, "nome", None) if getattr(p, "unidade_medida", None) is not None else None
            items.append(pd)
        return jsonify({"items": items, "total": len(items)}), 200
    except SQLAlchemyError:
        current_app.logger.exception("Erro ao listar produtos com join")
        return jsonify({"error": "Erro interno ao listar produtos"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão do DB em listar_produtos")