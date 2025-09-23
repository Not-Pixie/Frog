import importlib, pkgutil, os
from flask import Flask, Blueprint
from flask_cors import CORS

from app.database.database import engine, Base
import app.models
from app.api.auth import comercio_bp

def register_blueprints(app):
    try:
        app.register_blueprint(comercio_bp)
    except Exception as e:
        print("Erro registrando comercio_bp:", e)

    # dinâmico (mais robusto)
    import app.routes as routes_pkg
    for finder, name, is_pkg in pkgutil.iter_modules(routes_pkg.__path__):
        if is_pkg:
            continue
        module = importlib.import_module(f"app.routes." + name)
        for obj in vars(module).values():
            if isinstance(obj, Blueprint):
                if obj.name in app.blueprints:
                    print(f"Pulando {name} -> bp.name='{obj.name}' (já registrado)")
                    continue
                app.register_blueprint(obj)
                print(f"Registrado: módulo='{name}' bp.name='{obj.name}' url_prefix='{obj.url_prefix}'")

def create_app():
    app = Flask(__name__)
    app.url_map.strict_slashes = False

    CORS(
        app,
        resources={r"/*": {"origins": ["http://localhost:5173"]}},
        supports_credentials=True,
        methods=["GET","POST","PUT","DELETE","OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"]
    )

    register_blueprints(app)

    print("=== Rotas registradas (app.url_map) ===")
    for rule in app.url_map.iter_rules():
        print(rule, "methods=", sorted(rule.methods), "->", rule.endpoint)
    print("=== fim rotas ===")

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 3001))
    print(f"Iniciando app Flask na porta {port} (debug=True, reloader desativado)")
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)
