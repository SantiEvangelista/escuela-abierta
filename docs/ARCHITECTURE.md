# Arquitectura

## Decisiones aceptadas

- Next.js App Router y React para interfaz; Route Handlers para REST /api/v1.
- TypeScript estricto. Módulos de dominio y acceso a datos fuera de componentes y handlers.
- PostgreSQL; driver pg y conexiones limitadas. ORM/migrador se decide al implementar B1.
- Docker Node 24 y PostgreSQL 17. npm ci y package-lock.json para dependencias reproducibles.
- Producción portable con output standalone; Vercel se configura como Next.js.
- Sin dependencias globales del host, cron, Redis ni servicios de terceros pagos.
- .env y datos originales/backups excluidos de Git y del contexto de build.

## Flujo previsto

Archivo oficial → validación manualmente iniciada → staging → revisión → publicación explícita → PostgreSQL → API / interfaz.

La interfaz y la API compartirán servicios de consulta, evitando llamadas HTTP internas innecesarias. Ningún componente de cliente recibe DATABASE_URL. La API pública será de solo lectura.

## Infraestructura gratuita

Vercel Hobby + Neon Free son la propuesta, no recursos provisionados. Medir almacenamiento, transferencia y uso antes del lanzamiento. Cachear consultas y agregaciones; limitar páginas. Conservar archivos originales y backups manuales fuera de la base gratuita. PostgreSQL no se ejecuta en un volumen persistente de Vercel.

Fuentes consultadas: https://vercel.com/docs/plans/hobby y https://neon.com/blog/neon-free-plan-1-gb-per-project . Las cuotas pueden cambiar; validar al desplegar.
