from datetime import date, datetime
from decimal import Decimal
import uuid


def model_to_dict(obj):
    """
    Converte um objeto SQLAlchemy para dict usando as colunas definidas em obj.__table__.
    Trata tipos comuns: datetime/date -> ISO string, Decimal -> float, UUID -> str.
    Se algo falhar, faz um fallback para __dict__ omitindo chaves privadas.
    """
    try:
        cols = getattr(obj, "__table__", None).columns
        out = {}
        for c in cols:
            name = c.name
            val = getattr(obj, name)
            if isinstance(val, (datetime, date)):
                out[name] = val.isoformat()
            elif isinstance(val, Decimal):
                try:
                    out[name] = str(val)
                except (ValueError, TypeError):
                    raise
            elif isinstance(val, uuid.UUID):
                out[name] = str(val)
            else:
                out[name] = val
        return out
    except Exception:
        # fallback, usa __dict__ omitindo keys privadas
        return {k: v for k, v in getattr(obj, "__dict__", {}).items() if not k.startswith("_")}