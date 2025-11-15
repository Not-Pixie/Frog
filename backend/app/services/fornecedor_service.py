# app/services/fornecedor_service.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy import or_
from app.models.fornecedores_model import Fornecedor
from app.models.enderecos_model import Endereco
from app.utils.contador_utils import next_codigo

def create_fornecedor(db: Session,
                      comercio_id: int,
                      nome: str,
                      cnpj: str,
                      telefone: str = None,
                      email: str = None,
                      cep: str = None,
                      numero: str = None,
                      complemento: str = None) -> Fornecedor:
    """
    Cria fornecedor (e opcionalmente endereco) atribuindo codigo local atômico.
    Retorna a instância Fornecedor.
    """
    nome = (nome or "").strip()
    cnpj = (cnpj or "").strip()
    if not nome:
        raise ValueError("Campo 'nome' é obrigatório")
    if not cnpj:
        raise ValueError("Campo 'cnpj' é obrigatório")

    try:
        # cria endereco se necessário
        endereco_obj = None
        if cep or numero or complemento:
            endereco_obj = Endereco(
                cep=cep or "",
                numero=numero,
                complemento=complemento,
                status="partial",
                source="user"
            )
            db.add(endereco_obj)
            db.flush()  # endereco_obj.endereco_id disponível

        # pega código atômico para fornecedores
        codigo_local = next_codigo(db, comercio_id, "fornecedores")

        fornecedor = Fornecedor(
            comercio_id=comercio_id,
            codigo=codigo_local,
            nome=nome,
            cnpj=cnpj,
            telefone=telefone,
            email=email,
            endereco_id=(endereco_obj.endereco_id if endereco_obj is not None else None)
        )
        db.add(fornecedor)
        db.flush()
        db.commit()
        db.refresh(fornecedor)
        if endereco_obj is not None:
            db.refresh(endereco_obj)
        return fornecedor
    
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass
        raise


def delete_fornecedor(db, fornecedor_id: int, comercio_id: int) -> bool:
    """
    Deleta fornecedor garantindo que pertença ao comercio_id.
    Com ON DELETE SET NULL no DB, os produtos terão fornecedor_id = NULL automaticamente.
    """
    conds = []
    if hasattr(Fornecedor, "fornecedor_id"):
        conds.append(Fornecedor.fornecedor_id == fornecedor_id)
    if hasattr(Fornecedor, "id"):
        conds.append(Fornecedor.id == fornecedor_id)

    if not conds:
        raise RuntimeError("Modelo Fornecedor não possui atributo 'fornecedor_id' nem 'id'")

    try:
        f = db.query(Fornecedor).filter(or_(*conds), Fornecedor.comercio_id == comercio_id).one_or_none()
        if f is None:
            raise ValueError("Fornecedor não encontrado para este comércio")

        db.delete(f)
        db.commit()
        return True

    except IntegrityError:
        db.rollback()
        raise
    except SQLAlchemyError:
        db.rollback()
        raise

def get_fornecedor_por_id(db, fornecedor_id: int, comercio_id: int):
    """
    Retorna instância Fornecedor (ou None) com endereco carregado.
    """
    q = (
        db.query(Fornecedor)
        .options(joinedload(Fornecedor.endereco))
        .filter(Fornecedor.fornecedor_id == fornecedor_id, Fornecedor.comercio_id == comercio_id)
    )
    return q.one_or_none()


def _upsert_endereco(db, fornecedor, endereco_payload: dict):
    """
    Se fornecedor.endereco existir -> atualiza os campos passados.
    Se não existir e houver dados significativos -> cria novo endereço e associa.
    Retorna a instância Endereco (ou None se nada feito).
    """
    # campos válidos de endereço
    addr_fields = ("cep", "logradouro", "numero", "complemento", "bairro", "cidade", "estado", "pais")

    # verifica se payload tem qualquer campo utilizável
    has_any = any(k in endereco_payload and endereco_payload.get(k) not in (None, "") for k in addr_fields)
    if not has_any:
        return None

    if getattr(fornecedor, "endereco", None):
        end = fornecedor.endereco
        for k in addr_fields:
            if k in endereco_payload:
                v = endereco_payload.get(k)
                setattr(end, k, v.strip() if isinstance(v, str) and v.strip() != "" else None)
        db.add(end)
        db.flush()  # garante que id existe
        return end
    else:
        # criar novo endereco
        new = Endereco(
            cep=(endereco_payload.get("cep") or None),
            logradouro=(endereco_payload.get("logradouro") or None),
            numero=(endereco_payload.get("numero") or None),
            complemento=(endereco_payload.get("complemento") or None),
            bairro=(endereco_payload.get("bairro") or None),
            cidade=(endereco_payload.get("cidade") or None),
            estado=(endereco_payload.get("estado") or None),
            pais=(endereco_payload.get("pais") or "BR"),  # default BR se vazio
            status="partial",
            source="user",
        )
        db.add(new)
        db.flush()  # para popular new.endereco_id
        fornecedor.endereco = new
        return new


def update_fornecedor(db, fornecedor_id: int, comercio_id: int, data: dict):
    """
    Atualiza campos permitidos de fornecedor. Se payload conter dados de endereco,
    cria/atualiza o endereco e associa ao fornecedor.
    Retorna a instância Fornecedor atualizada.
    """
    f = get_fornecedor_por_id(db, fornecedor_id, comercio_id)
    if f is None:
        raise ValueError("Fornecedor não encontrado para este comércio")

    # campos permitidos do fornecedor
    allowed = ("nome", "cnpj", "telefone", "email")

    # separar dados de endereco (sevierem)
    endereco_payload = {}
    for k in ("cep", "logradouro", "numero", "complemento", "bairro", "cidade", "estado", "pais"):
        if k in data:
            endereco_payload[k] = data[k]

    # atualizar campos simples
    for k in allowed:
        if k in data:
            v = data[k]
            if v is None:
                setattr(f, k, None)
            else:
                if isinstance(v, str):
                    vv = v.strip()
                    setattr(f, k, vv if vv != "" else None)
                else:
                    setattr(f, k, v)

    try:
        # tratar endereco (criar/atualizar)
        if endereco_payload:
            _upsert_endereco(db, f, endereco_payload)

        db.add(f)
        db.commit()
        db.refresh(f)
        return f
    except SQLAlchemyError:
        db.rollback()
        raise