# app/services/product_service.py
from typing import Optional, Any
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from decimal import Decimal, InvalidOperation
import secrets
import datetime

from app.models import Produto, Categoria, Fornecedor, UnidadeMedida
from app.models.contadores_locais import ContadorLocal
from app.utils.contador_utils import next_codigo  # ajuste conforme seus módulos

MAX_CODE_TRIES = 5

def _generate_codigo() -> str:
    return f"PRD-{secrets.token_hex(4)}"

# ---------- helpers para garantir/achar categorias/fornecedores/unidade ----------
def _find_category_by_name(db: Session, comercio_id: int, nome: str) -> Optional[Categoria]:
    if not nome:
        return None
    return db.query(Categoria).filter(
        Categoria.comercio_id == comercio_id,
        Categoria.nome.ilike(nome.strip())
    ).first()

def _create_category(db: Session, comercio_id: int, nome: str) -> Categoria:
    cat = Categoria(nome=nome.strip(), comercio_id=comercio_id)
    db.add(cat)
    db.flush()  # garante que cat.categoria_id seja populado antes do commit
    return cat

def _get_or_create_category(db: Session, comercio_id: int, nome: Optional[str]) -> Categoria:
    # se nome fornecido, procura por esse nome; se não encontrado, cria
    if nome:
        found = _find_category_by_name(db, comercio_id, nome)
        if found:
            return found
        return _create_category(db, comercio_id, nome)
    # nome não fornecido -> procura placeholder "Sem categoria" para o comercio, se não existir cria
    placeholder_name = "Sem categoria"
    found = _find_category_by_name(db, comercio_id, placeholder_name)
    if found:
        return found
    return _create_category(db, comercio_id, placeholder_name)

def _find_fornecedor_by_name(db: Session, comercio_id: int, nome: str) -> Optional[Fornecedor]:
    if not nome:
        return None
    return db.query(Fornecedor).filter(
        Fornecedor.comercio_id == comercio_id,
        Fornecedor.nome.ilike(nome.strip())
    ).first()

def _create_fornecedor(db: Session, comercio_id: int, nome: str) -> Fornecedor:
    f = Fornecedor(nome=nome.strip(), comercio_id=comercio_id)
    db.add(f)
    db.flush()
    return f

def _get_or_create_fornecedor(db: Session, comercio_id: int, nome: Optional[str]) -> Fornecedor:
    if nome:
        found = _find_fornecedor_by_name(db, comercio_id, nome)
        if found:
            return found
        return _create_fornecedor(db, comercio_id, nome)
    placeholder_name = "Sem fornecedor"
    found = _find_fornecedor_by_name(db, comercio_id, placeholder_name)
    if found:
        return found
    return _create_fornecedor(db, comercio_id, placeholder_name)

def _find_unimed_by_sigla(db: Session, comercio_id: int, sigla: str) -> Optional[UnidadeMedida]:
    if not sigla:
        return None
    return db.query(UnidadeMedida).filter(
        UnidadeMedida.comercio_id == comercio_id,
        UnidadeMedida.sigla.ilike(sigla.strip())
    ).first()

def _create_unimed(db: Session, comercio_id: int, nome: str, sigla: str) -> UnidadeMedida:
    u = UnidadeMedida(nome=nome.strip(), sigla=sigla.strip(), comercio_id=comercio_id)
    db.add(u)
    db.flush()
    return u

def _get_or_create_unimed(db: Session, comercio_id: int, sigla_or_none: Optional[str]) -> UnidadeMedida:
    # se o front enviar uma sigla (ex: "un"), tenta usar; senão procura placeholder 'un'
    if sigla_or_none:
        found = _find_unimed_by_sigla(db, comercio_id, sigla_or_none)
        if found:
            return found
        return _create_unimed(db, comercio_id, nome=sigla_or_none, sigla=sigla_or_none)
    placeholder_sigla = "un"
    found = _find_unimed_by_sigla(db, comercio_id, placeholder_sigla)
    if found:
        return found
    # cria com nome = "Unidade (padrão)" e sigla 'un'
    return _create_unimed(db, comercio_id, nome="Unidade (padrão)", sigla=placeholder_sigla)

# ---------- create_produto (principal) ----------
def create_produto(db: Session,
                   comercio_id: int,
                   nome: str,
                   preco: Decimal,
                   quantidade_estoque: Optional[int] = 0,
                   categoria: Optional[int] = None,
                   fornecedor: Optional[int] = None,
                   unimed: Optional[int] = None,
                   limiteEstoque: Optional[int] = 0,
                   tags: Optional[str] = None) -> Produto:
    # validações básicas
    if not nome or not str(nome).strip():
        raise ValueError("Campo 'nome' é obrigatório")

    try:
        if preco is Decimal:
            preco_dec = preco
        else:
            preco_dec = Decimal(str(preco))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError("Formato de preço inválido. Use número ex.: 99.90")
    if preco_dec < 0:
        raise ValueError("Preço não pode ser negativo")

    try:
        quantidade_int = int(quantidade_estoque or 0)
    except (TypeError, ValueError):
        raise ValueError("quantidade_estoque deve ser inteiro")
    if quantidade_int < 0:
        raise ValueError("quantidade_estoque não pode ser negativa")

    try:
        limite_int = int(limiteEstoque or 0)
    except (TypeError, ValueError):
        raise ValueError("limiteEstoque deve ser inteiro")
    if limite_int < 0:
        raise ValueError("limiteEstoque não pode ser negativo")

    # operação dentro de transação
    with db.begin():
        # obtém código atômico (irá inserir/atualizar contadores_locais)
        codigo_resultado = next_codigo(db, comercio_id, 'produtos')

        produto = Produto(
            codigo=codigo_resultado,
            nome=nome.strip(),
            preco=preco_dec,                 # usar valor convertido
            quantidade_estoque=quantidade_int,  # usar valor convertido
            # se houver campo limite_estoque no model, defina-o aqui:
            # limite_estoque=limite_int,
            tags=tags,
            comercio_id=comercio_id,
            fornecedor_id=fornecedor,
            unimed_id=unimed,
            categoria_id=categoria
        )
        db.add(produto)
        db.flush()  # garante que ids / defaults sejam populados
        return produto
