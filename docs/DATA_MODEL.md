# Modelo y carga manual

Cada versión del archivo es inmutable y conserva hash SHA256, fecha, fuente y filas originales. Los territorios están versionados para no sobrescribir nombres históricos. CUEANEXO identifica localizaciones; cue y annex son segmentos derivados, sin inferir aperturas/cierres ni entidades independientes a partir del conteo.

Catálogos: sectors, areas y offers. Las ofertas combinan modalidad y nivel; los indicadores INET se conservan por separado, no se suman como escuelas adicionales. Solo marcadores explícitos 1 generan relaciones; vacío permanece en raw y no afirma ausencia. Los indicadores de modalidad, validez de títulos y hogares se conservan en raw, sin interpretar ni exponer como estadísticas.

Tablas: datasets, publication, provinces, departments, localities, schools, school_offers y catálogos. publication selecciona un único corte; todas las consultas REST deben filtrar por ese corte y nunca exponer raw por defecto. Índices por CUE, localidad y oferta; claves foráneas y restricciones protegen integridad.

Comandos dentro de Docker:

```sh
docker compose exec app npm run db:migrate
docker compose exec app npm run data:validate -- padron/2026.09.07_padron_oficial_establecimientos_educativos_die.xlsx
docker compose exec app npm run data:import -- padron/2026.09.07_padron_oficial_establecimientos_educativos_die.xlsx
# Publicación explícita, usando el ID informado:
docker compose exec app npm run data:publish -- 1
```

La importación valida primero, usa transacción y es idempotente por hash. No publica automáticamente. Rollback de publicación: ejecutar data:publish con el ID del corte anterior. No hay tareas programadas.

Coordenadas pendientes: futura tabla de enriquecimiento separada del padrón, con fuente, fecha, método de coincidencia y estado de revisión. Google Maps requiere evaluación de condiciones de acceso/reutilización y coincidencias; todavía no se implementa scraping ni se inventan coordenadas.

Siguiente entrega REST: escuelas paginadas, ficha por CUEANEXO, catálogos, datasets y fuentes. Validar filtros, límite de página y orden estable; CUE/anexo siempre cadenas. Endpoints de dominio implementados; consultar docs/API.md.
