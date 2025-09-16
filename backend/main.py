from app.database.database import engine, Base
import app.models
import importlib
import pkgutil
import os

print("Conectado com sucesso ao banco!") if engine else print("Erro")

from flask import Blueprint, Flask
from flask_cors import CORS
from app.routes.cadastro_user_route import cadastro_bp
from app.routes.login_route import auth
from app.database.database import Base

app = Flask(__name__)
app.url_map.strict_slashes = False
CORS(app, 
     origins=["http://localhost:5173"],
     supports_credentials=True,
     resources={r"/*": {"origins": "http://localhost:5173"}},
     allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Origin"],
     Secure=True)

# --- Registro dinâmico de rotas ---
package_name = "app.routes"
package_path = os.path.join(os.path.dirname(__file__), "app", "routes")

for _, module_name, is_pkg in pkgutil.iter_modules([package_path]):
    if not is_pkg:
        module = importlib.import_module(f"{package_name}.{module_name}")
        # percorre atributos do módulo e registra se for Blueprint
        for attr_name in dir(module):
            attr = getattr(module, attr_name)
            if isinstance(attr, Blueprint):
                app.register_blueprint(attr)
                print(f"Blueprint registrado: {attr_name} de {module_name}")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 3001))
    app.run(host="0.0.0.0", port=port, debug=True)