# Primera preview de Escuela Abierta en Vercel

El directorio listo para subir es `dist/vercel-preview/`. Es una copia del código de este momento, no un vínculo al proyecto: incluye src, public, lockfile y configuración de Next.js/TypeScript. No incluye credenciales, investigación, Excel, datos aprobados, backups, herramientas de mantenimiento ni dependencias instaladas. El proyecto original y el Compose local siguen siendo el lugar desde donde se publica el padrón manualmente. Para generar una copia posterior, desde la raíz: `sh scripts/package-preview.sh dist/preview-02`. El script rechaza un destino existente. Si se utiliza Git como alternativa, la raíz del proyecto también tiene reglas de exclusión; no subir el proyecto arrastrando toda la carpeta a un repositorio web.

## 1. Preparar una base PostgreSQL de preview

Crear una base PostgreSQL **vacía y exclusiva de preview**, con soporte para pg_trgm. Se puede conectar un proveedor desde el [Marketplace de Vercel](https://vercel.com/docs/postgres). Comprobar su cuota de almacenamiento antes de cargar: el origen local consultado ocupa 158 MB y la proyección medida en el laboratorio ocupa otros 143 MB; dejar espacio adicional para importaciones e índices. No usar la URL de Docker o localhost. Guardar dos conexiones del proveedor: directa para administración y pooled con TLS para la aplicación. Idealmente ubicar la función y la base en la misma región.

Desde la raíz del proyecto, en zsh, con el Compose local activo, generar una copia sin registros personales de asistencia. Cargar sólo en una base vacía: estos comandos son para la primera carga, no para sobrescribir una preview existente.

```sh
cd ~/Documents/code/escuela_api
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc --no-owner --no-acl --exclude-table-data=public.attendance_marks --exclude-table-data=public.attendance_limits' > backups/vercel-preview.dump
```

Continuar sólo si pg_dump terminó correctamente. Pegar la URL **directa de preview** en el prompt oculto. La conexión nunca va al código ni al paquete. Si pg_restore informa un error, detenerse antes de migrar.

```sh
read -rs 'DATABASE_URL?URL PostgreSQL directa de preview: '; echo
export DATABASE_URL
docker run --rm -i -e DATABASE_URL postgres:17-bookworm sh -c 'pg_restore --single-transaction --exit-on-error --no-owner --no-acl --dbname="$DATABASE_URL"' < backups/vercel-preview.dump
docker compose run --rm --no-deps -e DATABASE_URL app node scripts/data.mjs migrate
unset DATABASE_URL
```

La restauración conserva el padrón publicado y los lotes activos del origen. La migración prepara las fichas si todavía faltan. No se ejecuta en cada build ni hace falta volver a importar el Excel. El dump se queda en backups/, fuera de Git y del deploy.

## 2. Vincular la carpeta sin instalar Node en la Mac

Desde el paquete limpio, ejecutar la CLI en Docker. El volumen conserva la sesión de la CLI entre comandos; el vínculo al proyecto se guarda en .vercel/ de esta carpeta.

```sh
cd ~/Documents/code/escuela_api/dist/vercel-preview
vc() { docker run --rm -it -v "$PWD:/work" -w /work -v escuela-vercel-cli:/root node:24-bookworm-slim npx --yes vercel "$@"; }
vc login
vc link
```

Elegir tu cuenta y crear o vincular **escuela-abierta**. Si pregunta por el directorio del código, usar `./`. Configuración: framework **Next.js**, Node **24.x**, install **npm ci**, build **npm run build**, Output Directory en el valor automático de Next.js. No indicar .next/standalone ni activar Static Export.

## 3. Configurar el entorno Preview y desplegar

En el proyecto de Vercel → Settings → Environment Variables, seleccionar **Preview**:

| Variable | Valor |
|---|---|
| DATABASE_URL | URL pooled PostgreSQL con TLS de la base de preview ya preparada. Si la integración ya creó esta variable, verificar su alcance Preview. |
| ATTENDANCE_SECRET | Secreto exclusivo de preview; se puede generar en la Mac con `openssl rand -hex 32`. Mantener estable mientras dure la preview. |
| SITE_URL | Dejar sin definir para esta preview. El proyecto desactiva la indexación de previews. |

Después, en la terminal donde definiste vc:

```sh
vc deploy
```

Abrir la URL que devuelve la CLI; no usar --prod. Verificar /api/v1/health (database: available), /api/v1/institutions?province=90&page_size=5 (cinco fichas y total), la portada, /docs y el mapa de calles de Tucumán. Un health correcto únicamente prueba la conexión; si no aparecen fichas, revisar la publicación y la migración en la base de preview. Si se cambian variables después del deploy, crear una preview nueva. Más información: [CLI deploy](https://vercel.com/docs/cli/deploy) y [.vercelignore](https://vercel.com/docs/deployments/vercel-ignore).
