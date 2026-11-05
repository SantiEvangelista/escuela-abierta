#!/bin/sh
# Genera una carpeta nueva desde una lista explícita de insumos de build.
set -eu
cd "$(dirname "$0")/.."
out="${1:-dist/vercel-preview}"
if [ -e "$out" ]; then
  echo "El destino ya existe: elegí otro directorio para no pisar archivos o un vínculo .vercel previo." >&2
  exit 1
fi
mkdir -p "$out"
cp -R src public "$out/"
cp package.json package-lock.json tsconfig.json next.config.ts next-env.d.ts .vercelignore "$out/"
du -sh "$out"
