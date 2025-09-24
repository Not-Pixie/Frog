FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends postgresql-client && \
    rm -rf /var/lib/apt/lists/*

# copie requirements e instale (cache layer)
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copia explicitamente o entrypoint para a raiz /app
COPY entrypoint.sh entrypoint.sh

# copie o restante do código
COPY . /app

# (opcional para debug) RUN ls -la /app
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "main:create_app()", "--bind", "0.0.0.0:3001", "--workers", "4", "--timeout", "120"]
