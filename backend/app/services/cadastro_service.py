from sqlalchemy.orm import Session
from app.models import Email, Usuario, Negocio, NegocioEmailVerificado
from passlib.hash import bcrypt # type: ignore

def cadastrar_completo(db: Session, nome_completo: str, email: str, senha: str, nome_negocio: str, telefone: str):
    # 1. Verifica ou cria o email
    email_obj = db.query(Email).filter_by(endereco=email).first()
    if not email_obj:
        email_obj = Email(endereco=email, verificado=True)
        db.add(email_obj)
        db.commit()
        db.refresh(email_obj)

    # 2. Cria o usuário
    senha_hash = bcrypt.hash(senha)
    novo_usuario = Usuario(email_id=email_obj.id, nome_completo=nome_completo, senha_hash=senha_hash)
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    # 3. Cria o negócio
    novo_negocio = Negocio(criador_id=novo_usuario.id, nome=nome_negocio)
    db.add(novo_negocio)
    db.commit()
    db.refresh(novo_negocio)

    # 4. Adiciona o email do criador na lista de permitidos
    relacao = NegocioEmailVerificado(
        negocio_id=novo_negocio.id,
        email_id=email_obj.id,
        senha_hash=senha_hash
    )
    db.add(relacao)
    db.commit()

    return novo_usuario, novo_negocio
