# Prueba de concepto de Tucumán

Consulta manual: 03/11/2026. Corte oficial: 07/09/2026.

## Auditoría del padrón publicado

Filtro: provincia 90, gestión private, sin búsqueda por nombre. Se consultaron todos los registros, no solo los resultados de «lorenzo».

- 395 localizaciones; 385 CUE distintos (establecimientos).
- 0 domicilios vacíos, 9 teléfonos vacíos y 49 correos vacíos.
- Inventario completo: `tucuman-privadas.csv`, ordenado por nombre e identificador.
- Son controles de completitud; un domicilio presente no garantiza exactitud o actividad actual.
- El CUE/anexo permanece en base y REST para trazabilidad; se quitó de tarjetas y ficha.
- Gestión estatal/privada/social proviene del padrón. «Escuela», «colegio» e «instituto» no determinan gestión.

## Ubicaciones experimentales

Ruta `/pruebas/tucuman`: 10 escuelas y 10 colegios de San Miguel de Tucumán, seleccionados manualmente en Google Maps. No es una muestra representativa de toda la provincia ni una muestra exclusivamente privada.

`src/app/pruebas/tucuman/locations.json` guarda coordenadas de lugar (no centro del viewport), referencia de origen, fecha y estado `pending_official_match`. Es un conjunto separado del padrón; no se sobrescribieron datos oficiales ni se agregaron coordenadas a la API de escuelas sin validar identidad.

La vista incluye distribución esquemática, filtro, selección por punto/lista y mapa Google embebido centrado en la coordenada. Belgrano 259 y Secundaria de la Ciudadela comparten coordenadas; la lista permite elegir ambas. Hnas. Esclavas se descartó por probable duplicación de Sagrado Corazón HHEE. Se conserva Santa Catalina como nombre de Maps dentro de la selección de colegios.

Pendiente: conciliación de cada lugar con nombre, domicilio y localización oficial; registrar discrepancias antes de marcar un vínculo confirmado. No se realizó scraping masivo ni importación automática.

## Ficha e interés

Primera prioridad propuesta: ofertas educativas comprensibles, gestión, domicilio, mapa, fuente/fecha y enlace compartible permanente. Siguiente mejora: compartir y guardar localmente favoritos.

«Asistí a esta escuela» puede generar conexión emocional, pero queda como hipótesis para otra versión: requeriría decidir persistencia, privacidad y prevención de duplicados. No se implementaron votos, cuentas, contadores ni testimonios en este MVP.

## Verificación funcional

- TypeScript y pruebas de integración REST ejecutados en Docker: correctos.
- Navegador: filtro privado muestra 395; estatal muestra 1656; ficha sin CUE/anexo; zoom provincial activo; fecha de corte visible.
- Muestra: 20 lugares; filtro Colegios deja 10; elegir Colegio Suizo actualiza nombre, coordenadas, enlace fuente y mapa Google embebido.
- Sin revisión visual de colores, conforme a lo solicitado.

## Orientaciones e identidad institucional

Se revisaron los encabezados originales del XLSX (filas 12/13) y los registros raw. No hay columna de orientación ni detalle de especialidad/título. Sí existe «Secundario - INET», marcada en Lorenzo Massa (900058300); no equivale a disponer del título técnico específico. La columna «Validez_títulos» no aporta orientaciones en los casos consultados.

9 de Julio, San Juan 671, San Miguel de Tucumán, tiene tres CUE diferentes: 9000368 (secundario), 9000370 (inicial/primario) y 9001828 (superior no universitario). Coincidencia de nombre y domicilio sugiere vínculo institucional, pero no demuestra identidad administrativa común. No fusionar automáticamente. Una futura agrupación visual debería conservar las unidades originales y exigir vínculo verificado. Las orientaciones aportadas por el usuario quedan pendientes de fuente externa; no se incorporan como datos del padrón.

UI: cinco tarjetas por página, detalle en reverso con giro, botón de regreso y Escape. Foco transferido al reverso y restaurado sin desplazamiento forzado; cara oculta inerte; respeta movimiento reducido. TypeScript y recorrido de navegador correctos (cinco resultados en páginas 1 y 2; giro y Escape).

## Regla de agrupación autorizada

El usuario acordó presentar una institución por localidad, domicilio y nombre normalizados. Se implementó `/api/v1/institutions` sin modificar los registros originales. La decisión reemplaza la cautela anterior de mantener tarjetas separadas hasta confirmar vínculos. 9 de Julio reúne tres registros y cuatro ofertas (jardín, primario, secundario y superior); privadas de Tucumán: 338 tarjetas desde 395 localizaciones. Validaciones: coincidencias normalizadas se unen; domicilios faltantes/diferentes, localidades diferentes y nombres distintos no se unen; cinco instituciones por página; integración REST y TypeScript correctos.

## Mapa interactivo — 04/11/2026

Reemplaza el esquema SVG y el iframe de Google por Leaflet 1.9.4 y calles de OpenStreetMap. No requiere API key ni carga recursos de Google. Las coordenadas conservan su procedencia y estado experimental en locations.json; este cambio no valida identidades ni modifica el padrón.

Selección sincronizada mapa/lista, zoom al elegir, filtros de 10/20 lugares y botón para encuadrar todos los puntos visibles. Coordenadas idénticas comparten marcador y ofrecen selección individual en el popup; no se alteran sus posiciones. La lista permanece operativa si falla la carga de calles.

Tiles: https://tile.openstreetmap.org/{z}/{x}/{y}.png, atribución visible y caché del navegador. No se descargan mapas offline ni se precargan áreas. Servicio público sin garantía de disponibilidad; revisar proveedor y política antes de escalar: https://operations.osmfoundation.org/policies/tiles/ . Leaflet se carga únicamente en esta ruta, del lado del cliente.

Verificación: TypeScript en Docker correcto; navegador con 12 teselas cargadas, 19 marcadores para 20 lugares, filtro de colegios con 10 marcadores, selección de Colegio Suizo desde lista y selección de Ciudadela desde popup compartido. Sin iframes ni errores de consola. No se revisaron colores.

## Alternancia de mapas

Explorador: con Tucumán seleccionada, botón Ver mapa de calles / Ver mapa provincial. La capa de calles se carga al solicitarla; usa ubicaciones privadas persistidas y filtra por búsqueda/gestión, independiente de la página de resultados. La ficha del marcador muestra institución y procedencia. Volver a otra provincia restaura la vista provincial.

Pruebas: conserva inicio en calles y permite volver al contorno provincial de Tucumán. Crossfade de 320 ms en ambos sentidos; capas ocultas inertes y fuera del árbol accesible, tamaño estable, Leaflet permanece montado al alternar para conservar su posición. Respeta prefers-reduced-motion.
