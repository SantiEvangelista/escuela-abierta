# Plan del MVP inicial

Fecha: 2026-11-03. Estado: entorno inicial; producto pendiente de implementación.

## Objetivo

Directorio nacional verificable para periodistas, desarrolladores y personas curiosas. Inspiración: https://municipiosargentinos.net/intendentes/ (ruta bloqueada durante la investigación; falta revisión visual directa). Cada ficha corresponde a una localización CUE + anexo. No confundir localizaciones con establecimientos independientes.

## Etapa 0 — Base de trabajo

- [x] Next.js + TypeScript, Docker Compose y PostgreSQL.
- [x] Dependencias y cachés aisladas del host.
- [x] Endpoint de salud conectado a PostgreSQL.
- [x] Documentación de arranque y plan.
- [ ] Seleccionar licencia del código y confirmar licencia del corte de datos vigente.

## Parte 1 — Backend y API REST

### B1. Contrato y modelo (1–2 jornadas estimadas)
- Validar CUE/anexo y códigos territoriales con documentación oficial.
- Definir establecimiento, localización, oferta, jurisdicción, localidad, fuente, dataset y lote de importación.
- Conservar identificadores como texto; tratar faltantes explícitamente.
- Definir migraciones y esquema OpenAPI antes de ampliar endpoints.
- Aceptación: modelo revisado con sedes, anexos y múltiples modalidades reales.

### B2. Importación manual (2–4 jornadas)
- Archivo descargado manualmente en data/raw; no cron ni descarga automática.
- Validar encabezados agrupados, tipos, CUEANEXO únicos y cobertura.
- Registrar URL, fecha del corte, fecha de carga, hash y conteos.
- Preparar carga en staging y emitir informe de errores/diferencias.
- Publicar solo mediante comando explícito y transacción; conservar corte anterior para rollback.
- No inferir cierres de una ausencia ni convertir blancos en cero.
- Aceptación: repetir un archivo no duplica datos; fallos no alteran el corte publicado; rollback comprobado.

### B3. API de lectura (2–3 jornadas)
- GET /api/v1/schools y /api/v1/schools/{cueanexo}.
- GET /api/v1/provinces, /api/v1/localities, /api/v1/sources y /api/v1/datasets.
- Filtros combinables, paginación, orden estable, validación y errores consistentes.
- Metadatos de procedencia y actualización; OpenAPI y ejemplos.
- Límites por página, cache y control de abuso compatible con presupuesto cero.
- Aceptación: consultas, filtros y errores probados con PostgreSQL real; respuestas sin secretos.

## Parte 2 — Interfaz visual

### F1. Explorador (2–3 jornadas)
- Buscador por nombre/CUE; filtros de provincia, localidad, modalidad, nivel, gestión y ámbito.
- URL compartible que conserva filtros; resultados paginados.
- Estados de carga, vacío y error; móvil y teclado.
- Aceptación: una búsqueda puede compartirse y recuperarse con los mismos filtros.

### F2. Fichas y transparencia (1–2 jornadas)
- Ficha permanente por CUEANEXO, vínculos entre localizaciones cuando se valide su relación.
- Datos oficiales, ofertas, fuente y fecha; campos faltantes visibles.
- Página de metodología y documentación de API.
- Enlaces externos a mapas para contraste manual, sin afirmar existencia/cierre basándose solo en Google Maps.
- Aceptación: ficha legible en móvil y escritorio, con procedencia accesible.

## Cierre — Publicación (1–2 jornadas)
- Importación real de prueba, tamaño de base e índices, consumo y conexiones.
- Verificar condiciones y cuotas Vercel Hobby/Neon Free.
- Build, chequeo TypeScript, integración API y recorrido de interfaz.
- Configurar entorno de producción y documentar backup/restauración manual.
- Publicar por separado cuando corresponda; este arranque no realiza despliegue.

Estimación orientativa: 9–16 jornadas después del entorno, sin contar aprendizaje ni bloqueos de fuentes. Ajustar tras B1/B2.

## Fuera de alcance

Votos, contribuciones, formularios de reportes, cuentas, panel administrativo, rankings, métricas de calidad educativa, mapas propios, scraping de Google Maps, series históricas públicas, importaciones programadas, microservicios y Redis. Exportaciones CSV filtradas quedan como mejora posterior, salvo necesidad validada de periodistas.

## Operación mensual

El mantenedor revisa manualmente si existe un nuevo archivo; descarga, valida, compara y decide publicar. Si no hay nuevo corte, no se cambia la fecha de vigencia. La automatización interna de validación no implica publicación automática.

## Ampliación autorizada — prueba de concepto 03/11/2026

El usuario autorizó explorar veinte ubicaciones mediante consulta manual a Google Maps. Se implementa como muestra separada en `/pruebas/tucuman`; ver `POC_TUCUMAN.md`. Esto no habilita scraping masivo, publicaciones automáticas ni participación comunitaria. El explorador provincial, importador y API de lectura ya están implementados y probados localmente.
