from decimal import Decimal
from flask import Blueprint, current_app, request, jsonify, g
from sqlalchemy import and_, func, or_
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.middleware.auth import token_required
from app.database.database import SessionLocal
from app.models.categoria_model import Categoria
from app.models.produtos_model import Produto
from app.models.enderecos_model import Endereco
from app.models.fornecedores_model import Fornecedor
from app.models.unimed_model import UnidadeMedida
from app.models.comercios_model import Comercio
from app.models.configs_comercio import ConfiguracaoComercio

from app.services.usuarios_service import get_comercios_que_usuario_tem_acesso, usuario_tem_acesso_ao_comercio
from app.api.auth import get_current_user
from app.services.cadastro_comercio_service import criar_comercio
from app.services.comercio_service import get_produtos_de_comercio_por_id
from app.utils.model_utils import model_to_dict
from app.services.produto_service import create_produto, get_produto_por_id, update_produto, delete_produto
from app.services.fornecedor_service import create_fornecedor, get_fornecedor_por_id, update_fornecedor, delete_fornecedor
from app.services.categoria_service import create_categoria, delete_categoria, get_categoria_por_id, update_categoria
from app.models.movimentacao_model import Movimentacao
from decimal import ROUND_HALF_UP, InvalidOperation
from app.services.movimentacao_service import criar_movimentacao_vazia
from app.models.carrinho_model import Carrinho


bp = Blueprint("comercios", __name__, url_prefix="/comercios")

@bp.route("", methods=["POST"])
@token_required
def create_comercio():
    """PENDENTE"""
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
    """PENDENTE"""
    usuario: dict = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    if usuario is None or usuario_id is None:
        return jsonify({"msg": "erro de autenticação"}), 401

    data = request.get_json() or {}
    nome = (data.get('nome') or "").strip()
    if not nome:
        return jsonify({"msg": "Campo 'nome' é obrigatório."}), 400

    # Abre UMA sessão (context manager fecha automaticamente)
    with SessionLocal() as db:
        # autorização (uma única vez)
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "Usuário não tem acesso a este comércio."}), 403

        try:
            # create_categoria já faz commit/rollback internamente (padrão que estamos usando)
            categoria = create_categoria(db, comercio_id, nome)

            location = f"/comercios/{comercio_id}/categorias/{categoria.categoria_id}"
            resp = jsonify({
                "categoria_id": categoria.categoria_id,
                "codigo": categoria.codigo,
                "nome": categoria.nome,
                "comercio_id": categoria.comercio_id
            })
            resp.status_code = 201
            resp.headers['Location'] = location
            return resp

        except IntegrityError as ie:
            # opcional: log detalhado para debug
            current_app.logger.debug("IntegrityError ao criar categoria: %s", str(ie))
            # create_categoria provavelmente já deu rollback; garantir rollback extra é inofensivo
            try:
                db.rollback()
            except Exception:
                pass
            return jsonify({"msg": "Categoria com esse nome já existe."}), 409

        except Exception as e:
            current_app.logger.exception("Erro ao criar categoria")
            try:
                db.rollback()
            except Exception:
                pass
            # em dev você pode retornar detail=str(e)
            return jsonify({"msg": "Erro ao criar categoria.", "detail": str(e)}), 500

            
@bp.route('/<int:comercio_id>/categorias', methods=['GET'])
@token_required
def listar_categorias_do_comercio(comercio_id: int):
    """
    GET /comercios/<comercio_id>/categorias
    Retorna: { "items": [...], "total": n }
    Cada item: { "categoria_id": int, "codigo": int, "nome": str, "comercio_id": int }
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

        categorias = db.query(Categoria).filter(Categoria.comercio_id == comercio_id).all()

        items = []
        for c in categorias:
            items.append(model_to_dict(c))

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
    Retorna {"items": [...], "total": <int>}
    Cada item: campos do produto + categoriaNome, fornecedorNome, unidadeMedidaNome
    """
    db = SessionLocal()
    try:
        produtos = get_produtos_de_comercio_por_id(db, comercio_id)

        def rel_name(obj):
            """Tenta extrair o melhor nome/label de uma relação (nome, name, label, sigla)."""
            if obj is None:
                return None
            for attr in ("nome", "name", "label", "descricao", "sigla"):
                v = getattr(obj, attr, None)
                if v not in (None, ""):
                    return v
            return None

        items = []
        for p in produtos:
            pd = model_to_dict(p)

            # extrai nomes das relações de forma segura
            pd["categoriaNome"] = rel_name(getattr(p, "categoria", None))
            pd["fornecedorNome"] = rel_name(getattr(p, "fornecedor", None))

            unidade = getattr(p, "unidade_medida", None)
            u_nome = None
            u_sigla = None
            if unidade is not None:
                u_nome = getattr(unidade, "nome", None)
                u_sigla = getattr(unidade, "sigla", None)
            
            if u_nome and u_sigla:
                pd["unidadeMedidaNome"] = f"{u_nome} ({u_sigla})"
            
            pd["unidadeMedidaSigla"] = u_sigla

            # opcional: remover as chaves de relação serializadas caso model_to_dict já as tenha
            for k in ("categoria", "fornecedor", "unidade_medida"):
                if k in pd:
                    pd.pop(k, None)

            items.append(pd)

        return jsonify({"items": items, "total": len(items)}), 200

    except SQLAlchemyError:
        current_app.logger.exception("Erro ao listar produtos com joined relations")
        return jsonify({"error": "Erro interno ao listar produtos"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão do DB em listar_produtos")

@bp.route('/<int:comercio_id>/produtos/<int:produto_id>', methods=['DELETE'])
@token_required
def rota_delete_produto(comercio_id, produto_id):
    """PENDENTE"""
    db = SessionLocal()
    try:
        try:
            deleted = delete_produto(db, produto_id, comercio_id)
        except ValueError:
            return jsonify({"error": "Produto não encontrado"}), 404
        return ("", 204)
    except IntegrityError:
        current_app.logger.exception("Integrity error ao deletar produto")
        return jsonify({"error": "Não foi possível deletar produto por restrição de integridade"}), 400
    except SQLAlchemyError:
        current_app.logger.exception("Erro ao deletar produto")
        return jsonify({"error": "Erro interno ao deletar produto"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão do DB em rota_delete_produto")

@bp.route('/<int:comercio_id>/categorias/<int:categoria_id>', methods=['DELETE'])
@token_required
def rota_delete_categoria(comercio_id, categoria_id):
    """PENDENTE"""
    db = SessionLocal()
    try:
        try:
            delete_categoria(db, categoria_id, comercio_id)
        except ValueError:
            return jsonify({"error": "Categoria não encontrada"}), 404

        return ("", 204)

    except IntegrityError:
        current_app.logger.exception("Integrity error ao deletar categoria")
        return jsonify({"error": "Não foi possível deletar categoria por restrição de integridade"}), 400
    except SQLAlchemyError:
        current_app.logger.exception("Erro ao deletar categoria")
        return jsonify({"error": "Erro interno ao deletar categoria"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão do DB em rota_delete_categoria")


@bp.route('/<int:comercio_id>/fornecedores/<int:fornecedor_id>', methods=['DELETE'])
@token_required
def rota_delete_fornecedor(comercio_id, fornecedor_id):
    """PENDENTE"""
    db = SessionLocal()
    try:
        try:
            delete_fornecedor(db, fornecedor_id, comercio_id)
        except ValueError:
            return jsonify({"error": "Fornecedor não encontrado"}), 404

        return ("", 204)

    except IntegrityError:
        current_app.logger.exception("Integrity error ao deletar fornecedor")
        return jsonify({"error": "Não foi possível deletar fornecedor por restrição de integridade"}), 400
    except SQLAlchemyError:
        current_app.logger.exception("Erro ao deletar fornecedor")
        return jsonify({"error": "Erro interno ao deletar fornecedor"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão do DB em rota_delete_fornecedor")


@bp.route('/<int:comercio_id>/fornecedores', methods=['GET'])
@token_required
def listar_fornecedores_do_comercio(comercio_id: int):
    """PENDENTE"""
    usuario: dict = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    if usuario is None or usuario_id is None:
        return jsonify({"msg": "erro de autenticação"}), 401

    db = SessionLocal()
    try:
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "Usuário não tem acesso a este comércio."}), 403

        fornecedores = db.query(Fornecedor).filter(Fornecedor.comercio_id == comercio_id).order_by(Fornecedor.fornecedor_id.asc()).all()
        items = []
        for f in fornecedores:
            item = {
                "fornecedor_id": getattr(f, "fornecedor_id", None),
                "nome": getattr(f, "nome", None),
                "cnpj": getattr(f, "cnpj", None),
                "telefone": getattr(f, "telefone", None),
                "email": getattr(f, "email", None),
                "comercio_id": getattr(f, "comercio_id", None),
                "criado_em": getattr(f, "criado_em", None).isoformat() if getattr(f, "criado_em", None) else None,
                "codigo": getattr(f, "codigo", None),
                "endereco": None
            }
            if getattr(f, "endereco", None) is not None:
                e = f.endereco
                item["endereco"] = {
                    "endereco_id": getattr(e, "endereco_id", None),
                    "cep": getattr(e, "cep", None),
                    "numero": getattr(e, "numero", None),
                    "logradouro": getattr(e, "logradouro", None),
                    "complemento": getattr(e, "complemento", None),
                    "bairro": getattr(e, "bairro", None),
                    "cidade": getattr(e, "cidade", None),
                    "estado": getattr(e, "estado", None),
                    "pais": getattr(e, "pais", None),
                }
            items.append(item)

        return jsonify({"items": items, "total": len(items)}), 200

    except SQLAlchemyError:
        current_app.logger.exception("Erro ao listar fornecedores")
        return jsonify({"error": "Erro interno ao listar fornecedores"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão do DB em listar_fornecedores")

# GET /comercios/<comercio_id>/unidades
@bp.route("/<int:comercio_id>/unidades", methods=["GET"])
@token_required
def listar_unidades_do_comercio(comercio_id: int):
    """PENDENTE"""
    usuario: dict = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    if usuario is None or usuario_id is None:
        return jsonify({"msg": "erro de autenticação"}), 401

    db = SessionLocal()
    try:
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "Usuário não tem acesso a este comércio."}), 403

        # busca unidades que pertençam ao comercio OU unidades globais (comercio_id IS NULL)
        unidades = db.query(UnidadeMedida).filter(
            (UnidadeMedida.comercio_id == comercio_id) | (UnidadeMedida.comercio_id == None)
        ).order_by(UnidadeMedida.unimed_id.asc()).all()

        items = []
        for u in unidades:
            sigla_val = getattr(u, "sigla", None)       
            items.append({
                "unimed_id": getattr(u, "unimed_id", None) or getattr(u, "id", None),
                "nome": getattr(u, "nome", None),
                "sigla": sigla_val,
                "comercio_id": getattr(u, "comercio_id", None),
                "criado_em": getattr(u, "criado_em", None).isoformat() if getattr(u, "criado_em", None) else None
            })

        return jsonify({"items": items, "total": len(items)}), 200

    except Exception:
        current_app.logger.exception("Erro ao listar unidades")
        return jsonify({"error": "Erro interno ao listar unidades"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão DB em listar_unidades")


@bp.route("/unidades/globais", methods=["GET"])
@token_required
def listar_unidades_globais():
    """PENDENTE"""
    usuario: dict = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    if usuario is None or usuario_id is None:
        return jsonify({"msg": "erro de autenticação"}), 401

    db = SessionLocal()
    try:
        # Busca APENAS unidades globais (comercio_id IS NULL)
        unidades = db.query(UnidadeMedida).filter(
            UnidadeMedida.comercio_id == None
        ).order_by(UnidadeMedida.unimed_id.asc()).all()

        items = []
        for u in unidades:
            sigla_val = getattr(u, "sigla", None)       
            items.append({
                "unimed_id": getattr(u, "unimed_id", None) or getattr(u, "id", None),
                "nome": getattr(u, "nome", None),
                "sigla": sigla_val,
                "comercio_id": getattr(u, "comercio_id", None),
                "criado_em": getattr(u, "criado_em", None).isoformat() if getattr(u, "criado_em", None) else None
            })

        return jsonify({"items": items, "total": len(items)}), 200

    except Exception:
        current_app.logger.exception("Erro ao listar unidades globais")
        return jsonify({"error": "Erro interno ao listar unidades globais"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão DB em listar_unidades_globais")


@bp.route('/<int:comercio_id>/fornecedores', methods=['POST'])
@token_required
def criar_fornecedor_no_comercio(comercio_id: int):
    """PENDENTE"""
    usuario: dict = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    if usuario is None or usuario_id is None:
        return jsonify({"msg": "erro de autenticação"}), 401

    data = request.get_json() or {}
    nome = (data.get("nome") or "").strip()
    cnpj = (data.get("cnpj") or "").strip()
    telefone = (data.get("telefone") or "").strip() or None
    email = (data.get("email") or "").strip() or None
    cep = (data.get("cep") or "").strip() or None
    numero = (data.get("numero") or "").strip() or None
    complemento = (data.get("complemento") or "").strip() or None  # opcional

    if not nome:
        return jsonify({"msg": "Campo 'nome' é obrigatório."}), 400
    if not cnpj:
        return jsonify({"msg": "Campo 'cnpj' é obrigatório."}), 400
    # aqui você pode adicionar validação de formato de CNPJ se quiser

    db = SessionLocal()
    try:
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "Usuário não tem acesso a este comércio."}), 403

        fornecedor = create_fornecedor(
            db=db,
            comercio_id=comercio_id,
            nome=nome,
            cnpj=cnpj,
            telefone=telefone,
            email=email,
            cep=cep,
            numero=numero,
            complemento=complemento
        )

        # monta resposta igual ao que você tinha antes, adicionando 'codigo'
        location = f"/comercios/{comercio_id}/fornecedores/{fornecedor.fornecedor_id}"
        resp_body = {
            "fornecedor_id": fornecedor.fornecedor_id,
            "codigo": fornecedor.codigo,
            "nome": fornecedor.nome,
            "cnpj": fornecedor.cnpj,
            "telefone": fornecedor.telefone,
            "email": fornecedor.email,
            "comercio_id": fornecedor.comercio_id,
            "endereco": None,
            "criado_em": fornecedor.criado_em.isoformat() if fornecedor.criado_em else None
        }
        # ... preencher endereco se presente ...
        resp = jsonify(resp_body)
        resp.status_code = 201
        resp.headers["Location"] = location
        return resp

    except IntegrityError as ie:
        db.rollback()
        current_app.logger.debug(ie)
        return jsonify({"msg": "Fornecedor com esse CNPJ já existe."}), 409
    except Exception as e:
        db.rollback()
        current_app.logger.exception("Erro ao criar fornecedor")
        return jsonify({"msg": "Erro interno ao criar fornecedor"}), 500
    finally:
        db.close()
            
@bp.route("/<int:comercio_id>/produtos", methods=["POST"])
@token_required
def create_produto_route(comercio_id):
    """PENDENTE"""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body obrigatório"}), 400

    nome = data.get("nome")
    preco_raw = data.get("preco")
    try:
        preco: Decimal = Decimal(preco_raw)
    except Exception:
        return jsonify({"error": "Campo 'preco' inválido"}), 400

    quantidade_estoque = data.get("quantidade_estoque", 0)
    categoria = data.get("categoria_id")
    fornecedor = data.get("fornecedor_id")

    limiteEstoque = data.get("limiteEstoque", data.get("limite_estoque"))
    unimed_id = data.get("unimed_id")
    tags = data.get("tags")
    
    current_app.logger.debug(categoria)

    if unimed_id in (None, ""):
        return jsonify({"error":"Campo 'unimed_id' é obrigatório"}), 400
    
    if categoria == -1:
        categoria = None
        
    if fornecedor == -1:
        fornecedor = None

    if not nome:
        return jsonify({"error": "Campo 'nome' é obrigatório"}), 400
    if preco is None:
        return jsonify({"error": "Campo 'preco' é obrigatório"}), 400
    try:
        preco_q = preco.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, TypeError):
        return jsonify({"error": "Campo 'preco' inválido"}), 400

    # precision (10,2): valores >= 100000000.00 não cabem
    if preco_q >= Decimal("100000000"):
        return jsonify({"error": "Campo 'preco' excede a precisão permitida (máx 99999999.99)"}), 400

    # use o valor quantizado (2 casas) a partir daqui
    preco = preco_q

    db = SessionLocal()
    try:
        with db.begin():
            produto: Produto = create_produto(
                db=db,
                comercio_id=comercio_id,
                nome=nome,
                preco=preco,
                quantidade_estoque=quantidade_estoque,
                categoria=categoria,
                fornecedor=fornecedor,
                unimed=unimed_id,
                limiteEstoque=limiteEstoque,
                tags=tags
            )
            response_data = {
                "produto_id": produto.produto_id,
                "codigo": produto.codigo,
                "nome": produto.nome,
                "preco": str(produto.preco),
                "quantidade_estoque": produto.quantidade_estoque,
                "categoria_id": produto.categoria_id,
                "fornecedor_id": produto.fornecedor_id,
                "unimed_id": produto.unimed_id,
                "limite_estoque": produto.limite_estoque,   # <<< incluir para confirmação
                "tags": produto.tags,
                "criado_em": produto.criado_em.isoformat() if produto.criado_em else None
        }
        
    except ValueError as ve:
        db.rollback()
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        db.rollback()
        current_app.logger.exception("Erro criando produto")
        return jsonify({"error": "Erro interno"}), 500
    finally:
        db.close()

    return jsonify(response_data), 201

@bp.route('/<int:comercio_id>/produtos/<int:produto_id>', methods=['GET'])
@token_required
def rota_get_produto(comercio_id, produto_id):
    """PENDENTE"""
    db = SessionLocal()
    try:
        prod = get_produto_por_id(db, produto_id, comercio_id)
        if prod is None:
            return jsonify({"error": "Produto não encontrado"}), 404
        pd = model_to_dict(prod)
        # acrescentar nomes das relações (se quiser)
        pd["categoriaNome"] = getattr(prod.categoria, "nome", None) if getattr(prod, "categoria", None) is not None else None
        pd["fornecedorNome"] = getattr(prod.fornecedor, "nome", None) if getattr(prod, "fornecedor", None) is not None else None
        pd["unidadeMedidaNome"] = (
            getattr(prod.unidade_medida, "nome", None)
            or getattr(prod.unidade_medida, "sigla", None)
        ) if getattr(prod, "unidade_medida", None) is not None else None

        return jsonify(pd), 200
    except SQLAlchemyError:
        current_app.logger.exception("Erro ao buscar produto")
        return jsonify({"error": "Erro interno"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão do DB em rota_get_produto")

@bp.route('/<int:comercio_id>/produtos/<int:produto_id>', methods=['PUT', 'PATCH'])
@token_required
def rota_update_produto(comercio_id, produto_id):
    db = SessionLocal()
    try:
        payload = request.get_json(silent=True) or {}
        try:
            prod = update_produto(db, produto_id, comercio_id, payload)
        except ValueError as ve:
            msg = str(ve)
            if msg == "Produto não encontrado":
                return jsonify({"error": "Produto não encontrado"}), 404
            # erro de validação do payload
            return jsonify({"error": msg}), 400

        pd = model_to_dict(prod)
        pd["categoriaNome"] = (
            getattr(prod.categoria, "nome", None)
            if getattr(prod, "categoria", None) is not None
            else None
        )
        pd["fornecedorNome"] = (
            getattr(prod.fornecedor, "nome", None)
            if getattr(prod, "fornecedor", None) is not None
            else None
        )
        pd["unidadeMedidaNome"] = (
            (getattr(prod.unidade_medida, "nome", None)
             or getattr(prod.unidade_medida, "sigla", None))
            if getattr(prod, "unidade_medida", None) is not None
            else None
        )

        # incluí limite_estoque na resposta (útil para frontend)
        pd["limite_estoque"] = getattr(prod, "limite_estoque", None)

        return jsonify(pd), 200

    except IntegrityError:
        current_app.logger.exception("Integrity error ao atualizar produto")
        return jsonify({"error": "Não foi possível atualizar por restrição de integridade"}), 400
    except SQLAlchemyError:
        current_app.logger.exception("Erro ao atualizar produto")
        return jsonify({"error": "Erro interno ao atualizar produto"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão do DB em rota_update_produto")

@bp.route('/<int:comercio_id>/fornecedores/<int:fornecedor_id>', methods=['GET'])
@token_required
def rota_get_fornecedor(comercio_id, fornecedor_id):
    """PENDENTE"""
    db = SessionLocal()
    try:
        f = get_fornecedor_por_id(db, fornecedor_id, comercio_id)
        if f is None:
            return jsonify({"error": "Fornecedor não encontrado"}), 404

        fd = model_to_dict(f)

        # injeta campos de endereco no topo para facilitar frontend
        if getattr(f, "endereco", None):
            fd["endereco"] = {
                "endereco_id": getattr(f.endereco, "endereco_id", None),
                "cep": getattr(f.endereco, "cep", None),
                "logradouro": getattr(f.endereco, "logradouro", None),
                "numero": getattr(f.endereco, "numero", None),
                "complemento": getattr(f.endereco, "complemento", None),
                "bairro": getattr(f.endereco, "bairro", None),
                "cidade": getattr(f.endereco, "cidade", None),
                "estado": getattr(f.endereco, "estado", None),
                "pais": getattr(f.endereco, "pais", None),
            }
            # também mapear alguns campos no topo (compatibilidade com frontend atual)
            fd["cep"] = fd["endereco"]["cep"]
            fd["numero"] = fd["endereco"]["numero"]
        else:
            fd["endereco"] = None
            fd["cep"] = None
            fd["numero"] = None

        return jsonify(fd), 200

    except SQLAlchemyError:
        current_app.logger.exception("Erro ao buscar fornecedor")
        return jsonify({"error": "Erro interno"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão do DB em rota_get_fornecedor")


@bp.route('/<int:comercio_id>/fornecedores/<int:fornecedor_id>', methods=['PUT', 'PATCH'])
@token_required
def rota_update_fornecedor(comercio_id, fornecedor_id):
    """PENDENTE"""
    db = SessionLocal()
    try:
        payload = request.get_json() or {}
        try:
            f = update_fornecedor(db, fornecedor_id, comercio_id, payload)
        except ValueError:
            return jsonify({"error": "Fornecedor não encontrado"}), 404

        fd = model_to_dict(f)
        # incluir endereco novamente para resposta
        if getattr(f, "endereco", None):
            fd["endereco"] = {
                "endereco_id": getattr(f.endereco, "endereco_id", None),
                "cep": getattr(f.endereco, "cep", None),
                "logradouro": getattr(f.endereco, "logradouro", None),
                "numero": getattr(f.endereco, "numero", None),
                "complemento": getattr(f.endereco, "complemento", None),
                "bairro": getattr(f.endereco, "bairro", None),
                "cidade": getattr(f.endereco, "cidade", None),
                "estado": getattr(f.endereco, "estado", None),
                "pais": getattr(f.endereco, "pais", None),
            }
            fd["cep"] = fd["endereco"]["cep"]
            fd["numero"] = fd["endereco"]["numero"]
        else:
            fd["endereco"] = None
            fd["cep"] = None
            fd["numero"] = None

        return jsonify(fd), 200

    except IntegrityError:
        current_app.logger.exception("Integrity error ao atualizar fornecedor")
        return jsonify({"error": "Não foi possível atualizar por restrição de integridade"}), 400
    except SQLAlchemyError:
        current_app.logger.exception("Erro ao atualizar fornecedor")
        return jsonify({"error": "Erro interno ao atualizar fornecedor"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão do DB em rota_update_fornecedor")

@bp.route('/<int:comercio_id>/categorias/<int:categoria_id>', methods=['GET'])
@token_required
def rota_get_categoria(comercio_id, categoria_id):
    """PENDENTE"""
    db = SessionLocal()
    try:
        c = get_categoria_por_id(db, categoria_id, comercio_id)
        if c is None:
            return jsonify({"error": "Categoria não encontrada"}), 404
        cd = model_to_dict(c)
        return jsonify(cd), 200
    except SQLAlchemyError:
        current_app.logger.exception("Erro ao buscar categoria")
        return jsonify({"error": "Erro interno"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão do DB em rota_get_categoria")


@bp.route('/<int:comercio_id>/categorias/<int:categoria_id>', methods=['PUT', 'PATCH'])
@token_required
def rota_update_categoria(comercio_id, categoria_id):
    """PENDENTE"""
    db = SessionLocal()
    try:
        payload = request.get_json() or {}
        try:
            cat = update_categoria(db, categoria_id, comercio_id, payload)
        except ValueError:
            return jsonify({"error": "Categoria não encontrada"}), 404

        cd = model_to_dict(cat)
        return jsonify(cd), 200

    except IntegrityError:
        current_app.logger.exception("Integrity error ao atualizar categoria")
        return jsonify({"error": "Não foi possível atualizar: conflito de integridade"}), 400
    except SQLAlchemyError:
        current_app.logger.exception("Erro ao atualizar categoria")
        return jsonify({"error": "Erro interno ao atualizar categoria"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão do DB em rota_update_categoria")
            
@bp.route('/<int:comercio_id>/movimentacoes', methods=['GET'])
@token_required
def get_movimentacoes_de_comercio(comercio_id):
    """
    retorna todas movimentações em um comercio
    GET /comercios/<comercio_id>/movimentacoes
    Retorna: { "movs": [...]}
    Cada mov: campos de Movimentação
    """
    usuario: dict = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    if usuario is None or usuario_id is None:
        return jsonify({"msg": "erro de autenticação"}), 401

    db = SessionLocal()
    try:
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "Usuário não tem acesso a este comércio."}), 403

        movimentacoes = db.query(Movimentacao).filter(
            Movimentacao.comercio_id == comercio_id
        ).order_by(Movimentacao.mov_id.asc()).all()
        
        itens = []
        for m in movimentacoes:
            item = model_to_dict(m)
            itens.append(item)
        
        return jsonify({"movs": itens}), 200

    except SQLAlchemyError:
        current_app.logger.exception("Erro ao listar movimentacoes")
        return jsonify({"error": "Erro interno ao listar movimentacoes"}), 500
    except Exception:
        current_app.logger.exception("Erro inesperado ao listar movimentacoes")
        return jsonify({"error": "Erro interno"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão do DB em get_movimentacoes_de_comercio")
    
@bp.route('/<int:comercio_id>/movimentacoes/abertas', methods=['GET'])
@token_required
def get_movimentacoes_abertas_de_comercio(comercio_id):
    """
    retorna todas movimentações abertas em um comercio
    GET /comercios/<comercio_id>/movimentacoes
    Retorna: { "movs": [...]}
    Cada mov: campos de Movimentação
    """
    usuario: dict = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    if usuario is None or usuario_id is None:
        return jsonify({"msg": "erro de autenticação"}), 401

    db = SessionLocal()
    try:
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "Usuário não tem acesso a este comércio."}), 403

        movimentacoes = (
            db.query(Movimentacao)
            .filter(Movimentacao.comercio_id == comercio_id, 
                    Movimentacao.estado == "aberta")
            .order_by(Movimentacao.mov_id.asc())
            .all()
        )

        itens = [model_to_dict(m) for m in movimentacoes]
        return jsonify({"movs": itens}), 200

    except SQLAlchemyError:
        current_app.logger.exception("Erro SQL ao listar movimentacoes")
        return jsonify({"error": "Erro interno ao listar movimentacoes"}), 500
    except Exception:
        current_app.logger.exception("Erro inesperado ao listar movimentacoes")
        return jsonify({"error": "Erro interno"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão do DB em get_movimentacoes_de_comercio")
            
@bp.route('/<int:comercio_id>/movimentacoes', methods=['POST'])
@token_required
def criar_movimentacao_no_comercio(comercio_id: int):
    """
    Cria uma movimentação vazia no comércio.
    POST /comercios/<comercio_id>/movimentacoes
    Body (opcional): { "tipo": "entrada" | "saida", "link_param": "<string opcional>" }
    Se 'tipo' não for fornecido, assume 'entrada' (compatibilidade).
    """
    usuario: dict = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    if usuario is None or usuario_id is None:
        return jsonify({"msg": "erro de autenticação"}), 401

    data = request.get_json() or {}
    tipo = (data.get("tipo") or "entrada").strip().lower()
    link_param = data.get("link_param", None)

    if tipo not in ("entrada", "saida"):
        return jsonify({"error": "Tipo inválido. Use 'entrada' ou 'saida'."}), 400

    db = SessionLocal()
    try:
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "Usuário não tem acesso a este comércio."}), 403

        try:
            mov: Movimentacao = criar_movimentacao_vazia(
                db=db,
                comercio_id=comercio_id,
                tipo=tipo,
                link_param=link_param
            )
            db.commit()
            db.refresh(mov)
            return jsonify(model_to_dict(mov)), 201

        except ValueError as ve:
            try:
                db.rollback()
            except Exception:
                pass
            return jsonify({"error": str(ve)}), 400

    except IntegrityError:
        db.rollback()
        current_app.logger.exception("Integrity error ao criar movimentação")
        return jsonify({"error": "Não foi possível criar movimentação por restrição de integridade"}), 400
    except SQLAlchemyError:
        db.rollback()
        current_app.logger.exception("Erro ao criar movimentação")
        return jsonify({"error": "Erro interno ao criar movimentação"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão do DB em criar_movimentacao_no_comercio")

@bp.route('/<int:comercio_id>/movimentacoes/link/<string:link>', methods=['GET'])
@token_required
def get_movimentacao_por_link(comercio_id: int, link: str):
    """PENDENTE"""
    usuario: dict = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    if usuario is None or usuario_id is None:
        return jsonify({"msg": "erro de autenticação"}), 401

    db = SessionLocal()
    try:
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "Usuário não tem acesso a este comércio."}), 403

        mov = db.query(Movimentacao).filter(
            Movimentacao.comercio_id == comercio_id,
            Movimentacao.link == link
        ).first()

        if mov is None:
            return jsonify({"error": "Movimentação não encontrada"}), 404

        # retorno consistente: objeto com 'mov' (em vez de um raw dict)
        return jsonify({"mov": model_to_dict(mov)}), 200

    except SQLAlchemyError:
        current_app.logger.exception("Erro ao buscar movimentação por link")
        return jsonify({"error": "Erro interno"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão do DB em get_movimentacao_por_link")


@bp.route("/<int:comercio_id>/config", methods=["GET"])
@token_required
def rota_get_configuracoes_comercio(comercio_id: int):
    """PENDENTE"""
    usuario: dict = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    if usuario is None or usuario_id is None:
        return jsonify({"msg": "erro de autenticação"}), 401

    db = SessionLocal()
    try:
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "Usuário não tem acesso a este comércio."}), 403

        comercio = db.query(Comercio).filter(Comercio.comercio_id == comercio_id).first()
        if comercio is None or not getattr(comercio, "configuracao_id", None):
            return jsonify({"limite_padrao": None, "unidade_padrao": None}), 200

        config = db.query(ConfiguracaoComercio).filter(
            ConfiguracaoComercio.id == comercio.configuracao_id
        ).first()

        if config is None:
            return jsonify({"limite_padrao": None, "unidade_padrao": None}), 200

        limite = getattr(config, "nivel_alerta_minimo", None)
        unidade_id = getattr(config, "unimed_id", None)

        unidade_res = None
        if unidade_id is not None:
            unidade = db.query(UnidadeMedida).filter(UnidadeMedida.unimed_id == unidade_id).first()
            if unidade is not None:
                unidade_res = {
                    "unimed_id": getattr(unidade, "unimed_id", None),
                    "nome": getattr(unidade, "nome", None),
                    "sigla": getattr(unidade, "sigla", None)
                }

        return jsonify({
            "limite_padrao": limite if limite is not None else None,
            "unidade_padrao": unidade_res
        }), 200

    except SQLAlchemyError:
        current_app.logger.exception("Erro ao buscar configuração do comércio")
        return jsonify({"error": "Erro interno ao buscar configuração"}), 500
    except Exception:
        current_app.logger.exception("Erro inesperado ao buscar configuração do comércio")
        return jsonify({"error": "Erro interno"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão do DB em rota_get_configuracoes_comercio")

@bp.route("/<int:comercio_id>/config", methods=["PATCH", "PUT"])
@token_required
def rota_update_configuracoes_comercio(comercio_id: int):
    """PENDENTE"""
    usuario = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    if usuario is None or usuario_id is None:
        return jsonify({"msg": "erro de autenticação"}), 401

    body = request.get_json() or {}
    
    # Extract unidade with priority order matching frontend
    unidade_raw = (
        body.get("unidade_padrao") 
        or (body.get("configs") or {}).get("campo1")
        or (body.get("configs") or {}).get("unidade")
    )
    
    # Extract limite with priority order matching frontend
    limite_raw = (
        body.get("limite_padrao")
        or (body.get("configs") or {}).get("campo4")
    )

    db = SessionLocal()
    try:
        # Authorization
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "Usuário não tem acesso a este comércio."}), 403

        comercio = db.query(Comercio).filter(Comercio.comercio_id == comercio_id).first()
        if not comercio:
            return jsonify({"msg": "Comércio não encontrado."}), 404

        # Resolve unidade ID from various formats
        unimed_id_to_set = _resolve_unidade_id(db, unidade_raw) if unidade_raw else None
        
        # Parse limit as integer
        limite_to_set = None
        if limite_raw is not None and str(limite_raw).strip():
            try:
                limite_to_set = int(float(str(limite_raw).replace(",", ".")))
                if limite_to_set < 0:
                    return jsonify({"msg": "Limite não pode ser negativo."}), 400
            except (ValueError, TypeError):
                return jsonify({"msg": "Formato inválido para limite_padrao."}), 400

        # Get or create config
        config = db.query(ConfiguracaoComercio).filter(
            ConfiguracaoComercio.id == comercio.configuracao_id
        ).first() if comercio.configuracao_id else None

        if not config:
            config = ConfiguracaoComercio()
            if limite_to_set is not None:
                config.nivel_alerta_minimo = limite_to_set
            if unimed_id_to_set is not None:
                config.unimed_id = unimed_id_to_set
            db.add(config)
            db.flush()
            comercio.configuracao_id = config.id
        else:
            # Update only non-None fields
            if limite_to_set is not None:
                config.nivel_alerta_minimo = limite_to_set
            if unimed_id_to_set is not None:
                config.unimed_id = unimed_id_to_set

        db.add(comercio)
        db.commit()

        # Build response matching GET endpoint format
        unidade_res = _build_unidade_response(db, config.unimed_id) if config.unimed_id else None

        return jsonify({
            "limite_padrao": config.nivel_alerta_minimo,
            "unidade_padrao": unidade_res
        }), 200

    except SQLAlchemyError:
        db.rollback()
        current_app.logger.exception("Erro ao criar/atualizar configuração")
        return jsonify({"error": "Erro interno ao salvar configuração."}), 500
    except Exception as e:
        db.rollback()
        current_app.logger.exception("Erro inesperado ao salvar configuração")
        return jsonify({"error": "Erro interno ao salvar configuração."}), 500
    finally:
        db.close()


def _resolve_unidade_id(db, unidade_raw):
    """Resolve unidade ID from various input formats."""
    if isinstance(unidade_raw, dict):
        return unidade_raw.get("unimed_id") or unidade_raw.get("id")
    
    try:
        return int(unidade_raw)
    except (ValueError, TypeError):
        pass
    
    sigla_str = str(unidade_raw).strip()
    unidade = db.query(UnidadeMedida).filter(
        UnidadeMedida.sigla.ilike(sigla_str)
    ).first()
    
    if not unidade:
        unidade = db.query(UnidadeMedida).filter(
            UnidadeMedida.nome.ilike(sigla_str)
        ).first()
    
    return getattr(unidade, "unimed_id", None) if unidade else None


def _build_unidade_response(db, unimed_id):
    """Build unidade response object."""
    unidade = db.query(UnidadeMedida).filter(UnidadeMedida.unimed_id == unimed_id).first()
    if not unidade:
        return None
    
    return {
        "unimed_id": unidade.unimed_id,
        "nome": unidade.nome,
        "sigla": unidade.sigla
    }

@bp.route("/<int:comercio_id>", methods=["DELETE"])
@token_required
def rota_delete_comercio(comercio_id: int):
    """PENDENTE"""
    usuario = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    if usuario is None or usuario_id is None:
        return jsonify({"msg": "erro de autenticação"}), 401

    db = SessionLocal()
    try:
        comercio = db.query(Comercio).filter(Comercio.comercio_id == comercio_id).first()
        if not comercio:
            return jsonify({"msg": "Comércio não encontrado."}), 404

        # Só o proprietário pode deletar (altera se quiser permitir admins)
        if getattr(comercio, "proprietario_id", None) != usuario_id:
            return jsonify({"msg": "Somente o proprietário pode excluir o comércio."}), 403

        # opcional: checar se existe dependência que impeça a remoção
        # (se quiser bloquear exclusão quando há pagamentos/assinaturas ativas)
        # if existe_assinatura_ativa(comercio_id): return jsonify(...), 400

        # Deleta o comércio — se as FKs estiverem com ON DELETE CASCADE, o DB cuidará
        db.delete(comercio)
        db.commit()

        return jsonify({"msg": "Comércio excluído com sucesso."}), 200

    except SQLAlchemyError:
        db.rollback()
        current_app.logger.exception("Erro ao deletar comércio")
        return jsonify({"error": "Erro interno ao deletar comércio."}), 500
    except Exception:
        db.rollback()
        current_app.logger.exception("Erro inesperado ao deletar comércio")
        return jsonify({"error": "Erro interno."}), 500
    finally:
        db.close()

@bp.route("/<int:comercio_id>/movimentacoes/<int:mov_id>", methods=["DELETE"])
@token_required
def rota_delete_movimentacao(comercio_id: int, mov_id: int):
    """PENDENTE"""
    usuario = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    if usuario is None or usuario_id is None:
        return jsonify({"msg": "erro de autenticação"}), 401

    db = SessionLocal()
    try:
        # checar se usuário tem acesso ao comércio (mesma função que você já usa)
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "Usuário não tem acesso a este comércio."}), 403

        mov = db.query(Movimentacao).filter(
            Movimentacao.mov_id == mov_id,
            Movimentacao.comercio_id == comercio_id
        ).first()

        if mov is None:
            return jsonify({"msg": "Movimentação não encontrada."}), 404

        # opcional: checar estado (ex.: só permitir deletar se 'aberta')
        # if mov.estado != 'aberta':
        #     return jsonify({"msg":"Só é possível excluir movimentações abertas."}), 400

        db.delete(mov)
        db.commit()
        # 204 no REST indica sucesso sem corpo — 200 com msg também OK
        return jsonify({"msg": "Movimentação excluída com sucesso."}), 200

    except SQLAlchemyError:
        db.rollback()
        current_app.logger.exception("Erro ao deletar movimentação")
        return jsonify({"error": "Erro interno ao deletar movimentação."}), 500
    except Exception:
        db.rollback()
        current_app.logger.exception("Erro inesperado ao deletar movimentação")
        return jsonify({"error": "Erro interno."}), 500
    finally:
        db.close()

@bp.route("/<int:comercio_id>/dashboard/cards", methods=["GET"])
@token_required
def rota_dashboard_cards(comercio_id: int):
    usuario = g.get("usuario")
    usuario_id = usuario.get("usuario_id") if usuario else None
    if usuario is None or usuario_id is None:
        return jsonify({"msg": "erro de autenticação"}), 401

    db = SessionLocal()
    try:
        # autorização
        if not usuario_tem_acesso_ao_comercio(db, usuario_id, comercio_id):
            return jsonify({"msg": "Usuário não tem acesso a este comércio."}), 403

        # Recupera limite global do comércio (se existir)
        limite_num = None
        comercio = db.query(Comercio).filter(Comercio.comercio_id == comercio_id).first()
        if comercio and getattr(comercio, "configuracao_id", None):
            config = db.query(ConfiguracaoComercio).filter(ConfiguracaoComercio.id == comercio.configuracao_id).first()
            if config is not None:
                # nome do campo que você já usava: nivel_alerta_minimo
                try:
                    lv = getattr(config, "nivel_alerta_minimo", None)
                    limite_num = int(lv) if lv is not None else None
                except Exception:
                    limite_num = None

        # conto produtos com estoque exatamente zero
        zero_count = db.query(func.count(Produto.produto_id)).filter(
            Produto.comercio_id == comercio_id,
            Produto.quantidade_estoque == 0
        ).scalar() or 0

        # conto produtos com estoque baixo:
        # regra: produto.Quantidade > 0 E (
        #   (produto.limite_estoque IS NOT NULL and produto.limite_estoque > 0 and quantidade < produto.limite_estoque)
        #   OR
        #   (produto.limite_estoque IS NULL and limite_num > 0 and quantidade < limite_num)
        # )
        low_count = 0
        # só avalia se há algum critério (produto.limite_estoque ou limite_num > 0)
        if True:
            cond_prod_limite = and_(
                Produto.limite_estoque != None,
                Produto.limite_estoque > 0,
                Produto.quantidade_estoque > 0,
                Produto.quantidade_estoque < Produto.limite_estoque
            )
            cond_global_limite = None
            if limite_num is not None and limite_num > 0:
                cond_global_limite = and_(
                    Produto.limite_estoque == None,
                    Produto.quantidade_estoque > 0,
                    Produto.quantidade_estoque < limite_num
                )

            if cond_global_limite is not None:
                low_count = db.query(func.count(Produto.produto_id)).filter(
                    Produto.comercio_id == comercio_id,
                    or_(cond_prod_limite, cond_global_limite)
                ).scalar() or 0
            else:
                # não há limite global, conta apenas os produtos que têm limite_estoque definido
                low_count = db.query(func.count(Produto.produto_id)).filter(
                    Produto.comercio_id == comercio_id,
                    cond_prod_limite
                ).scalar() or 0

        return jsonify({
            "zero_count": int(zero_count),
            "low_count": int(low_count),
            "limite_global": int(limite_num) if limite_num is not None else None
        }), 200

    except SQLAlchemyError:
        db.rollback()
        current_app.logger.exception("Erro ao gerar cards do dashboard")
        return jsonify({"error": "Erro interno ao gerar dados do dashboard"}), 500
    except Exception:
        db.rollback()
        current_app.logger.exception("Erro inesperado ao gerar dados do dashboard")
        return jsonify({"error": "Erro interno"}), 500
    finally:
        try:
            db.close()
        except Exception:
            current_app.logger.exception("Erro ao fechar sessão do DB em rota_dashboard_cards")