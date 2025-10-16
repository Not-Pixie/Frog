# app/routes/products.py
from flask import Blueprint, request, jsonify, current_app
from app.database.database import SessionLocal
from app.services.produto_service import create_produto

product_bp = Blueprint("products", __name__)

@product_bp.route("/comercios/<int:comercio_id>/produtos", methods=["POST"])
def create_produto_route(comercio_id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body obrigatório"}), 400

    nome = data.get("nome")
    preco = data.get("preco")
    quantidade_estoque = data.get("quantidade_estoque", 0)
    categoria = data.get("categoria")       # agora string
    fornecedor = data.get("fornecedor")     # agora string
    unimed_sigla = data.get("unimed_sigla") # opcional, string
    limiteEstoque = data.get("limiteEstoque")
    tag = data.get("tag")  # backend campo singular

    if not nome:
        return jsonify({"error": "Campo 'nome' é obrigatório"}), 400
    if preco is None:
        return jsonify({"error": "Campo 'preco' é obrigatório"}), 400

    db = SessionLocal()
    try:
        produto = create_produto(
            db=db,
            comercio_id=comercio_id,
            nome=nome,
            preco=preco,
            quantidade_estoque=quantidade_estoque,
            categoria=categoria,
            fornecedor=fornecedor,
            unimed_sigla=unimed_sigla,
            limiteEstoque=limiteEstoque,
            tag=tag
        )
    except ValueError as ve:
        db.rollback()
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        db.rollback()
        current_app.logger.exception("Erro criando produto")
        return jsonify({"error": "Erro interno"}), 500
    finally:
        db.close()

    return jsonify({
        "produto_id": produto.produto_id,
        "codigo": produto.codigo,
        "nome": produto.nome,
        "preco": str(produto.preco),
        "quantidade_estoque": produto.quantidade_estoque,
        "categoria_id": produto.categoria_id,
        "fornecedor_id": produto.fornecedor_id,
        "unimed_id": produto.unimed_id,
        "tag": produto.tag,
        "criado_em": produto.criado_em.isoformat() if produto.criado_em else None
    }), 201
