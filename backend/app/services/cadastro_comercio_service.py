# app/services/cadastro_comercio_service.py
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.models.comercios_model import Comercio
from app.models.comercios_usuarios import ComercioUsuario
from app.models.configs_comercio import ConfiguracaoComercio

def criar_comercio(proprietario_id: int, nome: str, configs: dict | None = None) -> Comercio:
    """
    Cria um comercio, a configuracao (opcional) e associa o usuario como membro/proprietario.
    Lança IntegrityError se o nome for duplicado.
    Retorna a instância Comercio (persistida).
    """
    session: Session = SessionLocal()
    try:
        # 1) cria configuracao (se veio)
        configuracao_obj = None
        if configs:
            # mapeie campos do payload para os nomes da tabela, com coerção/validação mínima:
            unidade = configs.get("campo1") or configs.get("unidade_padrao") or "un"
            nivel_alerta = configs.get("campo4")  # pode vir como string; tente converter
            try:
                nivel_alerta_val = float(nivel_alerta) if nivel_alerta is not None else 0.0
            except Exception:
                nivel_alerta_val = 0.0

            configuracao_obj = ConfiguracaoComercio(
                unidade_padrao=unidade,
                nivel_alerta_minimo=nivel_alerta_val,
                # outros defaults já cobertos pelo model
            )
            session.add(configuracao_obj)
            session.flush()  # grava temporariamente para obter configuracao_obj.id

        # 2) cria comercio apontando para a configuracao (se houver)
        comercio = Comercio(
            proprietario_id=proprietario_id,
            nome=nome,
            configuracao_id=(configuracao_obj.id if configuracao_obj else None)
        )
        session.add(comercio)
        session.flush()  # garante comercio.comercio_id

        # 3) cria associacao comercio-usuario
        assoc = ComercioUsuario(comercio_id=comercio.comercio_id, usuario_id=proprietario_id, papel="owner")
        session.add(assoc)

        # 4) commit final
        session.commit()
        session.refresh(comercio)
        return comercio
    except IntegrityError:
        session.rollback()
        raise
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
