# Participación anónima y datos complementarios

Autorizado 04/11/2026. «Asistí acá» es un contador público de declaraciones, no un puntaje de calidad ni una identidad verificada. No se migran marcas locales a votos públicos.

## Persistencia y concurrencia

GET /api/v1/attendance/{cueanexo} devuelve count/attended e inicia cookie HTTP-only firmada, SameSite=Lax, Secure en HTTPS, duración un año. PUT requiere origen coincidente, cookie válida y JSON {"attended":true|false}. PUT es idempotente: repetir true no suma votos. DELETE lógico mediante false permite deshacer.

Clave de institución: hash de localidad, domicilio y nombre normalizados según la misma regla del explorador. Miembros agrupados comparten contador. Cambios de nombre/domicilio entre padrones requieren conciliación manual de claves; no se reasignan participaciones silenciosamente.

PostgreSQL garantiza unicidad institución/visitante. Límites compartidos entre instancias: 20 escrituras/minuto por visitante y 300 globales. Se serializan mediante actualización transaccional de buckets; devuelve 429 con Retry-After. No se guardan IP ni nombres. Los buckets vencidos se limpian al escribir. Borrar cookie/cambiar navegador permite participar nuevamente: protección básica, no prueba de asistencia ni defensa completa contra bots. El límite global protege las escrituras pero puede temporalmente bloquear usuarios legítimos bajo abuso.

Lectura de contadores solo al abrir la ficha, no por cada card ni sondeo periódico. Respuestas privadas no-store porque incluyen estado personal; índice por institución. No hay caché pública de contadores en esta versión. Pool limitado a tres conexiones por proceso; no implica capacidad ilimitada en planes gratuitos.

ATTENDANCE_SECRET debe configurarse en cada entorno y mantenerse estable entre instancias. Local: .env.local ignorado por Git, secreto generado aleatoriamente. Rotarlo invalida cookies previas. db:migrate incluye 002-attendance.sql; no importa ni publica padrones.

## Investigación manual

Datos complementarios en src/app/institution-details.json, separados del padrón y con fecha de consulta. Pablo Apóstol de Av. Aconquija 2577 (no San Pablo Apóstol de Ingenio San Pablo): horarios de documento 2025, no certificados vigentes en 2026; autoridades de página sin fecha. 9 de Julio: autoridades y atención exclusivamente del nivel superior; no confundir atención con cursado.

Lorenzo Massa: https://lorenzomassa.salesianostucuman.org.ar/nosotros/ contiene referencias a Tulio García Fernández. Se descarta como evidencia de autoridades y horarios. No se inventan valores faltantes.

Noticias: enlace a búsqueda externa por nombre/localidad/provincia. No se ingieren artículos automáticamente ni se afirma que el primer resultado sea la última noticia. Pendiente selección manual de artículos pertinentes; no se presenta un artículo sin revisión.
