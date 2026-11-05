# Escuela API

Observatorio independiente de Educación Argentina. Base de desarrollo con Next.js, TypeScript y PostgreSQL. Nombre visual provisional: Escuela Abierta.

## Arranque

Único requisito de ejecución en el host: Docker Desktop encendido y Docker Compose. No instalar Node, npm ni PostgreSQL localmente.

```sh
cd /Users/santiagoevangelista/Documents/code/escuela_api
docker compose up --build -d
```

- Web: http://localhost:3100
- Salud de API y base: http://localhost:3100/api/v1/health
- PostgreSQL accesible solo dentro de la red Compose; no ocupa el puerto 5432 del host.
- Proyecto, red y volúmenes aislados bajo `escuela_api`. No se usan contenedores de otros proyectos.

Los valores por defecto sirven solo para desarrollo. Para cambiar puerto o credenciales, copiar `.env.example` a `.env` antes del primer arranque. Cambiar credenciales después de inicializar PostgreSQL requiere actualizar también el usuario de la base; editar `.env` no cambia una base existente.

## Comandos

```sh
docker compose logs -f app
docker compose exec app npm run typecheck
docker compose exec app npm run db:check
# Compilación aislada: no pisa .next del servidor de desarrollo
docker build --target production -t escuela-api:local .
docker compose exec db psql -U escuela -d escuela_api
docker compose stop
docker compose down
```

`down` conserva datos. `down -v` elimina los volúmenes y la base: usar solo para un reinicio deliberado.

Para agregar dependencias usar `docker compose exec app npm install --save-exact paquete`. Tras cambiar el lockfile desde Git, ejecutar `docker compose run --rm app npm ci` y reiniciar app. El bind mount sincroniza código y lockfile; node_modules, cachés y PostgreSQL permanecen en volúmenes Docker.

## Backup manual

```sh
docker compose exec -T db pg_dump -U escuela -d escuela_api -Fc > backups/escuela.dump
# Restaurar únicamente sobre una base vacía destinada a recuperación:
docker compose exec -T db pg_restore -U escuela -d escuela_api --no-owner < backups/escuela.dump
```

## Estado

Implementado: contenedores, página inicial informativa, conexión PostgreSQL y healthcheck real (503 si falla la base). El padrón está importado sin publicar; hay tablas de dominio y endpoints REST. El buscador visual sigue pendiente.

- [Plan del MVP](docs/MVP_PLAN.md)
- [Arquitectura y decisiones](docs/ARCHITECTURE.md)
- [Fuentes y validaciones pendientes](docs/DATA_SOURCES.md)

## Producción prevista

Vercel Hobby para web/API y Neon Free para PostgreSQL; configurar `DATABASE_URL` con la URL del proveedor, SSL y pool de conexiones. No copiar credenciales locales. El desarrollo usa Compose; Vercel despliega Next.js desde el repositorio. También se incluye una imagen standalone de producción portable.

Presupuesto objetivo USD 0, sujeto a cuotas y condiciones personales/no comerciales de Vercel Hobby. Usar inicialmente subdominio vercel.app. No se configuraron cuentas, despliegues ni cobros.

## Normalización implementada

Ver [modelo y comandos manuales](docs/DATA_MODEL.md). El esquema y el importador están disponibles. Las cargas no publican automáticamente; los endpoints de escuelas están documentados en docs/API.md.

## API REST implementada

Ver [contrato y ejemplos](docs/API.md). OpenAPI: http://localhost:3100/api/v1/openapi.

Escuelas, fichas, territorios, gestión, ámbito, ofertas, datasets y fuentes están implementados. Solo se expone el corte seleccionado en publication. Sin publicación, la API devuelve 503 DATASET_NOT_PUBLISHED. Para activar manualmente el corte 1: `docker compose exec app npm run data:publish -- 1`.

Pruebas: `docker compose exec app npm run test:api`. Solo para Compose local: cambia temporalmente la publicación y la restaura en finally. No ejecutar concurrentemente con otra publicación manual.

Pendiente antes del despliegue público: rate limiting distribuido y validación de cuotas/licencia. El buscador visual todavía no está implementado.

## Diseño

Paleta, roles y estados: [Sistema de diseño](docs/DESIGN_SYSTEM.md).

### SEO y despliegue
Configurar `SITE_URL` con el origen HTTPS definitivo para habilitar indexación del inicio y canonical/sitemap. Sin dominio, el entorno queda noindex. Las previews de Vercel, búsquedas y pruebas no se indexan. No se configuró ni publicó un dominio en esta tarea. Ver `docs/UX_SEO_AUDIT.md` para cambios, evidencia y límites.

La [auditoría de rendimiento](docs/performance/REPORT.md) incluye los límites medidos del servidor, las pruebas reproducibles con Docker y el procedimiento para revertir la preparación de lecturas.
