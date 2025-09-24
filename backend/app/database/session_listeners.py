from flask import current_app, g, has_request_context
from sqlalchemy import event, text
from sqlalchemy.orm import Session

@event.listens_for(Session, "after_begin")
def _apply_app_user_id(session, transaction, connection):
    """
    Sempre que uma transação começar nessa conexão, seta o parâmetro
    local da transaction com o user_id que colocamos em `flask.g`.
    """
    if not has_request_context():
        return
    
    dados = getattr(g, "dados", None)
    usuario_id = getattr(dados, "id", None) if dados is not None else None
    
    if usuario_id is None:
        current_app.logger.debug("g não tem id de usuário")
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