# app/services/product_service.py
from typing import Optional, Any
from sqlalchemy import or_
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from decimal import Decimal, InvalidOperation
import secrets

from app.models import Produto, Categoria, Fornecedor, UnidadeMedida
from app.utils.contador_utils import next_codigo  # ajuste conforme seus módulos

MAX_CODE_TRIES = 5

def _generate_codigo() -> str:
    return f"PRD-{secrets.token_hex(4)}"

# ---------- helpers para categorias/fornecedores (mantidos) ----------
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
    db.flush()
    return cat

def _get_or_create_category(db: Session, comercio_id: int, nome: Optional[str]) -> Categoria:
    if nome:
        found = _find_category_by_name(db, comercio_id, nome)
        if found:
            return found
        return _create_category(db, comercio_id, nome)
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

# ---------- helpers para unidade de medida (robustos) ----------
def _find_unimed_by_id(db: Session, comercio_id: int, unimed_id: int) -> Optional[UnidadeMedida]:
    """
    Busca por PK usando Session.get para evitar depender de nomes de coluna.
    Retorna a unidade se existir E for global (comercio_id IS NULL) ou pertencer ao comercio.
    """
    try:
        # usa Session.get (disponível no SQLAlchemy 1.4+) — busca por PK real do model
        uni = db.get(UnidadeMedida, int(unimed_id))
    except Exception:
        return None

    if uni is None:
        return None
    
    uni_comercio = getattr(uni, "comercio_id", None)
    if uni_comercio is None or uni_comercio == comercio_id:
        return uni

 
    return None


def _create_unimed(db: Session, comercio_id: int, nome: str, sigla: str) -> UnidadeMedida:
    u = UnidadeMedida(nome=nome.strip(), sigla=sigla.strip(), comercio_id=comercio_id)
    db.add(u)
    db.flush()
    return u

def _get_or_create_unimed(db: Session, comercio_id: int, sigla_or_none: Optional[str]) -> UnidadeMedida:
    if sigla_or_none:
        found = _find_unimed_by_id(db, comercio_id, sigla_or_none)
        if found:
            return found
        return _create_unimed(db, comercio_id, nome=sigla_or_none, sigla=sigla_or_none)
    placeholder_sigla = "un"
    found = _find_unimed_by_id(db, comercio_id, placeholder_sigla)
    if found:
        return found
    return _create_unimed(db, comercio_id, nome="Unidade (padrão)", sigla=placeholder_sigla)

# utilitário para extrair o id real de um model (tenta vários nomes de atributo comuns)
def _get_model_id(instance: Any) -> Optional[int]:
    for attr in ("unidade_medida_id", "unimed_id", "id", "pk"):
        if hasattr(instance, attr):
            val = getattr(instance, attr)
            try:
                return int(val) if val is not None else None
            except (TypeError, ValueError):
                return None
    # fallback: tenta atributo genérico 'id' via __dict__
    val = getattr(instance, "id", None)
    try:
        return int(val) if val is not None else None
    except Exception:
        return None

# ---------- create_produto (principal) ----------
def create_produto(db: Session,
                   comercio_id: int,
                   nome: str,
                   preco: Any,
                   quantidade_estoque: Optional[Any] = 0,
                   categoria: Optional[Any] = None,
                   fornecedor: Optional[Any] = None,
                   unimed: Optional[Any] = None,
                   limiteEstoque: Optional[Any] = 0,
                   tags: Optional[str] = None) -> Produto:
    # validações básicas
    if not nome or not str(nome).strip():
        raise ValueError("Campo 'nome' é obrigatório")

    # conversão segura do preço para Decimal
    try:
        if isinstance(preco, Decimal):
            preco_dec = preco
        else:
            preco_dec = Decimal(str(preco))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError("Formato de preço inválido. Use número ex.: 99.90")
    if preco_dec < 0:
        raise ValueError("Preço não pode ser negativo")

    # converte quantidade e limite para int (aceita strings)
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

    # coerção/validação de ids (categoria, fornecedor)
    categoria_id = None
    fornecedor_id = None
    unimed_id = None

    if categoria is not None:
        try:
            categoria_id = int(categoria)
        except (TypeError, ValueError):
            raise ValueError("categoria deve ser um id inteiro")
        cat = db.query(Categoria).filter(Categoria.categoria_id == categoria_id, Categoria.comercio_id == comercio_id).first()
        if cat is None:
            raise ValueError(f"Categoria {categoria_id} não encontrada para o comércio {comercio_id}")

    if fornecedor is not None:
        try:
            fornecedor_id = int(fornecedor)
        except (TypeError, ValueError):
            raise ValueError("fornecedor deve ser um id inteiro")
        forn = db.query(Fornecedor).filter(Fornecedor.fornecedor_id == fornecedor_id, Fornecedor.comercio_id == comercio_id).first()
        if forn is None:
            raise ValueError(f"Fornecedor {fornecedor_id} não encontrado para o comércio {comercio_id}")

    # ---- tratamento robusto para unimed: aceita id (int) ou sigla/name (str) ----
    if unimed is not None:
        # se for inteiro ou string numérica -> trata como id
        if isinstance(unimed, (int,)) or (isinstance(unimed, str) and str(unimed).strip().isdigit()):
            try:
                candidate_id = int(unimed)
            except (TypeError, ValueError):
                raise ValueError("unimed deve ser um id inteiro ou uma sigla válida")
            uni = _find_unimed_by_id(db, comercio_id, candidate_id)
            if uni is None:
                raise ValueError(f"Unidade de medida {candidate_id} não encontrada para o comércio {comercio_id}")
            unimed_id = _get_model_id(uni)
        else:
            # se for string não numérica, tenta tratar como sigla -> get_or_create
            sigla = str(unimed).strip()
            uni = _get_or_create_unimed(db, comercio_id, sigla)
            unimed_id = _get_model_id(uni)

    # operação dentro de transação
    try:
        codigo_resultado = next_codigo(db, comercio_id, 'produtos')

        produto = Produto(
            codigo=codigo_resultado,
            nome=nome.strip(),
            preco=preco_dec,
            quantidade_estoque=quantidade_int,
            tags=tags,
            comercio_id=comercio_id,
            fornecedor_id=fornecedor_id,
            unimed_id=unimed_id,
            categoria_id=categoria_id
        )
        db.add(produto)
        db.flush()
        return produto
    except Exception:
        raise


def delete_produto(db, produto_id: int, comercio_id: int) -> bool:
    """
    Deleta um produto garantindo que ele pertença ao comercio_id.
    Retorna True se deletado; lança ValueError se não encontrado;
    relança IntegrityError/SQLAlchemyError para o caller tratar.
    """

    # montar condições para PK flexível (id ou produto_id)
    conds = []
    if hasattr(Produto, "id"):
        conds.append(Produto.id == produto_id)
    if hasattr(Produto, "produto_id"):
        conds.append(Produto.produto_id == produto_id)

    if not conds:
        # modelo inesperado — explícito para facilitar debug
        raise RuntimeError("Modelo Produto não possui atributo 'id' nem 'produto_id'")

    try:
        prod = db.query(Produto).filter(or_(*conds), Produto.comercio_id == comercio_id).one_or_none()
        if prod is None:
            raise ValueError("Produto não encontrado para este comércio")

        db.delete(prod)
        db.commit()
        return True

    except IntegrityError:
        db.rollback()
        # relança para a rota decidir a resposta HTTP
        raise
    except SQLAlchemyError:
        db.rollback()
        # log no caller; relança para a rota retornar 500
        raise