# contador_service.py
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session
from app.models import ContadorLocal

def next_codigo(session: Session, comercio_id: int, scope: str, step: int = 1) -> int:
    """
    Retorna o próximo código para o par (comercio_id, scope).
    Deve ser chamado dentro de uma transação (session.begin()).
    Usa SELECT ... FOR UPDATE para bloquear a linha e evitar race conditions.
    """
    # 1) tenta criar a linha se não existir (ON CONFLICT DO NOTHING)
    stmt_insert = pg_insert(ContadorLocal).values(
        comercio_id=comercio_id,
        scope=scope,
        ultimo_codigo=0
    ).on_conflict_do_nothing(index_elements=["comercio_id", "scope"])
    session.execute(stmt_insert)

    # 2) seleciona e bloqueia a linha
    stmt_select = (
        select(ContadorLocal)
        .where(ContadorLocal.comercio_id == comercio_id, ContadorLocal.scope == scope)
        .with_for_update()
    )
    row = session.execute(stmt_select).scalar_one()

    row.ultimo_codigo += step
    session.flush()
    return row.ultimo_codigo
