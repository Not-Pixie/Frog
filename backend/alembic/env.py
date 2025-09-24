from __future__ import with_statement
import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from sqlalchemy import create_engine
from alembic import context

# permite importar app/ do diretório raiz
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
fileConfig(config.config_file_name)

# --- IMPORTE AQUI O SEU BASE e os modelos ---
# Ajuste o caminho se o seu módulo estiver em local diferente
from app.database.database import Base, engine as app_engine
import app.models  # garante que todos os models sejam importados
# ------------------------------------------------

# set target_metadata for 'alembic revision --autogenerate'
target_metadata = Base.metadata

# get DB URL (prefer env var)
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    config.set_main_option("sqlalchemy.url", DATABASE_URL)

def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url, target_metadata=target_metadata, literal_binds=True
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = None

    # prefer env var; se não existir, usa o engine já criado pela app
    url = config.get_main_option("sqlalchemy.url")
    if url:
        connectable = create_engine(url, poolclass=pool.NullPool)
    else:
        # usa o engine criado pela sua aplicação (app.database.database.engine)
        connectable = app_engine

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
