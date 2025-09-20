#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

usage() {
  cat <<EOF
Uso: $0 [--sorted] <pasta-origem> <arquivo-saida>
  --sorted      : opcional, ordena os caminhos dos arquivos antes de concatenar
  <pasta-origem>: pasta onde procurar recursivamente pelos arquivos .sql (padrão: .)
  <arquivo-saida>: arquivo .txt de saída (será sobrescrito)
Exemplo:
  $0 --sorted ./meu_projeto sql_context.txt
EOF
  exit 1
}

# parse flags
SORT=0
if [[ "${1:-}" == "--sorted" ]]; then
  SORT=1
  shift
fi

# positional args
src="${1:-.}"
out="${2:-}"

if [[ -z "$out" ]]; then
  usage
fi

if [[ ! -d "$src" ]]; then
  echo "Pasta de origem não encontrada: $src" >&2
  exit 2
fi

# cria/trunca arquivo de saída
: > "$out" || { echo "Não foi possível escrever em $out" >&2; exit 3; }

# coleta arquivos .sql (case-insensitive), usando separador NUL para suportar espaços
if [[ $SORT -eq 1 ]]; then
  # tenta usar sort -z (GNU). Se não suportar, cairá para ordenação por newline (funciona na maioria dos casos).
  if sort --help 2>&1 | grep -q -- '-z'; then
    mapfile -d '' -t files < <(find "$src" -type f -iname '*.sql' -print0 | sort -z)
  else
    # fallback (poderá falhar em nomes com newlines extremos)
    mapfile -t files < <(find "$src" -type f -iname '*.sql' -print | sort)
  fi
else
  mapfile -d '' -t files < <(find "$src" -type f -iname '*.sql' -print0)
fi

if [[ ${#files[@]} -eq 0 ]]; then
  echo "Nenhum arquivo .sql encontrado em $src"
  exit 0
fi

for file in "${files[@]}"; do
  # alguns sistemas deixam um trailing NUL-produzido vazio na última entrada; ignorar vazios
  [[ -z "$file" ]] && continue
  printf '\n-- FILE: %s\n\n' "$file" >> "$out"
  # adiciona conteúdo bruto do arquivo
  cat "$file" >> "$out"
  printf '\n\n-- END FILE: %s\n' "$file" >> "$out"
done

echo "Concatenado ${#files[@]} arquivos .sql em: $out"
