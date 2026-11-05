# Fuentes: investigación inicial

Consulta: 2026-11-03.

## Padrón nacional

- Página: https://www.argentina.gob.ar/node/246613
- Archivo inspeccionado: https://www.argentina.gob.ar/sites/default/files/2026.09.07_padron_oficial_establecimientos_educativos_die.xlsx
- Corte: 2026-09-07. Formato XLSX, descarga pública sin registro.
- Hoja padron; encabezados agrupados en filas 12 y 13; datos desde fila 14.
- Inspección preliminar: 64.495 registros, CUEANEXO únicos de nueve caracteres, 24 jurisdicciones, 43 columnas; 2.051 registros de Tucumán.
- Incluye nombre, jurisdicción, localidad/departamento y códigos, domicilio, contacto, gestión, ámbito, modalidades y ofertas.
- No incluye columnas explícitas de latitud/longitud.
- Faltan 648 domicilios y 11.248 correos. No prometer completitud o vigencia individual.
- Encabezados finales de hogares/población requieren diccionario metodológico; excluir inicialmente.

## Licencia

https://datos.gob.ar/es/dataset/educacion-padron-oficial-establecimientos-educativos declara CC BY 4.0, pero la ficha consultada tiene metadatos antiguos. Confirmar correspondencia con el corte actual antes de redistribuir. La atribución por sí sola no reemplaza una licencia aplicable.

## Otras referencias

- Mapa oficial: https://mapa.educacion.gob.ar/mapa-interactivo
- Referencia de producto: https://municipiosargentinos.net/intendentes/

No se confirmó API pública del padrón. La actualización será manual y mensual si hay nueva publicación. Las discrepancias en Google Maps no prueban cierres o mudanzas. No se descargan datos ni se importan automáticamente al arrancar Docker.
