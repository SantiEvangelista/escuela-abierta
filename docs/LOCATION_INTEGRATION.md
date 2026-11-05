# Integración local de ubicaciones educativas de Tucumán

Fecha de integración: 2026-11-04. Alcance: entorno local únicamente; no se ejecutó publicación ni despliegue.

## Resultado

- El padrón local conserva sus **338 instituciones** y el corte del conjunto fuente es **2026-09-07**.
- Se anexaron **267 ubicaciones** en `institution_locations`; **71 instituciones** quedan sin ubicación incorporada y siguen en revisión.
- El lote local es `1` (estado `active`), asociado al dataset local `1`.
- El padrón publicado localmente no fue modificado. El API agrega una propiedad `location` (o `null`) y un resumen de cobertura; incluye atribución, procedencia y fechas.
- La interfaz muestra “Ubicación según Mapa Educativo”. Esta etiqueta no afirma verificación física ni actividad actual.
- Los puntos coincidentes se renderizan en su coordenada exacta mediante un único marcador con opciones para seleccionar cada institución; no se desplazan ni promedian.

## Artefacto aprobado y trazabilidad

- Archivo congelado: [`tucuman-institution-locations-2026-11-04.jsonl`](../data/approved/tucuman-institution-locations-2026-11-04.jsonl)
- SHA-256: `1d12a8a678e0d3cbdde58517c797be1e3c9f7ac47c8f340fdbf959c19531af13`
- Sumas y aprobación: [`tucuman-institution-locations-2026-11-04.jsonl.sha256`](../data/approved/tucuman-institution-locations-2026-11-04.jsonl.sha256), [`tucuman-institution-locations-2026-11-04.jsonl.approval.json`](../data/approved/tucuman-institution-locations-2026-11-04.jsonl.approval.json).
- El artefacto tiene 267 filas aprobadas. Conserva `checked_at=2026-11-04` separado de la fecha de corte cartográfico (`2025-01-06`) y la referencia de metadatos (`2025-01-15`). La fecha explícita de actualización de puntos no estaba disponible (`source_updated_at=null`). Se conserva `PRE=PRECISA` como precisión original y no se interpreta como comprobación física independiente.

## API y mapa

- Lista de instituciones: `GET /api/v1/institutions?province=90&sector=private`.
- El objeto `location` devuelve latitud/longitud, clase de precisión, precisión original, CUE/anexo fuente, URL/nombre/atribución/licencia y fechas. `checked_at` es fecha de consulta del expediente, no fecha de actualización de la fuente.
- Esquema actualizado en `src/lib/openapi.json`, servido por la referencia Scalar.
- Mapa local: [http://localhost:3100/pruebas/tucuman](http://localhost:3100/pruebas/tucuman).

## Importar y revertir

Desde el contenedor `app`, en el entorno local:

```sh
node scripts/locations.mjs import data/approved/tucuman-institution-locations-2026-11-04.jsonl 1d12a8a678e0d3cbdde58517c797be1e3c9f7ac47c8f340fdbf959c19531af13
node scripts/locations.mjs rollback 1
```

El importador compara el SHA, exige el padrón local esperado, concilia el conjunto de CUE/anexos y escribe filas y lote dentro de una transacción con exclusión mutua. La unicidad por dataset/institución impide duplicaciones. Repetir el mismo SHA activo devuelve el lote existente sin insertar; tras rollback, el mismo lote se reactiva. `rollback` elimina solo las filas asociadas al lote y deja historial del lote como `rolled_back`.

## Verificaciones realizadas

El script `scripts/test-locations.mjs` ejercitó la repetición idempotente, las 338 entradas API (267 con ubicación, 71 sin ubicación), atribución/precisión/fechas, reversión de 267 filas, ausencia de ubicaciones en API tras la reversión y reactivación del mismo lote. La prueba dejó el lote `1` activo y los 267 puntos restaurados. Un grupo compartido de ejemplo fue Galileo Galilei (CUE 900003200 y 900180700) en `(-26.82932877992, -65.201522833232)`.

La inspección visual local confirmó contador y lista de 338 instituciones, 267 ubicadas, y el marcador compartido. La automatización del navegador no pudo activar el control interno del popup (el árbol accesible del navegador no lo expuso como nodo accionable); la implementación tiene opciones individuales, pero esa selección concreta queda pendiente de comprobación interactiva manual.

En esta sesión de cierre, el socket Docker denegó conexión al revalidar `docker compose ps`. Por eso no se pudo volver a ejecutar `npm run typecheck` ni la prueba de base/API durante este cierre. Los resultados de prueba indicados arriba son los ya registrados tras la importación inicial; se puede repetir desde Docker con `npm run test:locations`.

## Importación manual posterior

El criterio de inclusión fue el subconjunto congelado y aprobado: identidad y ubicación revisadas, punto oficial vinculado por CUE exacto, PRE `PRECISA`, CUE fuente presente entre los miembros del grupo, y ausencia de conflicto pendiente. Los 71 restantes no se importaron y sus candidatos no se presentan como ubicaciones confirmadas. No se ha importado este subconjunto en el mapa público ni en producción.
