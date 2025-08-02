set -e

echo "Lendo scrips .sql"

# Find and run all .sql files in subdirectories, sorted
find /docker-entrypoint-initdb.d/ -type f -name "*.sql" | sort | while read file; do
  echo "Executando $file"
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$file"
done