from sqlalchemy.orm import Session
from app.models.usermodel import Usuario

def listar_usuarios(db: Session):
    return db.query(Usuario).all()

def criar_usuario(db: Session, usuario_data: dict):
    novo_usuario = Usuario(**usuario_data)
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario

def get_usuario_por_email(db: Session, email: str):
    return db.query(Usuario).filter(Usuario.email == email).first()

