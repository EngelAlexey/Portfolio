# Notas de imagen

Material de trabajo para el carrusel y las capturas del artículo. No se publica: el loader de la colección solo lee `es.mdx` y `en.mdx`.

## Capturas para el artículo

Todo lo que se captura sale de fuentes públicas o de los proyectos de prueba escritos dentro del propio artículo. Ninguna captura se toma en un repositorio de cliente, ni de un archivo de reglas real, porque un archivo de reglas describe la arquitectura del proyecto al que pertenece.

| Punto | Qué capturar |
|---|---|
| 1 | La comparación de tamaños del repositorio público de Vercel: `SKILL.md` en 7251 bytes frente a `AGENTS.md` en 108 261. Una barra al lado de la otra, con la orden de la API de GitHub que los devuelve. |
| 1 bis | Un `description` bien escrito y otro vago, uno encima del otro. Es la lámina que explica por qué una regla no se carga. |
| 2 | Las cinco partes de una regla como lista numerada sobre fondo oscuro, con la quinta resaltada. La orden de detección es la que casi nadie escribe. |
| 3 | La cifra de Google: 100 líneas razonable, 1000 demasiado. Junto a ella, el tamaño de un cambio pedido a un asistente sin límite fijado. |
| 4 | Las dos ejecuciones de `node --test`: `pass 2` en verde y, al lado, `fail 1` con el `AssertionError`. Es la lámina más útil del artículo. |
| 5 | `npx tsc` devolviendo `TS2345`, y debajo la salida del linter sobre la aserción de tipo. |
| 5 bis | La lista de catorce reglas de `eslint-plugin-security`, entera, sin ninguna de SQL. |

Todas en tema oscuro, para que empaten con las portadas.

## Láminas del carrusel

Ocho láminas: portada, la cifra, las seis prácticas comprimidas y el cierre. El carrusel entrega la lista completa de prácticas, que es lo que se puede aplicar sin leer nada más. El artículo aporta las mediciones, las salidas exactas y las referencias.

1. **Portada.** Titular: «El asistente escribe más rápido de lo que nadie revisa». Fondo `#17171c`, acento en el morado del área de IA.
2. **La cifra.** 55 % de las tareas terminan en código seguro, sobre más de 150 modelos, medido en marzo de 2026. Con la fuente en la lámina.
3. Una regla llega al modelo solo si algo decide cargarla. Se parten por momento de disparo, no por tema.
4. Cada regla lleva el fallo que la produjo y la orden que lo detecta.
5. La revisión ocurre por cambio, y el revisor tiene instrucción de tumbar. Las herramientas mecánicas son pista, no fuente.
6. Una prueba se acepta cuando se ha visto fallar. Dos direcciones: roja y verde.
7. Lo que el compilador puede imponer no se escribe como regla.
8. **Cierre.** Montarlo cuesta unas horas y después cuesta minutos por cambio. Encontrar los mismos defectos más tarde obliga a leer el árbol entero.

La lámina 8 no es opcional. Sin ella el carrusel se lee como una lista de buenas prácticas más, y lo que sostiene el artículo es la comparación de coste.

## Qué no se publica

Ninguna captura de un `CLAUDE.md`, un `.cursorrules` o un prompt de sistema real, ni de un informe de auditoría de un proyecto de cliente. Las mediciones del punto 1 se toman sobre el repositorio público de Vercel, que cualquiera puede reproducir con la misma orden.
