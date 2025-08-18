# app/services/usuario_service.py
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from app.models.usuario_model import Usuario


def cadastrar_usuario(
    db: Session,
    nome_completo: str,
    email: str,
    senha: str,
    telefone: str = None
) -> Usuario:
    # 1. Verifica se o e-mail já está cadastrado
    usuario_existente = db.query(Usuario).filter_by(email=email).first()
    if usuario_existente:
        raise ValueError("E-mail já cadastrado.")

    # 2. Gera hash da senha
    senha_hash = bcrypt.hash(senha)

    # 3. Cria o usuário
    novo_usuario = Usuario(
        nome_completo=nome_completo,
        email=email,
        senha_hash=senha_hash,
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    return novo_usuario
