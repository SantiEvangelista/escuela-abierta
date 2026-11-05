# Auditoría UI/UX y SEO en curso

Referencias: ux-notes/g1–g6 (Krug: claridad y navegación; Enders: labels persistentes; Podmajersky: texto de acciones; Design Systems Handbook: semántica, targets, estados). Las notas contienen ejemplos de un backoffice de bodas: se aplican sus principios pertinentes al directorio, no sus funcionalidades.

Cambios comprobados:
- Eliminados icono de casa y flechas decorativas; indicador repetitivo de ubicación sin cargar retirado del frente.
- H1 de página, H2 de resultados, relación aria-controls en tarjetas; ayuda cartográfica desplegable y acciones táctiles ampliadas.
- SSR de instituciones agrupadas, fecha y ofertas usando el mismo contrato REST. Sin consulta duplicada al hidratar.
- Filtros con historial; Atrás restaura gestión y resultados, verificado en navegador para 9 de Julio.
- Paginación oculta en vacío, corrección de página fuera de rango tras respuesta cliente.
- Metadatos OG/Twitter; noindex local y de búsquedas; pruebas excluidas de indexación; robots y sitemap sin dominio inventado. SITE_URL habilita el dominio definitivo.
- TypeScript correcto; HTML crudo verificado con una tarjeta 9 de Julio y sus cuatro ofertas, noindex y robots local.

Pendientes antes de cerrar el objetivo:
- Auditoría completa de errores, vacío, paginado, teclado y móvil tras cambios.
- Medir y mejorar coste nacional de agrupación (actualmente consulta todos los registros del alcance).
- Verificar canonicals/robots/sitemap con configuración de dominio de prueba, sin publicar.
- Revisar semántica de tarjeta (contenido dentro del botón), cierre del mapa al cambiar breakpoint y foco en paginado.
- Build de producción aislado del servidor dev y pruebas de regresión finales.
- Revisar g3/g4 completos: la primera lectura conjunta quedó parcialmente truncada.

Actualización de rendimiento y accesibilidad:
- g3/g4 leídos completos.
- Consulta nacional antes: 2079/1500/1612 ms en desarrollo. Tras caché activa: 122/18/23 ms, mismo total 63822. Esto mide solicitudes repetidas; la primera consulta sin caché sigue requiriendo agrupar el alcance. Caché de 60 s, hasta cuatro alcances, clave por dataset y territorio, promesas compartidas y fallos descartados.
- Filtro de ámbito usa colección area_codes del grupo, evitando búsqueda cuadrática sobre localizaciones.
- Encabezado de tarjeta fuera del botón, acción extendida a toda la tarjeta. Foco del paginado dirigido al encabezado de resultados. Cierre del mapa al cruzar a escritorio.
- TypeScript y test:api pasan. Build Next compiló y generó rutas correctamente; imagen producción en proceso de exportación.
- La sesión del navegador de la iteración anterior terminó y su tab ya no existe; hay que crear uno nuevo para completar pruebas de ficha y vacío (no atribuir éxito al intento fallido).

## Cierre de auditoría

Los pendientes enumerados arriba describen el estado intermedio. Completados: lectura g3/g4, caché acotada y filtro de ámbito, semántica de tarjeta, foco de paginado, cambio de breakpoint, build de producción final e imagen exportada.

Evidencia funcional en navegador: 9 de Julio abre cuatro ofertas; Escape restaura foco al título; búsqueda inexistente muestra vacío sin paginado; limpiar recupera resultados; página 2 contiene cinco tarjetas. Móvil 390px: abre diálogo, Enter en Tucumán actualiza viewBox; a 1200px desaparece el diálogo y se retira inert. Error por filtro inválido conserva filtros, reintenta y permite recuperar listado al limpiar. Mensaje adaptado a lenguaje del usuario.

SEO probado en contenedor efímero de producción con SITE_URL=https://escuela.example (dominio reservado, sin despliegue): HTML con tarjetas, canonical correcto, OG, index/follow para inicio, noindex/follow para búsqueda, noindex/nofollow en POC, robots con sitemap correcto y sitemap XML con inicio. Local sin SITE_URL: noindex y Disallow /. Previews Vercel se excluyen mediante VERCEL_ENV. Robots/sitemap dinámicos para respetar configuración runtime.

Límites: sin dominio definitivo ni publicación; configurar SITE_URL en hosting al publicar. No se garantiza posicionamiento ni se midió tráfico real. Caché mejora solicitudes repetidas; el cálculo inicial aún recorre registros del alcance. No se realizó QA exhaustivo de colores ni prueba con personas reales, conforme al alcance de implementación y preferencia previa del usuario. La validación móvil fue en navegador con viewport reducido.

## Pulido adicional solicitado — 04/11/2026

- Frente: ofertas ordenadas por nivel y nombres únicos; reverso conserva cada código/modalidad.
- Al consultar, las tarjetas previas se conservan con estado ocupado y sin interacción para evitar abrir resultados desactualizados. El primer acceso sin datos conserva skeleton.
- Búsqueda automática usa replaceState; cambios explícitos de gestión y paginado mantienen pushState. Verificado: buscar Lorenzo, cambiar a Todas, escribir Pablo Apóstol y Atrás recupera Lorenzo + Privada sin pasos por cada pausa al escribir.
- «Asistí acá»: marca por identificador representativo del grupo, persistida solo en navegador, reversible, aria-pressed y error de almacenamiento. Probada persistencia tras recarga y deshacer, retirando la marca de prueba. No registra identidad ni acredita asistencia ni genera contador público.
- Recorrido a 390×520: reverso sin overflow horizontal, búsqueda y mapa abrible/cerrable. Altura reducida aproxima el área con teclado; teclado real requiere validación en teléfono. Fuentes y nombres largos pueden envolver texto.

04/11/2026: navegación de filtros y paginado mediante estado React y solicitudes API; no se actualiza la URL por cada interacción. Al entrar se quitan page/page_size de enlaces antiguos, conservando su estado inicial. Se aceptan enlaces previos con filtros. Recargar restablece los filtros presentes en el enlace inicial; no hay historial por cada filtro.

## Resultados compactos — 04/11/2026

Filas consistentes, menor padding y separación; nombre sin truncar, localidad/gestión en línea, niveles resumidos. Se elimina la fila redundante Ver ficha; toda la tarjeta conserva su botón accesible. Provincia omitida en cada fila cuando ya está filtrada. Reverso fuera del layout mientras está cerrado, y viceversa, para evitar altura aportada por contenido oculto. No se fuerza que cinco resultados entren en cualquier pantalla: texto ampliado y nombres largos pueden requerir scroll.
Referencias: https://www.nngroup.com/articles/cards-component/ (listas más fáciles de escanear); https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum/ (áreas de activación).
