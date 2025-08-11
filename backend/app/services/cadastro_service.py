from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from app.models.usuario_model import Usuario
from app.models.comercio_model import Comercio
from app.models.comercios_usuarios import ComercioUsuario


def cadastrar_completo(
    db: Session,
    nome_completo: str,
    email: str,
    senha: str,
    nome_negocio: str,
    telefone: str = None
):
    # 1. Verifica se já existe um usuário com esse e-mail
    usuario_existente = db.query(Usuario).filter_by(email=email).first()
    if usuario_existente:
        raise ValueError("E-mail já cadastrado.")

    # 2. Cria o usuário
    senha_hash = bcrypt.hash(senha)
    novo_usuario = Usuario(
        nome=nome_completo,
        email=email,
        senha=senha_hash,
        telefone=telefone
    )
    db.add(novo_usuario)
    db.flush()  # já preenche novo_usuario.id sem precisar dar commit

    # 3. Cria o comércio (negócio)
    novo_comercio = Comercio(
        nome=nome_negocio,
        criador_id=novo_usuario.id
    )
    db.add(novo_comercio)
    db.flush()

    # 4. Relaciona o criador ao comércio
    relacao = ComercioUsuario(
        comercio_id=novo_comercio.id,
        usuario_id=novo_usuario.id,
        cargo="dono"  # ou equivalente ao seu modelo
    )
    db.add(relacao)

    # 5. Commit final
    db.commit()

    # 6. Refresh para garantir dados atualizados
    db.refresh(novo_usuario)
    db.refresh(novo_comercio)

    return novo_usuario, novo_comercio
