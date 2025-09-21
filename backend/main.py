from app.database.database import engine, Base
import app.models
import importlib
import pkgutil
import os

print("Conectado com sucesso ao banco!") if engine else print("Erro")

from flask import Blueprint, Flask
from flask_cors import CORS

# import explícito dos blueprints principais
from app.api.auth import comercio_bp

# não importa 'auth' de login_route aqui — o loop dinâmico cuidará disso

app = Flask(__name__)
app.url_map.strict_slashes = False

# Registrar blueprints importados explicitamente
app.register_blueprint(comercio_bp)


CORS(
    app,
     origins=["http://localhost:5173"],
     supports_credentials=True,
     methods=["GET","POST","PUT","DELETE","OPTIONS"],
     resources={r"/*": {"origins": "http://localhost:5173"}},
     allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Origin"],
     Secure=True
     )

print("=== Rotas registradas (app.url_map) ===")
for rule in app.url_map.iter_rules():
    print(rule, "methods=", sorted(rule.methods), "->", rule.endpoint)
print("=== fim rotas ===")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 3001))
    print(f"Iniciando app Flask na porta {port} (debug=True, reloader desativado)")
    # Em containers, desabilitar o reloader evita que o processo pai saia e encerre o container.
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)

# --- Registro dinâmico de rotas (com logs detalhados e proteção contra duplicatas) ---
package_name = "app.routes"
package_path = os.path.join(os.path.dirname(__file__), "app", "routes")

for _, module_name, is_pkg in pkgutil.iter_modules([package_path]):
    if not is_pkg:
        module = importlib.import_module(f"{package_name}.{module_name}")
        for attr_name in dir(module):
            attr = getattr(module, attr_name)
            if isinstance(attr, Blueprint):
                bp = attr
                bp_var = attr_name
                bp_internal_name = getattr(bp, "name", "<sem-name>")
                bp_prefix = getattr(bp, "url_prefix", "<sem-prefix>")
                # Se já houver um blueprint com o mesmo nome interno, pule
                if bp_internal_name in app.blueprints:
                    print(f"Pulando {module_name}.{bp_var}  -> bp.name='{bp_internal_name}' (já registrado)")
                    continue
                try:
                    app.register_blueprint(bp)
                    print(f"Registrado: var='{module_name}.{bp_var}'  bp.name='{bp_internal_name}'  url_prefix='{bp_prefix}'")
                except ValueError as e:
                    print(f"falha ao registrar {module_name}.{bp_var}: {e}")

