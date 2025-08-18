# app/services/comercio_service.py
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select

from app.models.comercio_model import Comercio
from app.models.comercios_usuarios import ComercioUsuario
from app.models.usuario_model import Usuario


class ComercioServiceError(Exception):
    pass


def criar_comercio(db: Session, proprietario_id: int, nome: str) -> Comercio:
    """
    Cria um novo comércio definindo 'proprietario_id' como dono.
    """
    if not nome or not nome.strip():
        raise ComercioServiceError("Nome do comércio é obrigatório.")

    comercio = Comercio(proprietario_id=proprietario_id, nome=nome.strip())
    db.add(comercio)
    try:
        db.commit()
        db.refresh(comercio)
    except IntegrityError:
        db.rollback()
        raise ComercioServiceError("Já existe um comércio com esse nome.")
    return comercio


def get_comercio_por_id(db: Session, comercio_id: int) -> Optional[Comercio]:
    return db.query(Comercio).filter(Comercio.id == comercio_id).first()


def listar_comercios_do_proprietario(db: Session, proprietario_id: int) -> List[Comercio]:
    return db.query(Comercio).filter(Comercio.proprietario_id == proprietario_id).all()


def usuario_eh_membro(db: Session, comercio_id: int, usuario_id: int) -> bool:
    return db.query(ComercioUsuario).filter(
        ComercioUsuario.comercio_id == comercio_id,
        ComercioUsuario.usuario_id == usuario_id
    ).first() is not None


# ---------- Adicionar membro (owner-forced / admin) ----------
def adicionar_membro_por_email(db: Session, comercio_id: int, email_usuario: str) -> ComercioUsuario:
    """
    Adiciona um membro ao comércio buscando o usuário pelo email.
    -> Se o usuário não existir, retorna erro (padrão: owner deve convidar pelo fluxo de invites)
    """
    email_usuario = (email_usuario or "").strip().lower()
    if not email_usuario:
        raise ComercioServiceError("E-mail do usuário é obrigatório.")

    usuario = db.query(Usuario).filter(Usuario.email == email_usuario).first()
    if not usuario:
        raise ComercioServiceError("Usuário com esse e-mail não existe. Use o sistema de convites.")

    # evita duplicidade
    existente = db.query(ComercioUsuario).filter(
        ComercioUsuario.comercio_id == comercio_id,
        ComercioUsuario.usuario_id == usuario.id
    ).first()
    if existente:
        raise ComercioServiceError("Usuário já é membro deste comércio.")

    rel = ComercioUsuario(comercio_id=comercio_id, usuario_id=usuario.id)
    db.add(rel)
    try:
        db.commit()
        db.refresh(rel)
    except IntegrityError:
        db.rollback()
        raise ComercioServiceError("Erro ao adicionar membro.")
    return rel


def adicionar_membro_por_id(db: Session, comercio_id: int, usuario_id: int) -> ComercioUsuario:
    """
    Adiciona um membro ao comércio usando o id do usuário (útil para o fluxo de invites).
    """
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise ComercioServiceError("Usuário não encontrado.")

    existente = db.query(ComercioUsuario).filter(
        ComercioUsuario.comercio_id == comercio_id,
        ComercioUsuario.usuario_id == usuario_id
    ).first()
    if existente:
        raise ComercioServiceError("Usuário já é membro deste comércio.")

    rel = ComercioUsuario(comercio_id=comercio_id, usuario_id=usuario_id)
    db.add(rel)
    try:
        db.commit()
        db.refresh(rel)
    except IntegrityError:
        db.rollback()
        raise ComercioServiceError("Erro ao adicionar membro.")
    return rel


def remover_membro(db: Session, comercio_id: int, usuario_id: int) -> None:
    rel = db.query(ComercioUsuario).filter(
        ComercioUsuario.comercio_id == comercio_id,
        ComercioUsuario.usuario_id == usuario_id
    ).first()
    if not rel:
        raise ComercioServiceError("Membro não encontrado neste comércio.")
    db.delete(rel)
    db.commit()


def listar_membros(db: Session, comercio_id: int):
    """
    Retorna lista de membros do comércio com informações básicas do usuário.
    Ex.: [{usuario_id, email, nome_completo}]
    """
    q = (
        db.query(Usuario.id, Usuario.email, Usuario.nome_completo)
        .join(ComercioUsuario, ComercioUsuario.usuario_id == Usuario.id)
        .filter(ComercioUsuario.comercio_id == comercio_id)
    )
    rows = q.all()
    return [
        {"usuario_id": r.id, "email": r.email, "nome_completo": r.nome_completo}
        for r in rows
    ]
