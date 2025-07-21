from config import engine
import os

print("Conectado com sucesso ao banco!") if engine else print("Erro")

from flask import Flask
from flask_cors import CORS
from app.routes.userroutes import usuario_bp
from app.models.usermodel import Base

app = Flask(__name__)
app.url_map.strict_slashes = False
CORS(app)

app.register_blueprint(usuario_bp)

Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3001))
    app.run(host="0.0.0.0", port=port, debug=True)