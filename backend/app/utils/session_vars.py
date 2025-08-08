from sqlalchemy import text
def set_usuario_logado(session, usuario_id):
    session.execute(text("SET LOCAL app.usuario_id = :uid"), {"uid": usuario_id})
