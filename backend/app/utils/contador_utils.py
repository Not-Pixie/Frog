from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError

from app.models import ContadorLocal

def next_codigo(session, comercio_id: int, scope: str, step: int = 1) -> int:
    """
    Deve ser chamado dentro de uma transação.
    - Se não existe -> insere com ultimo_codigo = step -> RETURNING -> retorna step
    - Se existe -> incrementa ultimo_codigo = ultimo_codigo + step -> RETURNING -> retorna novo valor
    """
    if step <= 0:
        raise ValueError("step must be > 0")

    tbl = ContadorLocal.__table__
    insert_stmt = pg_insert(tbl).values(
        comercio_id=comercio_id,
        scope=scope,
        ultimo_codigo=step,
    )

    stmt = insert_stmt.on_conflict_do_update(
        index_elements=["comercio_id", "scope"],
        set_={
            "ultimo_codigo": tbl.c.ultimo_codigo + insert_stmt.excluded.ultimo_codigo
        },
    ).returning(tbl.c.ultimo_codigo)

    # Executa e retorna o novo valor
    try:
        res = session.execute(stmt)
        novo = res.scalar_one()
    except IntegrityError:
        # opcional: re-raise ou tratar caso queira retry/backoff
        raise
    return int(novo)
