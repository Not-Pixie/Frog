def model_to_dict(obj):
    """Converte um objeto SQLAlchemy para dict usando as colunas definidas no __table__."""
    try:
        cols = obj.__table__.columns
        return {c.name: getattr(obj, c.name) for c in cols}
    except Exception:
        # fallback simples: usar __dict__ omitindo keys privadas
        return {k: v for k, v in getattr(obj, "__dict__", {}).items() if not k.startswith("_")}