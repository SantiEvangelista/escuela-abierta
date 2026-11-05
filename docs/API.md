# API REST v1

Base local: http://localhost:3100/api/v1. Solo lectura; JSON con `data` y `meta.dataset`. Errores `{error:{code,message}}`. 400 para parámetros inválidos, 404 para recursos inexistentes, 503 si no hay corte publicado o la base falla. Nunca expone raw ni cortes no publicados. CORS de lectura público.

- GET /schools: page (1..10000), page_size (1..100, default 25), q (2..100 caracteres; búsqueda parcial sin distinguir mayúsculas, sensible a acentos), cue (7 dígitos), province (2), department (5), locality (8), sector, area, offer, sort (cueanexo, name, -name).
- GET /schools/{cueanexo}: identificador de 9 dígitos con ceros iniciales.
- GET /provinces: catálogo territorial completo.
- GET /departments: province opcional, page y page_size.
- GET /localities: province/department opcionales, page y page_size.
- GET /sectors, /areas, /offers: catálogos de códigos válidos.
- GET /datasets y /sources: solamente el corte publicado y su fuente.
- GET /openapi: contrato OpenAPI 3.1.

Los filtros se combinan con AND. Códigos territoriales válidos sin coincidencias devuelven lista vacía; códigos de gestión/ámbito/oferta desconocidos devuelven 400. Parámetros repetidos o desconocidos se rechazan. Orden estable con desempate por CUEANEXO. Las ofertas no multiplican filas ni totales. Los nulos se conservan.

Ejemplo: `/api/v1/schools?province=90&offer=common_primary&page_size=20`.

Publicación local explícita: `docker compose exec app npm run data:publish -- 1`. El comando también permite volver a un corte anterior. Caché de CDN hasta 60 segundos; un cambio de publicación puede tardar ese intervalo en verse. La paginación entre solicitudes no es una sesión fija: consultar meta.dataset.id si cambia el corte.

Protección actual: límites de página, validación, consultas parametrizadas y timeout de base. Rate limiting distribuido pendiente antes de exposición pública. No se presenta como una API lista para tráfico ilimitado. No se desplegó en Vercel.

## GET /api/v1/institutions

Vista agrupada para el explorador. Acepta los filtros y paginado del listado de schools. Agrupa antes de filtrar por nombre/oferta/gestión y antes de paginar; devuelve la cartera completa aunque el filtro coincida con una sola oferta. No admite detalle por identificador en esta versión.

Regla `locality_address_name_v1`: localidad exacta + domicilio normalizado + nombre normalizado. Ignora tildes, puntuación y espacios repetidos; expande INST./COL./ESC. y AV./AVDA.; omite sufijo CENTRO/BARRIO CENTRO en domicilio. Sin nombre o domicilio utilizable no agrupa. No usa similitud difusa. `members` conserva todos los CUEANEXO; `offers` es la unión sin duplicados; `sector_codes` lista gestiones (sector_code=mixed cuando difieren). Otros campos simples proceden del primer registro por CUEANEXO y no representan una validación adicional. Consultar schools/{cueanexo} para información original de cada miembro.

Es una agrupación de presentación, no una afirmación de identidad jurídica. schools mantiene el padrón sin fusionar. La implementación inicial agrupa en memoria el conjunto territorial consultado; antes de escalar el despliegue se debe materializar/indexar las claves de agrupación.

## Documentación interactiva

/docs usa Scalar (integración oficial Next.js) y permite ejecutar solicitudes reales contra el dominio actual, también en ngrok. Contrato versionado: src/lib/openapi.json, servido en /api/v1/openapi sin caché persistente. Incluye instituciones agrupadas, catálogos, estado y participación. Renderizador CDN fijado en 1.76.4; no se configura proxy externo para solicitudes API. OpenAPI es portable a NestJS; esta aplicación usa Next.js.

Para probar asistencia, ejecutar GET primero para iniciar cookie HttpOnly; luego PUT con attended=true y finalmente false para deshacer. Las pruebas modifican la base real. Para vistas de documentación no se exponen secretos. La interfaz requiere acceso a jsDelivr; el contrato JSON permanece local.

### Ubicaciones complementarias de instituciones

GET /institutions incorpora `location` sin modificar el padrón. El campo es `null` para las instituciones que no tienen una ubicación aprobada. Para el corte local actual, `meta.location_coverage` informa 267 ubicadas de 338 instituciones privadas de Tucumán.

Cuando existe, `location` incluye latitud/longitud, precisión derivada, atributo PRE original, CUE fuente y procedencia. `source.cartographic_cut_date` indica el corte cartográfico disponible; `metadata_reference_date` refiere a la metadata de la fuente; `checked_at` es cuándo se consultó localmente. Son fechas distintas. La etiqueta visible es “Ubicación según Mapa Educativo”. PRE=PRECISA describe el atributo de la fuente, no una inspección física de entrada ni actividad actual. La atribución y licencia CC BY 4.0 viajan con cada ubicación.

Los datos se almacenan en tablas complementarias ligadas al corte publicado y al lote importado. El importador acepta solo el archivo manual aprobado y su SHA-256, es idempotente por hash y concilia todos los CUE/anexos contra el agrupamiento del padrón local. `node scripts/locations.mjs rollback ID` revierte un lote activo sin borrar el padrón. No se automatiza importación ni publicación.
