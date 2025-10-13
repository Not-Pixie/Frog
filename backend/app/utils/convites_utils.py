# app/utils/convites_utils.py
import datetime
from flask import g
from sqlalchemy.exc import IntegrityError

from app.models import *

def validar_convite(invite_code: str, usuario: dict, db):
    """
    Valida o convite e retorna um dicionário compatível com o front:
    { 
        'isValid': bool, 
        'comercio': {...} (se válido), 
        'message': 'texto' (se inválido) 
    }
    """
    if not invite_code:
        return {"isValid": False, "message": "Código de convite ausente"}

    convite: Convite = db.query(Convite).filter(Convite.link == invite_code).first() 
    if not convite:
        return {"isValid": False, "message": "Convite não encontrado"}

    # if getattr(convite, "expira_em", None):
    #     if convite.expira_em < datetime.datetime.now(datetime.timezone.utc):
    #         return {"isValid": False, "message": "Convite expirado"}

    comercio: Comercio = db.query(Comercio).filter(Comercio.comercio_id == convite.comercio_id).first()
    if not comercio:
        return {"isValid": False, "message": "Comércio vinculado ao convite não encontrado"}
    
    usuario_id = usuario.get("usuario_id")
    if not usuario_id:
        return {"isValid": False, "message": "usuario_id ausente"}

    # Verifica se o usuário já possui vínculo com o comércio
    acesso_existente = db.query(ComercioUsuario).filter(
        ComercioUsuario.usuario_id == usuario_id,
        ComercioUsuario.comercio_id == convite.comercio_id
    ).first()
    if acesso_existente:
        return {"isValid": False, "message": "Usuário já possui acesso a esse comércio"}

    comercio_serializado = {
        "comercio_id": getattr(comercio, "comercio_id", None),
        "nome": getattr(comercio, "nome", None),
        "proprietario_id": comercio.proprietario_id == usuario_id,
        "criado_em": getattr(comercio, "criado_em", None),
    }

    return {"isValid": True, "comercio": comercio_serializado}


def aceitar_convite(invite_code: str, usuario_id: int, db):
    """
    Realiza a aceitação do convite:
    - valida convite
    - cria registro de acesso (vincula usuário ao comércio)
    - marca convite como usado (se for o caso)
    Retorna dict: {'success': bool, 'message': str}
    """
    if not invite_code:
        return {"success": False, "message": "inviteCode ausente"}

    convite: Convite = db.query(Convite).filter(Convite.link == invite_code).with_for_update().first()  # lock

    if not convite:
        return {"success": False, "message": "Convite não encontrado"}

    validation = validar_convite(invite_code, {"usuario_id": usuario_id}, db)
    if not validation.get("isValid", False):
        return {"success": False, "message": validation.get("message", "Convite inválido")}

    # # Verifica se o convite já foi usado???
    # if getattr(convite, "usado", False):
    #     return {"success": False, "message": "Convite já utilizado"}

    try:
        # Obter o comércio vinculado
        comercio: Comercio = db.query(Comercio).filter(Comercio.comercio_id == convite.comercio_id).first()
        if not comercio:
            return {"success": False, "message": "Comércio vinculado ao convite não encontrado"}

        # Criar vinculo de acesso entre usuario e comercio
        acesso = ComercioUsuario(
            usuario_id=usuario_id,
            comercio_id=getattr(comercio, "comercio_id"),
            permissao="membro"
        )
        db.add(acesso)
        db.commit()
        
        return {"success": True, "message": "Convite aceito com sucesso"}
    except IntegrityError as e:
        db.rollback()
        # IntegrityError provavelmente vem de tentativa de duplicar acesso
        return {"success": False, "message": "Usuário já tem acesso a esse comércio"}
    except Exception as e:
        db.rollback()
        return {"success": False, "message": f"Erro ao aceitar convite: {str(e)}"}
