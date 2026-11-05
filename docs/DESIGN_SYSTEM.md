# Identidad visual — Escuela Abierta

Paleta acordada: 2026-11-03. Fuente única de los tokens: `src/app/globals.css`, bloque `:root`.

| Token | Color | Uso |
| --- | --- | --- |
| --primary | #6096B4 | Acción principal y provincias sin seleccionar |
| --secondary | #93BFCF | Hover, panel de detalle y avisos |
| --surface | #BDCDD6 | Panel del mapa, filtros y tarjetas |
| --canvas | #EEE9DA | Fondo general, campos y provincia seleccionada |

## Neutros de accesibilidad

Los cuatro colores de marca son claros o medios. Se complementan con `--ink: #183544` para títulos, enlaces, texto de botones y contorno de foco; `--muted: #304E5E` para metadatos; `--border: #486B7E` para bordes de controles. No usar blanco sobre el azul principal para texto pequeño. El azul principal se usa como superficie, no como texto pequeño sobre crema.

## Estados e interacción

- Selección provincial: crema y borde oscuro más grueso, además de aria-pressed y selector textual sincronizado.
- Hover: azul claro; foco de teclado: contorno oscuro visible.
- Colores uniformes en el mapa: no representan ranking, calidad ni cantidad de escuelas.
- Errores: mensaje explícito en panel, sin depender solo del color.
- Deshabilitado: opacidad y atributo disabled; nunca usar solo color para impedir interacción.

## Tipografía y composición

Arial/sans-serif para interfaz y Georgia para acento editorial. Mapa y resultados en dos columnas, una columna por debajo de 800 px. Mantener superficies tranquilas, bordes suaves y espacio entre controles. No introducir nuevos colores de marca ni valores hex fuera del bloque de tokens sin actualizar este documento.

## Mapa interactivo

Panel sin fondo ni borde. Seleccionar una provincia por clic, teclado o selector ajusta el viewBox a sus límites con margen de 12%. Ver todo el país restaura el encuadre nacional y elimina el filtro provincial. Los contornos mantienen su grosor al ampliar. Las verificaciones visuales de color quedan pospuestas por decisión del usuario; priorizar pruebas funcionales.

## Rediseño aportado por el usuario

Se adaptó el HTML «Escuela Abierta · Rediseño» a los componentes React existentes. Escritorio: mapa lateral fijo, marca compacta, filtros y listado en segunda columna. Móvil: listado prioritario y mapa en panel de pantalla completa con cierre, Escape, foco contenido y restauración del foco. Filtros de gestión como botones, filtros activos removibles, estados de carga/vacío/error con reintento real, tarjetas reversibles y fechas al pie.

Paleta principal conservada. Tokens del rediseño: tinta #1B3242, texto secundario #45606F, tarjetas #F6F3EB. Fuentes Atkinson Hyperlegible y Bricolage Grotesque extraídas del bundle y servidas localmente; licencias en public/fonts/LICENSE.txt. Monoespaciada del sistema para metadatos.

Datos ficticios y coordenadas ilustrativas del HTML excluidos. Continúa cartografía Georef/IGN, con su atribución y límite de encuadre, en lugar de copiar la atribución Natural Earth de la maqueta. La muestra experimental mantiene su ruta independiente hasta validar asociaciones al padrón. Sin cambios de esquema ni publicación de orientaciones pendientes.

Verificación: TypeScript, integración REST, filtro privado + 9 de Julio (una tarjeta con cuatro ofertas), giro/regreso, panel móvil a 390px y cierre con Escape. Sin revisión visual exhaustiva de colores por preferencia del usuario.
