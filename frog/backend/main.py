from app.config import engine
print("Conectado com sucesso ao banco!") if engine else print("Erro")
