# contador_utils.py
from sqlalchemy import text

def next_codigo_atomic(session, comercio_id: int, scope: str, step: int = 1) -> int:
    """
    Operação atômica:
    - Se não existe -> insere com ultimo_codigo = step -> RETURNING -> retorna step
    - Se existe -> incrementa ultimo_codigo = ultimo_codigo + step -> RETURNING -> retorna novo valor
    Deve ser chamado dentro de uma transação.
    """
    sql = text("""
    INSERT INTO contadores_locais (comercio_id, scope, ultimo_codigo)
    VALUES (:comercio_id, :scope, :step)
    ON CONFLICT (comercio_id, scope)
    DO UPDATE
      SET ultimo_codigo = contadores_locais.ultimo_codigo + EXCLUDED.ultimo_codigo
    RETURNING ultimo_codigo;
    """)
    res = session.execute(sql, {"comercio_id": comercio_id, "scope": scope, "step": step})
    novo = res.scalar_one()
    return int(novo)
