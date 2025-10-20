from flask import current_app, g, has_request_context
from sqlalchemy import Engine, event, text
from sqlalchemy.orm import Session

@event.listens_for(Engine, "begin")
def _apply_app_user_id(connection):
    """
    Sempre que uma transação começar nessa conexão, seta o parâmetro
    local da transaction com o user_id que colocamos em `flask.g`.
    """
    if not has_request_context():
        return
    
    usuario = g.get("usuario") or None
    
    if usuario is None:
        usuario_id = None
    elif isinstance(usuario, dict):
        usuario_id = usuario.get("usuario_id") or usuario.get("id")  # adapte chaves se necessário
    else:
        usuario_id = getattr(usuario, "usuario_id", None)
    
    if usuario_id is None:
        current_app.logger.debug("g não tem id de usuário")
        current_app.logger.debug("usuario = %s", usuario)
        current_app.logger.debug("usuario_id = %s", usuario_id)
        return
    
    try:
        connection.execute(
            text("SELECT set_config('app.usuario_id', :uid, true)"),
            {"uid": str(usuario_id)}
        )
        current_app.logger.debug(f"session_listeners: set_config app.usuario_id={usuario_id}")
    except Exception as e:
        current_app.logger.exception("Erro ao setar app.usuario_id na conexão: %s", e)
        # Não tem raise pra não matar o frog; 
        # caso falhe, o DB vai lidar com isso 
        # GodBWYe