# Reproducir la auditoría local

Desde la raíz de escuela_api. Requiere Docker y la base **local** del Compose del proyecto con el padrón cargado. Los nombres escuela-perf-* se reservan para este laboratorio. No reutilizar un contenedor o volumen que tenga otros datos. No se exponen puertos ni se necesitan credenciales de producción.

## Entorno aislado

```sh
docker network create escuela-perf-net
docker run -d --name escuela-perf-db --network escuela-perf-net --cpus 1 --memory 768m \
  -e POSTGRES_PASSWORD=bench -e POSTGRES_DB=bench postgres:17-bookworm
docker exec escuela-perf-db pg_isready -U postgres -d bench
# Esperar ready antes del restore. La conexión de origen sólo ejecuta pg_dump.
docker compose exec -T db sh -c 'pg_dump -O -x -U "$POSTGRES_USER" "$POSTGRES_DB"' | \
  docker exec -i escuela-perf-db psql -q -v ON_ERROR_STOP=1 -U postgres bench
docker exec escuela-perf-db psql -U postgres bench -c 'ANALYZE'
docker build --target production -t escuela-perf:optimized .
docker build --target development -t escuela-perf:tools .
```

Para la misma línea base usar la imagen local `escuela-perf:baseline` (construida antes de editar) o construir el checkout anterior con ese tag. Si no se conserva esa imagen ni el checkout, probar la rama de compatibilidad de la imagen nueva contra una copia **sin la tabla institution_read**; marcarla como línea base funcional, no idéntica al binario original. No borrar tablas de la base de origen.

```sh
DB_URL=postgresql://postgres:bench@escuela-perf-db/bench
in_app() {
 docker run -d --name "escuela-perf-$1" --network escuela-perf-net --cpus 1 --memory 1500m \
   -e DATABASE_URL="$DB_URL" -v "$PWD/scripts/benchmark-pool.cjs:/app/pool.cjs:ro" \
   -e NODE_OPTIONS=--require=/app/pool.cjs "escuela-perf:$2"
}
probe() {
 docker run --rm --network escuela-perf-net -e BENCH_URL="http://escuela-perf-$1:3000" \
   -v "$PWD/scripts/benchmark-probe.mjs:/bench.mjs:ro" node:24-bookworm-slim node /bench.mjs
}
tool() {
 docker run --rm --network escuela-perf-net -e DATABASE_URL="$DB_URL" escuela-perf:tools "$@"
}
in_app before baseline
probe before
sh scripts/benchmark-load.sh baseline-repeat escuela-perf-before
tool node scripts/data.mjs migrate
docker exec escuela-perf-db psql -U postgres bench -c 'ANALYZE'
in_app after optimized
probe after
sh scripts/benchmark-load.sh optimized-repeat escuela-perf-after
docker exec -i escuela-perf-db psql -U postgres bench <scripts/benchmark-plans.sql
tool node scripts/benchmark-parity.mjs
tool node scripts/benchmark-all-cards.mjs
tool node scripts/benchmark-cache.mjs
sh scripts/benchmark-cache-trace.sh
docker logs escuela-perf-after 2>&1 | grep poolCheckouts
```

Para medir frío de proceso repetir `docker restart escuela-perf-before` / `docker restart escuela-perf-after` antes de cada sonda y esperar la disponibilidad del proceso sin solicitar la portada. No equivale a vaciar las páginas de PostgreSQL ni el caché de disco del host. Para recolectar CPU y memoria, muestrear durante cada tramo con `docker stats --no-stream escuela-perf-db escuela-perf-after` (o before). El tiempo de adquisición incluido en la instrumentación del pool abarca también la apertura de conexiones nuevas. Los JSONL del generador son aditivos: usar etiquetas nuevas para cada repetición.

## Publicación y reversión

En un despliegue futuro, correr manualmente la migración antes de cambiar la imagen que sirve tráfico. El rol de migración debe poder instalar pg_trgm. La preparación escribe las fichas en la misma transacción que el cambio del padrón publicado. Para revertir el padrón, publicar manualmente el ID anterior; para revertir un lote, usar el procedimiento manual existente del proyecto. La siguiente lectura consulta las versiones activas en PostgreSQL. No hace falta purgar ni precalentar un servicio externo.

Para revertir el código, volver primero a la imagen anterior. Las tablas fuente siguen intactas; se puede dejar la proyección sin utilizar. Si se decide retirar la tabla y la función mediante una migración posterior, revertir también los scripts de preparación/importación. No borrar pg_trgm: otras tablas podrían usar la extensión. Para liberar CPU del laboratorio usar `docker stop escuela-perf-before escuela-perf-after escuela-perf-db`. No se necesita detener el Compose de desarrollo.

Para la contraprueba con variedad de nombres, reiniciar cada app por separado, sin builds ni otra carga en paralelo. Mantener la misma copia local y límites. El perfil conserva las búsquedas frecuentes y sin resultados; la operación search rota por doce nombres (incluye acentos y abreviaturas). Ejemplo dentro del bucle por servidor:

```sh
# target=escuela-perf-before o escuela-perf-final
for stage in warm measured; do
  if [ "$stage" = warm ]; then clients=1; seconds=20; else clients=25; seconds=300; fi
  docker run --rm --network escuela-perf-net -e BENCH_ROTATE=1 -e BENCH_URL="http://$target:3000" \
    -v "$PWD/scripts/benchmark.mjs:/bench.mjs:ro" node:24-bookworm-slim \
    node /bench.mjs "$clients" "$seconds" > "docs/performance/repeat-$target-$stage.jsonl"
done
```

La colección se prepara en una transacción que comparte el bloqueo de la carga de coordenadas. La primera publicación necesita espacio para la tabla e índices; revertir hacia un corte ya preparado no los reconstruye. Para la importación manual de coordenadas desde una imagen sin insumos, montar el lote aprobado de docs/research como solo lectura (Compose de desarrollo ya monta el proyecto). La build web no incorpora el archivo de investigación.
