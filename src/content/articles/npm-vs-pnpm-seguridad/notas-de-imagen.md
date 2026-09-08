# Notas de imagen

Material de trabajo para el carrusel y las capturas del artículo. No se publica: el loader de la colección solo lee `es.mdx` y `en.mdx`.

## Capturas para el artículo

Todas salen de los proyectos de prueba escritos en el propio artículo. Ninguno es un repositorio real, así que se pueden mostrar enteros.

| Punto | Qué capturar |
|---|---|
| 1 | Terminal partida: a la izquierda `npm install` con salida 0 y `EJECUTADO.txt` listado; a la derecha `pnpm install` con `ERR_PNPM_IGNORED_BUILDS`. El contraste es la imagen. |
| 2 | El `pnpm-workspace.yaml` recién escrito por pnpm, con `esbuild: set this to true or false` visible. Es la línea que nadie espera encontrar. |
| 3 | `node -e "require('ms')"` dos veces: en npm imprime, en pnpm devuelve `MODULE_NOT_FOUND`. |
| 4 | `CI=true npm install` con salida 0 y, debajo, `node -p` mostrando `4.4.0` cuando el bloqueo decía `4.3.4`. |
| 5 | La entrada `minimumReleaseAge: 1440` en `pnpm-workspace.yaml`, junto a `npm config get before` devolviendo `null`. |
| 7 | El `.npmrc` de dos palabras junto a la salida de `npm audit signatures`. Es la lámina que evita que el artículo se lea como un veredicto. |

Todas en tema oscuro, para que empaten con las portadas.

## Láminas del carrusel

Ocho láminas: portada, la tabla, cinco diferencias y el cierre. El carrusel entrega la tabla completa y utilizable. El artículo aporta los proyectos de prueba, los comandos y las referencias, que es lo que no cabe en una imagen.

1. **Portada.** Titular: «npm vs pnpm: qué cambia al instalar». Fondo `#17171c`, acento en el rojo del área de seguridad.
2. **La tabla.** Cuatro filas, tres columnas. Es la lámina que la gente guarda.
3. Instalar una dependencia ejecuta código de terceros.
4. pnpm 10 lo bloqueó con un aviso; pnpm 11 lo convirtió en un error.
5. Con npm, `require` resuelve paquetes que nadie declaró.
6. En CI, `npm install` reescribe el archivo de bloqueo y sale con 0.
7. pnpm 11 espera un día antes de aceptar una versión recién publicada.
8. **Cierre.** `.npmrc` con `ignore-scripts=true` y `npm ci`: npm iguala tres de los cuatro comportamientos. La protección depende de la versión y de la configuración, no del nombre del gestor.

La lámina 8 no es opcional. Sin ella el carrusel se lee como una recomendación de cambiar de herramienta, que no es lo que el artículo dice.

## Qué no se publica

Las capturas se toman en los directorios de prueba, nunca en un proyecto con dependencias reales. Una captura de un `pnpm-workspace.yaml` real expondría la lista de paquetes que ejecutan código en un proyecto de cliente.
