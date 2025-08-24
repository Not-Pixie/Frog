from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from app.models.usuario_model import Usuario


def cadastrar_usuario(db: Session, nome_completo: str, email: str, senha: str) -> Usuario:
    """Cria um novo usuário, com hash seguro de senha"""
    usuario_existente = db.query(Usuario).filter_by(email=email).first()
    if usuario_existente:
        raise ValueError("Credenciais inválidas.")

    senha_hash = bcrypt.hash(senha)

    novo_usuario = Usuario(
        nome_completo=nome_completo,
        email=email,
        senha_hash=senha_hash,
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    return novo_usuario


def get_usuario_por_email(db: Session, email: str) -> Usuario | None:
    """Busca usuário pelo e-mail"""
    return db.query(Usuario).filter(Usuario.email == email).first()

def get_usuario_por_id(db: Session, usuario_id: int) -> Usuario | None:
    """Busca usuário pelo ID"""
    return db.query(Usuario).filter(Usuario.usuario_id == usuario_id).first()
