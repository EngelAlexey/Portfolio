# Notas de imagen

Material de trabajo para el carrusel y las capturas del artículo. No se publica: el cargador de la colección solo lee `es.mdx` y `en.mdx`.

## Capturas para el artículo

Todo lo que se captura sale de documentación pública o del repositorio de prueba que el propio artículo construye. Ninguna captura se toma en un repositorio de cliente, ni de un `CLAUDE.md`, un `settings.json` o un `.cursorignore` real, porque esos archivos describen la arquitectura y las rutas sensibles del proyecto al que pertenecen.

| Punto | Qué capturar |
|---|---|
| 1 | Las tres formas una al lado de la otra: autocompletado, chat y agente, con quién aplica el cambio en cada una. Es la lámina que define el tema. |
| 2 | El bucle en cuatro pasos, con las seis llamadas a herramientas del ejemplo debajo. |
| 3 | **La lámina más útil.** Los 28 941 tokens ocupados antes de la primera pregunta, sobre un archivo de cinco líneas. Al lado, la salida de `/context` con su reparto. |
| 4 | Dos columnas: tareas con comprobación y tareas sin ella. Debajo, `/goal` con una condición real y el veredicto del evaluador. |
| 5 | La petición de ejemplo con sus cuatro partes señaladas: archivo, comportamiento, criterio y restricción. |
| 6 | Los tres niveles de deshacer, uno encima de otro: `Esc`, `/rewind`, git. Con el hueco marcado: lo que hizo la terminal no lo cubre `/rewind`. |
| 8 | La escalera de los tres momentos de carga: archivo de instrucciones siempre, regla por ruta al tocar un archivo, skill por descripción. |
| 9 | El `SKILL.md` mínimo entero, con la descripción resaltada. Es la parte que decide si se carga. |
| 10 | La ficha de un plugin antes de instalarlo, con el coste en contexto y la lista de lo que va a instalar. |
| 11 | La regla `deny` y, debajo, el error literal `File is in a directory that is denied by your permission settings.` |
| 12 | Las dos salidas de `--stat` una encima de otra: `git diff --stat` con dos archivos y `git diff --cached --stat` con tres. La tercera línea resaltada. |
| Tabla | La chuleta de órdenes y atajos, entera, en una sola lámina vertical. Es la que la gente guarda. |

Todas en tema oscuro, para que empaten con las portadas.

## Láminas del carrusel

Diez láminas: portada, la definición, la cifra, seis conceptos y el cierre. El carrusel entrega el mapa de conceptos y la chuleta de órdenes. El artículo aporta las mediciones, las salidas exactas y las referencias.

1. **Portada.** Titular: «Qué es un agente y cómo se empieza a usarlo». Fondo `#17171c`, acento en el morado del área de IA.
2. **La definición.** Autocompletado, chat y agente, separados por quién aplica el cambio.
3. **La cifra.** Previsión 24 % más rápido, percepción 20 % más rápido, medición 19 % más lento. Con la población en la lámina: 16 desarrolladores expertos, 246 tareas, herramientas de 2025.
4. El bucle: reunir contexto, actuar, verificar, repetir.
5. La ventana de contexto se agota, y no empieza vacía.
6. Una tarea encaja si existe una orden que decide si está terminada. `/goal` la declara.
7. Tres niveles para deshacer: `Esc`, `/rewind`, git. Y lo que ninguno de los dos primeros cubre.
8. Documentación, reglas y skills son tres momentos de carga distintos.
9. Un plugin ejecuta código con los permisos de quien lo instala.
10. **Cierre.** La chuleta de órdenes: `/init`, `/context`, `/plan`, `/goal`, `/rewind`, `/permissions`, `/plugin`.

La lámina 10 no es opcional. Es la que da motivo para guardar el carrusel, y la que lleva al artículo a quien quiera saber qué hace cada una.

## Qué no se publica

Ninguna captura de un archivo de instrucciones, una skill o un informe de auditoría de un proyecto real. La medición de tokens del punto 3 se toma sobre el repositorio de ejemplo del artículo, y el número exacto depende de lo que cargue cada instalación, así que la lámina lo dice.
