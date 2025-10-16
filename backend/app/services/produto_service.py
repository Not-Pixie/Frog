# app/services/product_service.py
from typing import Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from decimal import Decimal, InvalidOperation
import secrets
import datetime

from app.models import Produto, Categoria, Fornecedor, UnidadeMedida  # ajuste conforme seus módulos

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
                   preco: Any,
                   quantidade_estoque: Optional[int] = 0,
                   categoria: Optional[str] = None,   # string do front
                   fornecedor: Optional[str] = None,  # string do front
                   unimed_sigla: Optional[str] = None,
                   limiteEstoque: Optional[int] = 0,
                   tag: Optional[str] = None) -> Produto:
    """
    Cria produto, garantindo que categoria_id/fornecedor_id/unimed_id existam.
    - se categoria/fornecedor.zip (string) vier, tentamos achar; senão criamos.
    - se unimed_sigla for fornecido, tentamos achar por sigla; senão criamos/usa placeholder 'un'.
    """

    # validações básicas
    if not nome or not str(nome).strip():
        raise ValueError("Campo 'nome' é obrigatório")

    try:
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

    # agora, garantimos os registros de categoria, fornecedor e unidade
    # usamos uma transação; se algum create falhar, faremos rollback abaixo
    # NOTA: estamos usando db.flush() nos helpers para conseguir os ids antes do commit
    try:
        # conseguiu achar/criar categoria
        cat = _get_or_create_category(db, comercio_id, categoria)
        forn = _get_or_create_fornecedor(db, comercio_id, fornecedor)
        unid = _get_or_create_unimed(db, comercio_id, unimed_sigla)

        # gerar codigo único
        codigo = None
        for _ in range(MAX_CODE_TRIES):
            candidate = _generate_codigo()
            existing = db.query(Produto).filter_by(codigo=candidate).first()
            if not existing:
                codigo = candidate
                break
        if not codigo:
            raise RuntimeError("Falha ao gerar código único para o produto; tente novamente")

        produto = Produto(
            codigo=codigo,
            nome=nome.strip(),
            preco=preco_dec,
            quantidade_estoque=quantidade_int,
            categoria_id=cat.categoria_id,
            fornecedor_id=forn.fornecedor_id,
            unimed_id=unid.unimed_id,
            comercio_id=comercio_id,
            tag=tag,
            criado_em=datetime.datetime.now(),
            atualizado_em=datetime.datetime.now()
        )

        db.add(produto)
        db.commit()
        db.refresh(produto)
        return produto

    except Exception as e:
        db.rollback()
        raise
