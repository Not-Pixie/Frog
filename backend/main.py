import importlib, pkgutil, os, traceback
from flask import Flask, Blueprint
from flask_cors import CORS

from app.database.database import engine, Base
import app.models

def register_blueprints(flask_app):
    from app.api.auth import comercio_bp
    try:
        flask_app.register_blueprint(comercio_bp)
    except Exception as e:
        print("Erro registrando comercio_bp:", e)

    import app.routes as routes_pkg
    for finder, name, is_pkg in pkgutil.iter_modules(routes_pkg.__path__):
        if is_pkg:
            continue
        module = importlib.import_module(f"{routes_pkg.__name__}.{name}")
        for obj in vars(module).values():
            if isinstance(obj, Blueprint):
                if obj.name in flask_app.blueprints:
                    print(f"Pulando {name} -> bp.name='{obj.name}' (já registrado)")
                    continue
                try:
                    flask_app.register_blueprint(obj)
                    print(f"Registrado: módulo='{name}' bp.name='{obj.name}' url_prefix='{obj.url_prefix}'")
                except Exception as e:
                    print(f"Erro registrando blueprint do módulo '{name}' (bp.name='{getattr(obj, 'name', None)}'):", e)
                    traceback.print_exc()

def create_app():
    flask_app = Flask(__name__)
    flask_app.url_map.strict_slashes = False

    CORS(
        flask_app,
        resources={r"/*": {"origins": ["http://localhost:5173"]}},
        supports_credentials=True,
        methods=["GET","POST","PUT","DELETE","OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"]
    )
    
    import app.database.session_listeners

    register_blueprints(flask_app)

    print("=== Rotas registradas (app.url_map) ===")
    for rule in flask_app.url_map.iter_rules():
        print(rule, "methods=", sorted(rule.methods), "->", rule.endpoint)
    print("=== fim rotas ===")

    return flask_app

if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 3001))
    print(f"Iniciando app Flask na porta {port} (debug=True, reloader desativado)")
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)
