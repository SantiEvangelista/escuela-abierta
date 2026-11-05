#!/bin/sh
set -eu
label=${1:?indicar baseline u optimized}
target=${2:?nombre del contenedor}
mkdir -p docs/performance
for clients in 1 10 25 50; do
 duration=20
 if [ "$clients" = 25 ]; then duration=300; fi
 docker run --rm --network escuela-perf-net -e BENCH_URL="http://$target:3000" -v "$PWD/scripts/benchmark.mjs:/bench.mjs:ro" node:24-bookworm-slim node /bench.mjs "$clients" "$duration" >> "docs/performance/$label.jsonl"
done
