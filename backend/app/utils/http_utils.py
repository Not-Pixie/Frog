from flask import request


def _parse_fields_arg():
    """
    Retorna lista de campos solicitados pelo query param 'fields'
    Ex: ?fields=fornecedor_id,nome
    Se ausente, retorna None (significa: retornar tudo)
    """
    fields = request.args.get("fields")
    if not fields:
        return None
    return [f.strip() for f in fields.split(",") if f.strip()]


def _filter_fields(obj_dict: dict, fields: list | None) -> dict:
    """Filtra obj_dict mantendo apenas keys em fields. Se fields for None, retorna obj_dict."""
    if fields is None:
        return obj_dict
    return {k: v for k, v in obj_dict.items() if k in fields}