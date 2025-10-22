#!/bin/sh
set -e

# espera o Postgres ficar pronto (usa pg_isready)
# ajuste DB_HOST/DB_PORT/DB_USER se necessÃ¡rio
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}

echo "Esperando Postgres em $DB_HOST:$DB_PORT..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; do
  sleep 1
done
echo "Postgres pronto."

# aplica migrations (Alembic)
echo "Aplicando migrations (alembic upgrade head)..."

alembic upgrade head

echo "Que delícia!"

# Por seguranÃ§a, vocÃª pode tambÃ©m garantir create_all em dev:
# python -c "from app.database.database import Base, engine; import app.models; Base.metadata.create_all(bind=engine)"

# finalmente, executa o comando padrÃ£o do container (por ex. gunicorn/flask run)
exec "$@"



