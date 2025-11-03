# app/services/fornecedor_service.py
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
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
