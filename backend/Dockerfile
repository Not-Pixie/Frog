#Python
FROM python:3.11-slim

#Define o diretório de trabalho dentro do container
WORKDIR /app

#Copia o arquivo de dependências
COPY requirements.txt .

#Instala as dependências do Python
RUN pip install --no-cache-dir -r requirements.txt

#Copia todo o código do backend para dentro do container
COPY . .

#Comando padrão ao rodar o container
CMD ["python", "main.py"]
