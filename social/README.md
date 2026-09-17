# social/

Motor que genera las piezas de Instagram de [@alexherrera.dev](https://www.instagram.com/alexherrera.dev/):
carruseles, posts de una lámina y reels, más un laboratorio de personajes animados. Cada pieza se
escribe como HTML con las piezas de `sistema.mjs` o `reels.mjs`, y Chrome sin ventana la convierte
en PNG, PDF o MP4.

Las piezas llevan al blog del sitio, que es el resto de este repositorio. Nada de `social/` entra en
el build de Astro ni en el despliegue: `.vercelignore` lo deja fuera. Las rutas `src/…`, `public/…`
y `scripts/…` que aparecen en comentarios y en este documento son de la raíz del repositorio.

**Historia.** Hasta el 16 de septiembre de 2026 esto vivía en `design/social/`, fuera de git. Ese
día se limpió, pasó unas horas como repositorio propio y quedó integrado aquí.

**Qué se borró en la limpieza:**
- el motor anterior (`motor-v1/`);
- el reel de prueba;
- el banco de escenas;
- el primer laboratorio de personajes;
- las capturas de comprobación de los reels.

Todo eso está en `design/respaldo-social-2026-09-16-obsoletos.zip`, junto a los respaldos
anteriores.

## Qué leer primero

- **Este README.** El sistema visual y las reglas de cada formato. Se lee entero antes de hacer
  una pieza.
- **`docs/temario.md`.** Los temas evaluados y los títulos aprobados.
- **El `publicacion.md` de una pieza parecida.** Es el modelo del texto de la publicación, la
  historia y la auditoría.
- **`docs/plan.md`.** El estado de la cuenta y los próximos pasos. Es local y no se versiona.

## Requisitos

- **Sistema.** Windows, con Chrome en `C:/Program Files/Google/Chrome/Application/chrome.exe`. La
  ruta se cambia con la variable `CHROME`. Para los zip hace falta el `tar.exe` de Windows:
  `exporta.mjs` lo llama por su ruta.
- **Node 24** y `npm install` dentro de `social/`, que trae `ffmpeg-static` para los reels. Es un
  paquete aparte del sitio, que usa pnpm.
- **Conexión a internet.** Las láminas cargan Outfit y JetBrains Mono desde Google Fonts.

## Qué se versiona

**Entra:**
- el motor;
- el contenido: el `gen.mjs` y el `publicacion.md` de cada pieza;
- los personajes de Humaaans (CC0);
- la documentación.

**Queda fuera, porque se regenera:** las láminas `.dc.html`, `canvas.json`, los PNG, PDF, MP4 y WAV,
y los registros.

**Excepciones que sí entran:**
- los dos reels publicados (`reel-*/reel.mp4` y `portada.png`), que salieron del motor anterior y ya
  no se pueden reproducir;
- las imágenes de `docs/`.

**Queda fuera por otros motivos:**
- **Kits de Freepik y láminas de Storyset** (`personajes/kits/*.svg` y
  `personajes/referencias/*.svg`). El repositorio es público, y esas licencias permiten usar los
  archivos pero no redistribuirlos. Viven solo en disco, así que en un clon nuevo el laboratorio de
  personajes no funciona hasta volver a descargarlos (ver «Licencia», en «Personajes»).
- **`docs/plan.md`.** Tiene métricas y estrategia de la cuenta.

# Carruseles y reels de Instagram desde los artículos del blog

Cada artículo del blog puede dar un carrusel de cinco láminas para Instagram. El primero
—«¿Se aprende a programar si la IA escribe el código?»— fijó el sistema que describe este
documento. Los siguientes deben parecerse, no repetirse: la sección «Qué varía» dice
exactamente dónde está permitido moverse.

El **reel** es ese mismo sistema en vertical y con tiempo, y hereda todo lo de aquí salvo lo
que corrige la segunda mitad del documento. Este documento se lee entero antes de hacer uno.


## Cómo está organizado

El sistema vive aparte del contenido, para que cada carrusel nuevo no tenga que copiar nada:

```
sistema.mjs          el motor: paleta, envoltorio de lámina y piezas de contenido
measure.mjs          arma measure.html para comprobar alturas
serve.mjs            sirve el directorio actual en el 4599
chrome.mjs           Chrome sin ventana, por file://: capturas, PDF y medidas
anchos.mjs           mide el ancho de unos valores, para glossary() y summary()
comprueba.mjs        mide las láminas de un carrusel y falla si algo no cabe
exporta.mjs          PNG, vista de la cuadrícula, PDF y zip de un carrusel
<slug>/gen.mjs       un carrusel: sus láminas y nada más
<slug>/publicacion.md el texto de la publicación, la historia, la programación y la auditoría
<slug>/*.dc.html     lo que genera, más canvas.json y el canvas sembrado (no se versionan)
docs/plan.md         el estado de la cuenta y los próximos pasos
docs/temario.md      los temas evaluados y los títulos aprobados
post-<slug>/gen.mjs  un post de una lámina. Ver «Posts de una lámina», más abajo

reels.mjs            el motor de los reels, que importa la paleta de sistema.mjs
render.mjs           captura un reel y lo monta en MP4
reel-<slug>/         un reel. Ver «Reels», más abajo
```

Para empezar uno nuevo se copia el `gen.mjs` de un carrusel existente a una carpeta con el
slug del artículo y se reescriben las cinco láminas. El motor no se toca salvo que haga
falta una pieza de contenido que todavía no exista.

## Comandos

```bash
cd <slug>
node gen.mjs         # escribe las cinco láminas .dc.html y canvas.json
node ../measure.mjs  # arma measure.html con las cinco láminas
node ../serve.mjs    # las sirve en http://127.0.0.1:4599
```

Para un carrusel explicativo, el ciclo completo es este. `comprueba.mjs` y `exporta.mjs`
abren las láminas por `file://`, así que no necesitan `serve.mjs`:

```bash
node ../anchos.mjs 64 URL HTTPS          # ancho de los valores del glosario
node ../anchos.mjs 26 --resumen URL      # y de los del resumen
node gen.mjs
node ../comprueba.mjs                    # alturas, dos líneas por término y portada en el recorte
node ../exporta.mjs                      # png/, vista-cuadricula.png, y PDF y zip en ~/Downloads
```

En Git Bash, un valor que empieza por `/` (`/24`) se convierte en una ruta de Windows antes
de llegar a Node: se antepone `MSYS_NO_PATHCONV=1`.

El canvas se publica sembrando el payload de la skill `design` con las cinco láminas más
`canvas.json`, y se republica sobre el mismo archivo para conservar el enlace. Cada carrusel
tiene el suyo.

## Carruseles publicados

| Carpeta | Artículo | Ángulo | Tonos |
|---|---|---|---|
| `se-aprende/` | ¿Se aprende a programar si la IA escribe el código? | los experimentos | índigo · violeta · turquesa |
| `primeros-pasos/` | Primeros pasos para programar con IA | la guía práctica | violeta · bosque · índigo |
| `velocidad-percibida/` | Primeros pasos para programar con IA | la cifra de METR | magenta · ciruela · petróleo |
| `codigos-http/` | — (explicativo; la historia lleva a «Siete cosas que revisar», sección 2) | 19 códigos en sus cuatro familias y un resumen de todos | bosque · petróleo · magenta |
| `pagina-web/` | — (explicativo; la historia lleva a «Siete cosas que revisar», sección 4) | los cuatro pasos de una visita, 16 piezas | magenta · índigo · ciruela |
| `direccion-ip/` | — (explicativo; la historia lleva al índice del blog) | versiones, privadas y públicas, especiales y cómo ver la tuya | verde azulado · violeta · magenta |
| `puertos/` | — (explicativo; la historia lleva al índice del blog) | rangos, servicios, bases de datos y desarrollo, y cómo cerrar los que sobran | carmín · petróleo · índigo |
| `permisos-linux/` | — (explicativo; la historia lleva a npm vs pnpm, sección 1) | letras, usuarios, números y órdenes | petróleo · bosque · ciruela |

`codigos-http/` es el primer carrusel explicativo; ver «Carruseles explicativos», más abajo. Él y
los cuatro siguientes del temario (`pagina-web/`, `direccion-ip/`, `puertos/` y `permisos-linux/`)
quedaron listos el 16 de septiembre de 2026 y programados en Meta Business Suite del 17 al 30.
Las fechas están en `docs/plan.md`.

Se publican en ese orden, detrás de `codigos-http/`, y con el color de portada pensado para
esa cuadrícula: ninguna portada queda junto a otra del mismo color ni de uno parecido, y el
verde azulado y el azul petróleo, los más cercanos, quedan en la misma fila pero separados
por el carmín. `docs/vista-perfil-serie.png` monta las cinco portadas delante de las cuatro
publicadas. Si el orden cambia, hay que volver a mirar esa vista.

Ese día la cuadrícula del perfil tenía cuatro publicaciones, y sus portadas eran azul muy
oscuro (`reel-envenenamiento/`), naranja (`reel-revisar-codigo/`), violeta
(`primeros-pasos/`) e índigo (`se-aprende/`). `velocidad-percibida/` y `post-npmrc/` no
aparecían.

Un mismo artículo admite varios ángulos, y no todos sirven para el mismo tema.
`velocidad-percibida/` estuvo archivado y se recuperó para la campaña. Conviene anotar por
qué, porque el diagnóstico inicial era equivocado: no fallaba el gancho —la lámina 1 ya era
una pregunta que se sostenía sola— sino las láminas 2 y 4, que prometían una medición y
entregaban un tutorial de agentes. Un carrusel se cae por las láminas del medio mucho antes
que por la portada.

## Formato

**1080 × 1080 px, cuadrado.** Se probó primero en 4:5 (1080 × 1350), que ocupa más pantalla
en el feed, y no funcionó: al subirlo, Instagram recorta a cuadrado por defecto y se lleva
por delante la cabecera y el pie, que es justo donde están el logo y el dominio. Diseñando
en cuadrado, lo que se sube es exactamente lo que se ve.

Si alguna vez se vuelve al 4:5, la cabecera y el pie tienen que caber dentro del cuadrado
central —135 px de margen arriba y abajo—, o se pierden en el recorte.

**La cuadrícula del perfil recorta la portada a 3:4.** Desde 2025, el perfil enseña cada
publicación recortada a 3:4 por el centro: de un cuadrado de 1080 quita 135 px por cada
lado. A `se-aprende/` y `primeros-pasos/` se les corta ahí el principio de cada renglón del
título. Por eso la portada lleva `inset: COVER_INSET` (`sistema.mjs`): todo su contenido,
cabecera y pie incluidos, empieza en 168 px y termina en 912, con 33 px de aire dentro del
recorte. Las láminas interiores no salen en la cuadrícula y conservan los 88 px, así que al
deslizar la cabecera se desplaza 80 px; es el precio de una portada que se lee entera en el
perfil.

Para las portadas ya publicadas, según HowToGeek y ALM Corp, Instagram permite mover el
recorte desde la publicación (⋯ → «Ajustar vista previa»). No está comprobado en la app ni
con carruseles. En `se-aprende/`, el título y el párrafo ocupan de 88 a 855 px y
caben enteros si el recorte se lleva a la izquierda. En `primeros-pasos/`, el título va de 88
a 910 px, 822 en total, y no cabe entero en ningún recorte de 810: lo mejor es llevarlo a la
izquierda, para que se lea el principio de cada renglón.

**Cinco láminas. Nunca más.** Diez fue el primer intento y no funcionó: el carrusel dejaba de
ser una invitación y pasaba a ser el artículo comprimido, que es justo lo que quita la razón
para abrir el blog. Los carruseles explicativos, que no llevan a un artículo, tienen su propia
regla: ver «Carruseles explicativos».

## Estructura narrativa

| Lámina | Papel | Qué lleva |
|---|---|---|
| 1 | Gancho | La pregunta del artículo, grande. Una línea que dice que hay respuesta medida. |
| 2 | Contexto | Por qué la pregunta importa y cómo se puede responder. |
| 3 | Explicación | La sustancia: las cifras con su procedencia, o los pasos concretos. |
| 4 | Respuesta | Lo que explica la lámina 3. Es la que resuelve el gancho. |
| 5 | Reflexión | La conclusión, el enlace al blog y «Enlace en la biografía». |

**La estructura no se rotula.** No hay antetítulos que digan «El contexto» o «La respuesta»:
el andamiaje se nota al deslizar, no impreso. Los nombres de los artboards en el canvas sí
los conservan, porque sirven para orientarse al editar.

## Reglas de contenido

Son las que costaron más iteraciones. Cada una salió de un fallo real.

1. **Cada lámina se entiende sola**, sin haber leído el artículo y sin haber visto la
   anterior. Si hace falta contexto de la lámina previa, la lámina está mal escrita.
2. **Ninguna cifra va suelta.** Siempre con quién la produjo y contra qué se compara. Un
   «−17 %» a secas se lee como si fuera la nota; tiene que decir «los que practicaron con
   ChatGPT sacaron un 17 % menos que los que no lo usaron».
3. **No es un resumen del artículo.** Se eligen las dos o tres cosas más interesantes y el
   resto se promete en la lámina 5. Comprimir el artículo entero produce telegramas
   incomprensibles.
4. **Registro hablado, no el del artículo.** El blog está escrito en un registro seco a
   propósito; copiado a una lámina suena a informe. «Cuando el código llega ya escrito, el
   trabajo de producirlo no se hace» es un calco; «Si la IA escribe el código, nadie practica
   escribirlo» es la misma idea dicha por una persona.
5. **Afirmaciones y conclusiones**, no enumeraciones ni listas de puntos.
6. **Las fuentes se nombran.** La publicación y el año dan autoridad a la cifra: «salió en
   PNAS», «se presentó en CHI». No se atribuye a universidades si el artículo no las nombra.
7. **Como mucho tres bloques por lámina.** Titular, apoyo y, si toca, la cifra o la
   conclusión destacada. Nada más.

## Sistema visual

Limpio y minimalista. El color entra por el fondo, no por elementos encima del texto.

### Paleta

Nueve tonos, cada uno con su tramo claro para el degradado:

| Tono | Base | Tramo claro | Acento sobre él |
|---|---|---|---|
| Índigo | `#2f3fd4` | `#4a5cf0` | ámbar `#ffd166` |
| Turquesa profundo | `#0b6b62` | `#0d8377` | menta `#5eead4` |
| Violeta | `#5f2fdb` | `#7d52f4` | menta `#5eead4` |
| Magenta | `#a21462` | `#c01d76` | ámbar `#ffd166` |
| Azul petróleo | `#0e5f7a` | `#12768f` | ámbar `#ffd166` |
| Ciruela | `#6b21a8` | `#7e2ec4` | menta `#5eead4` |
| Naranja profundo | `#a3410a` | `#bd4f0e` | menta `#5eead4` |
| Verde bosque | `#136b3a` | `#17864a` | ámbar `#ffd166` |
| Carmín | `#a50d26` | `#c8102e` | ámbar `#ffd166` |

Cada carrusel usa tres de los nueve. Añadir uno nuevo obliga a comprobar el contraste antes
de usarlo: `contraste()` en `sistema.mjs`. El carmín se añadió el 16 de septiembre de 2026
para `puertos/`, porque ninguna portada publicada era roja y el naranja profundo se lee como
café. Da 5,88:1 con el blanco sobre su tramo claro, y es el mismo `#c8102e` de los
sombreros de los personajes.

Neutros: blanco `#ffffff`, tinta `#141726`, tinta suave `#5c6280`.

**La regla que gobierna la paleta:** el blanco tiene que contrastar al menos 4.5:1 sobre el
punto **más claro** del degradado. El primer intento iba de la base a un pastel y el texto se
perdía en el tramo final. Por eso los degradados suben poco: lo que vibra son los acentos,
no el fondo.

### Ritmo

Láminas impares a color pleno, pares en blanco, y el cierre a color. La alternancia es lo que
da respiración al carrusel cuando se pasa deprisa.

### Adornos e ilustración

El fondo lo hacen dos halos difusos por lámina (`filter: blur(150px)`), uno arriba a la derecha
y otro abajo a la izquierda, sangrando fuera del lienzo. Sobre color van al 0,8 y 0,9 de
opacidad; sobre blanco, al 0,26 y 0,13.

**Ningún adorno.** Se probaron y se descartaron: manchas orgánicas de borde definido, círculos y
triángulos de tinta plana, cuadrados girados con contorno negro y grano de impresión. Todo eso
compite con el texto y no dice nada a cambio. El tramado de los reels no es ese grano:
no se ve, y se explica en «Cómo se renderiza», dentro de «Reels».

**La ilustración es otra cosa y sí entra.** Un diagrama, una figura, una silueta, una escena
animada: lo que se dibuja para decir algo no es un adorno, es contenido, y se gana el sitio
igual que se lo ganó el bloque de código. La prueba es una sola pregunta: *¿dice esto algo que
el texto tendría que decir si no estuviera?* Un halo decorativo no pasa la prueba; un paquete
que llega a una máquina y se abre, sí.

**En un reel la ilustración pesa más que el texto.** No es una preferencia: es que la lámina
pasa una vez y no se puede releer, y una figura se entiende antes de que una frase se termine
de leer. En un carrusel manda el texto, porque quien mira puede volver atrás y detenerse; en un
reel, la escena lleva la idea y el texto la nombra. Las escenas viven en `escena.mjs` y se
describen en «Escenas», más abajo.

### Tipografía

- **Outfit** para todo el texto de lectura. Geométrica y limpia.
- **JetBrains Mono** sólo para el contador («03 / 05») y la dirección del blog, que se leen
  como dato y no como frase. Usar monoespaciada en antetítulos y notas hizo el carrusel
  difícil de leer.

Escala, sobre el lienzo de 1080 × 1080 px:

| Elemento | Tamaño | Peso | Interlineado |
|---|---|---|---|
| Titular lámina 1 | 88 px | 700 | 1.04 |
| Titular láminas 2–5 | 56 px | 600 | 1.14 |
| Párrafo | 30 px | 400 | 1.5 |
| Cifra grande | 118 px | 700 | 0.9 |
| Pie de cifra | 30 px | 500 | 1.34 |
| Conclusión destacada | 34 px | 600 | 1.32 |
| Nota de procedencia | 22 px | 400 | 1.45 |
| Cabecera y pie | 21–23 px | 400–600 | — |

Las cifras con `%` llevan `&nbsp;` antes del signo, o el titular parte «17» y «%» en
renglones distintos.

### Presupuesto de altura

Es lo que hay que tener a mano al escribir: en cuadrado el espacio no sobra, y el texto se
escribe contra este número.

```
1080   lienzo
-176   margen superior e inferior (88 + 88)
 -46   cabecera
 -57   pie (30 de alto + 26 de separación + 1 de filete)
 -68   respiro del cuerpo (34 + 34)
─────
 733   disponible para el cuerpo
```

Lo que ocupa cada bloque, incluidos los 30 px de separación que lo siguen:

| Bloque | Alto por línea | Una línea | Dos líneas | Tres líneas |
|---|---|---|---|---|
| Titular de portada (88 px) | 91 | 91 | 183 | 274 |
| Titular interior (56 px) | 64 | 64 | 128 | 191 |
| Párrafo (30 px) | 45 | 45 | 90 | 135 |
| Cifra con su frase | — | 113 | 113 | 120 |
| Conclusión destacada (34 px) | 45 | 45 | 90 | — |
| Nota de procedencia (22 px) | 32 | 32 | 64 | — |
| Píldora del enlace | — | 64 | — | — |

Las cinco láminas del primer carrusel ocupan 323, 398, 476, 503 y 624 px. La más densa es la
de las cifras y aun así deja 109 px libres. **Si una lámina pasa de 700 px, sobra texto**: la
solución es cortar, no encoger la tipografía.

### Anatomía de la lámina

```
┌────────────────────────────────────┐
│ ⬤ @alexherrera.dev        03 / 05  │  cabecera · 46 px
│                                    │
│                                    │
│  Titular                           │
│                                    │  cuerpo · 733 px
│  Párrafo de apoyo.                 │  centrado vertical
│                                    │
│  118px  Pie que explica la cifra.  │
│                                    │
│                                    │
├────────────────────────────────────┤
│ alexherrera.dev        DESLIZA  →  │  pie · 57 px
└────────────────────────────────────┘
        88 px de margen a los cuatro lados
```

El avatar de la cabecera es el trazo de la «A» de `public/favicon.svg`, no una letra
compuesta con la tipografía: es la marca del sitio y tiene que ser la misma que la pestaña
del navegador. El dominio del pie va en tinta plena y peso 500, porque es el enlace a la
página; en gris suave desaparecía sobre blanco.

La última lámina cambia «Desliza» por «Lee el artículo» y añade la píldora con
`alexherrera.dev/es/blog` más «Enlace en la biografía».

## Qué varía entre carruseles

El formato se repite; el contenido y el color, no.

- **El trío de tonos.** Se puede rotar el orden o sustituir uno por otro tono de la misma
  familia, siempre comprobando el contraste del blanco sobre el tramo claro. Una opción
  razonable es partir del área del artículo en `src/lib/areas.ts` —IA, seguridad,
  infraestructura— y subirle la saturación.
- **La portada no repite el color de ninguna portada publicada.** Antes de elegirlo se mira
  la cuadrícula del perfil: es donde las portadas se ven una al lado de otra.
- **Qué lámina lleva el peso visual.** En este carrusel es la 3, con dos cifras. En otro
  puede ser una comparación de barras, un bloque de código o una sola cifra enorme.
- **El gancho.** Si el título del artículo ya es una pregunta, sirve tal cual, con la parte
  clave en el color de acento. Si no lo es, se convierte en una.
- **El número de cifras.** Cero, una o dos. Tres ya es una tabla, y una tabla no se lee en
  el feed.

Lo que no varía: cinco láminas y la estructura de cinco pasos (salvo en los explicativos, ver
«Carruseles explicativos»), la alternancia color/blanco, las dos fuentes, la ausencia de
formas dibujadas y las siete reglas de contenido.

## De dónde sale el material

Cada artículo trae un `notas-de-imagen.md` en su carpeta de `src/content/articles/`, con un guion de
carrusel ya escrito, de ocho o diez láminas. Sirve para saber qué es lo importante del
artículo, pero **hay que recortarlo a cinco** y reescribirlo con las reglas de arriba: esos
guiones se pensaron para un carrusel largo y en registro de blog.

Los datos —cifras, poblaciones, fechas— salen del texto del artículo y las publicaciones,
del bloque `<References>` al final del `.mdx`.

## Comprobación antes de publicar

`measure.mjs` arma una página con las cinco láminas a tamaño real, cargando sus fuentes y
resolviendo los colores. Sirve para dos cosas:

1. Que ninguna lámina desborde. Con `serve.mjs` levantado y la página abierta, el `<main>`
   no debe tener `scrollHeight` mayor que su altura, y la suma de sus hijos debe quedar por
   debajo de los 733 px del presupuesto.
2. Mirarlas juntas y a escala pequeña, que es como se ven en el feed.
3. Que la portada quepa en la cuadrícula: todo su texto, medido por los extremos de cada
   renglón y no por la caja, entre los píxeles 135 y 945. Para verla como en el perfil se
   recorta el PNG a `(135, 0, 945, 1080)`, y conviene montarla junto a las portadas
   publicadas para comprobar que el color no se repite. En `codigos-http/` están
   `vista-cuadricula.png` y `vista-perfil.png`.

## Exportar los PNG

**No se usa la exportación del canvas**: no embebe las fuentes de Google, así que el archivo
sale con la tipografía de reserva. Se renderiza con Chrome en headless, que sí las carga y
da el tamaño exacto:

```bash
node serve.mjs &   # sirve el directorio en el 4599

chrome --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1080,1080 \
  --virtual-time-budget=8000 \
  --screenshot="01-gancho.png" "http://127.0.0.1:4599/Main.dc.html"
```

En Windows, `chrome` está en `C:\Program Files\Google\Chrome\Application\chrome.exe`.

Tres detalles que importan:

- `--window-size` fija el tamaño de salida. Tiene que coincidir con `W` y `H` de `gen.mjs`,
  o el PNG sale recortado o con banda.
- `--force-device-scale-factor=1` evita que salga al doble de resolución. Instagram recomprime
  cualquier cosa por encima de 1080 px de ancho, así que no compensa.
- `--virtual-time-budget=8000` da tiempo a que bajen las fuentes. Sin él, la captura sale con
  la de reserva.
- En Windows, `--screenshot` necesita una ruta absoluta. Con una relativa, desde Git Bash, no
  escribe nada y no avisa. Lo más cómodo es lanzar las cinco capturas desde un script de Node
  con `execFileSync` y `path.resolve`, que además evita el escapado de `\` en Bash.

Las láminas `.dc.html` se pueden renderizar directamente aunque lleven `<x-dc>` y `<helmet>`:
son elementos que el navegador ignora, el `<style>` de dentro sí aplica y el `<script
src="./support.js">` da un 404 sin consecuencias. Eso vale mientras no haya `{{holes}}` sin
resolver en el markup; si los hubiera, habría que sustituirlos antes de capturar.

Los archivos se nombran por orden de publicación —`01-gancho.png`, `02-contexto.png`,
`03-explicacion.png`, `04-respuesta.png`, `05-reflexion.png`— para que al subirlos a
Instagram el orden salga solo. Se entregan comprimidos en `~/Downloads`:

```bash
# PowerShell
Compress-Archive -Path "<dir>\*.png" -DestinationPath "$HOME\Downloads\carrusel-<slug>.zip" -Force
```

Conviene abrir un PNG y comprobar dos cosas antes de dar el trabajo por hecho: que mide
1080 × 1080 exactos y que el titular sale en Outfit y no en la de reserva. Si sale en la de
reserva, falta tiempo de red: sube `--virtual-time-budget`.

**El PDF para LinkedIn** se hace imprimiendo con Chrome una página con los cinco PNG, uno
por hoja (`@page { size: 1080px 1080px; margin: 0 }` y `--print-to-pdf`, con
`--no-pdf-header-footer`). No con Pillow: guarda las imágenes en JPEG y el texto sale con
artefactos. Chrome las guarda sin pérdida. Se entrega junto al zip, como
`~/Downloads/carrusel-<slug>.pdf`.

# Carruseles explicativos

Un carrusel no tiene por qué salir de un artículo. Los explicativos enseñan una familia de
conceptos al nivel de quien empieza —los códigos HTTP, los puertos, los permisos de Linux— y
son en sí el material de consulta: se guardan para volver a ellos. El temario está en
`docs/temario.md`, sección «Carruseles de Instagram». El primero es `codigos-http/`.

Heredan del carrusel el lienzo, la paleta, las dos fuentes, el presupuesto de altura, la
alternancia color/blanco y las reglas de contenido 1, 2, 4, 6 y 7. La 3 no aplica, porque no
hay artículo que resumir. Lo que cambia salió de las notas de Alex a la primera versión de
`codigos-http/`, que llevaba dos códigos por familia y cerraba con un solo dato: el diseño
estaba bien, pero el contenido se quedaba corto.

- **Seis láminas: portada, una por familia y un resumen.** El «nunca más de cinco» viene de
  los carruseles que invitan a leer un artículo, donde alargarlos quita la razón para
  abrirlo. Aquí no hay artículo: el carrusel es el material. Con seis, el resumen cae en
  blanco, y en blanco se lee mejor como chuleta.
- **Cada familia se explica entera**, con sus códigos habituales: tres a cinco por lámina,
  no dos. Cada uno lleva el valor, su nombre oficial —el que enseñan el navegador y las
  herramientas— y qué significa, con un ejemplo o qué hacer cuando cabe. Dos líneas como
  mucho por término.
- **El glosario es un solo bloque** (`glossary()` en `sistema.mjs`): titular y glosario son
  dos bloques y la regla 7 se cumple. El valor va a 80 px, y todos con el ancho del más
  ancho, medido en Chrome, para que el texto empiece en la misma columna en todas las
  láminas. Así caben cinco términos de dos líneas bajo un titular de dos.
- **El cierre es el resumen de todo lo que se enseñó** (`summary()`): dos columnas, cada
  familia con su cabecera y una etiqueta de dos o tres palabras por término, más la píldora
  del blog. El pie dice «Guárdalo», porque la lámina es el artefacto.
- **La regla 5 se relaja como en los posts de una lámina.** El titular de cada familia afirma
  algo («Si empieza por 4, el fallo está en la petición»), pero el glosario y el resumen son
  listas, porque la lista es el material.
- **La historia lleva a un artículo que ya exista.** Si el artículo que el temario asocia al
  carrusel todavía no está publicado, se busca uno publicado que trate el tema. En
  `codigos-http/` es «Siete cosas que revisar», cuya sección 2 explica por qué el endpoint
  responde 404 y no 403. El matiz del 404 va también en su fila y en el texto de la
  publicación.
- **Un `publicacion.md` junto al `gen.mjs`**, con el texto de la publicación, la historia del
  mismo día con su enlace y la auditoría de cada afirmación contra su fuente. El texto de la
  publicación nombra el término que se busca («códigos HTTP»), que en la lámina puede faltar.

Para comprobar un glosario no basta con la altura total: cada término tiene que quedarse en
dos líneas y el texto tiene que empezar en la misma columna en todas las láminas. Las clases
`fila` y `fila-texto` del glosario, y `resumen-fila` del resumen, están para eso:
`comprueba.mjs` las mide.

Lo que se aprendió con los cuatro siguientes:

- **El tamaño del valor depende del carrusel.** Los códigos caben a 80 px. Las palabras
  (HTTPS, chmod) van a 64, y las direcciones y los nombres de sistema (127.0.0.1, Windows), a
  56. Dentro de un carrusel, todas las láminas usan el mismo tamaño y el mismo ancho.
- **Una orden como nombre abre la frase.** Si el nombre es `<code>…</code>`, el glosario no
  le pone punto detrás y el texto sigue en minúscula: «`ipconfig` muestra la IP…».
- **El resumen admite valores de ancho distinto**, con `summary(…, { width })`, y cabeceras
  sin subtítulo, solo con `key`.
- **El resumen repite lo que se enseñó.** Si una fila no tiene valor propio, como «de tres en
  tres» en `permisos-linux/`, el resumen la cambia por la orden que la enseña (`ls -l`).

# Posts de una lámina

Un carrusel de cinco láminas no es la única forma. Hay material que se entrega entero en una
sola imagen —una orden, un archivo de configuración, una cifra con su procedencia— y
estirarlo a cinco láminas lo empeora: obliga a inventar contexto alrededor de algo que ya
estaba completo.

El post hereda todo del carrusel: mismo lienzo de 1080 × 1080, mismos 88 px de margen, misma
paleta, mismas dos fuentes, mismo presupuesto de 733 px de cuerpo y las mismas siete reglas de
contenido. Lo que cambia son cuatro cosas:

- **El enunciado va en `h1` de 88 px, no en `h2`.** No hay lámina siguiente que lo desarrolle,
  así que la primera línea carga todo el peso.
- **No lleva contador.** El `03 / 05` cuenta un recorrido que aquí no existe. Se apaga pasando
  `{ counter: false }` como cuarto argumento de `build`.
- **El pie dice `Guárdalo` cuando la lámina *es* el artefacto**, y `Lee el artículo` cuando
  apunta a uno. Es la única decisión de contenido propia del formato.
- **Un solo tono**, no un trío. Basta con que no coincida con el de la publicación anterior.

La regla 5 —afirmaciones, no enumeraciones— **admite una excepción aquí y sólo aquí**: cuando
la lista es el artefacto entero y no el andamiaje de un argumento, como una chuleta de
órdenes. En un carrusel sigue prohibida.

```bash
cd post-<slug>
node gen.mjs         # escribe la lámina .dc.html y canvas.json
node ../measure.mjs  # la arma a tamaño real
node ../serve.mjs
```

## Posts publicados

| Carpeta | Artículo | Qué entrega | Tono |
|---|---|---|---|
| `post-npmrc/` | npm vs pnpm: qué cambia en la seguridad al instalar | la línea de `.npmrc` que bloquea los scripts de instalación | turquesa profundo |

# Reels

El reel es el mismo sistema en vertical y con tiempo: las mismas cinco láminas, la misma
paleta, las mismas dos fuentes y las mismas siete reglas de contenido. Lo que cambia es que
la lámina ya no se mira, pasa. Todo lo que dice este documento sobre carruseles sigue
valiendo salvo lo que esta sección corrige.

No llevan voz: el texto es la narración. Llevan tres efectos de sonido sutiles (el tecleo,
la cortinilla y el resaltado) en el mismo instante en que se ven, y la música se sigue
eligiendo al subirlo en la propia aplicación, que además es lo que reparte alcance. Ver
«Sonido», más abajo.

## Cómo está organizado

```
reels.mjs                  el motor: formato, zona segura, piezas, reloj y cortinilla
escena.mjs                 las escenas de los reels, en SVG y con la paleta del sistema
sonido.mjs                 sintetiza los efectos de sonido, sin archivos de audio
render.mjs                 captura la animación y la monta en MP4
reel-<slug>/gen.mjs        un reel: sus cinco láminas y sus tiempos
reel-<slug>/reel.html      la animación, con seek(t) para renderizarla
reel-<slug>/sfx.wav        los efectos de sonido, generados junto a la animación
reel-<slug>/*.dc.html      las cinco láminas quietas, para revisar el texto en canvas
```

La carpeta lleva el prefijo `reel-` porque un mismo artículo puede tener carrusel y reel, y
los dos escriben `canvas.json`.

```bash
cd reel-<slug>
node gen.mjs                            escribe reel.html, sfx.wav, las cinco láminas y canvas.json
node gen.mjs --sucesos                  además, lista cada efecto de sonido con su segundo
node ../render.mjs --stills=3,2@1.5     capturas sueltas: el segundo 3 y la lámina 2 a 1,5 s
node ../render.mjs --desde=4 --hasta=6  sólo ese tramo, en tramo-4-6.mp4
node ../render.mjs                      reel.mp4 + portada.png
```

`reel.html` abierto en el navegador se reproduce en bucle y trae una barra para arrastrar el
tiempo. Es la forma rápida de ver si el ritmo aguanta. El sonido empieza con el primer clic
en la página, porque Chrome no reproduce audio antes de un gesto de quien la mira.

## Formato

**1080 × 1920 px de maqueta y 1440 × 2560 px de salida.** Todo se diseña en píxeles CSS de
1080 × 1920, y el render captura con un factor de escala de 4/3. Es la resolución que
recomienda la guía de Meta para Reels
(https://www.facebook.com/business/ads-guide/update/video/instagram-reels). El texto se
rasteriza a esa resolución y no se amplía después, así que la maqueta, la zona segura y las
comprobaciones de desborde son las mismas que a 1080.

Dentro del lienzo hay una zona segura de la que no sale nada legible:

```
 300 px arriba      la cabecera de la aplicación
 420 px abajo       el nombre, la descripción y el audio
 120 px a los lados los botones de la derecha
─────
 840 × 1200 px disponibles
```

Es el mismo aprendizaje que llevó el carrusel del 4:5 al cuadrado, aplicado al vídeo: lo que
se diseña contra el borde lo tapa Instagram. La cabecera y el pie del reel **no** van
pegados al borde del lienzo como en el carrusel, sino al borde de esa zona segura. El fondo
sí llena los 1920 px.

La misma guía de Meta pide dejar libres el 14 % superior, el 35 % inferior y el 6 % de cada
lado. Esas cifras son para anuncios, que ponen un botón de llamada a la acción encima del
vídeo. Un reel publicado desde el perfil no lo lleva, y la zona segura se queda como está.

## Estructura y tiempo

Las cinco láminas del carrusel, cada una desplegada en dos o tres tiempos: primero el
titular, después el apoyo, y en la lámina de la lista un punto cada vez. Una enumeración que
aparece entera de golpe no se lee, se salta.

En `gen.mjs`, el cuerpo de una lámina ya no es una cadena sino una lista de pares `[segundo,
bloque]`, y `hold` dice cuánto se queda quieta con todo dentro. El reloj sale de ahí: nadie
escribe la duración total.

| | Segundos | Qué es |
|---|---|---|
| Primer bloque | 0 – 0,15 | en la lámina 1, el segundo 0; en las demás, mientras cruza la cortinilla |
| `hold` | 1,4 – 2,6 | desde que empieza a entrar el último bloque hasta que empieza la cortinilla |
| `XF` | 0,5 | la cortinilla |
| Palabras del titular | 0,07 · 0,45 | el retraso de cada palabra respecto a la anterior, y lo que dura su entrada |
| Cifra | 0,9 | lo que tarda en contar hasta su valor |
| `tail` | 2,4 | la cola del final, para leer el enlace y guardarlo |

**Una lámina entra con una cortinilla.** La nueva barre de izquierda a derecha con un borde
nítido y tapa a la anterior, que sigue entera debajo. Sustituye al fundido de los dos
primeros reels, que tenía dos defectos. Entre un fondo casi negro y uno blanco, el fundido
pasaba durante medio segundo por un gris sin texto: en el vídeo de envenenamiento es el
cuadro del segundo 4,8. Y obligaba a que el texto se fuera antes que el fondo, porque
cruzando los dos a la vez se leían dos titulares superpuestos. Con el borde, ningún cuadro
mezcla las dos láminas, y el texto viejo se queda hasta que el borde lo tapa.

**La cabecera y el pie se parten en el borde.** Hay una copia por lámina, con su tono y su
color de texto. Durante la cortinilla, la copia de la lámina que entra se recorta hasta el
borde y la de la que sale, desde el borde. El dominio se lee en tinta sobre el blanco y en
blanco sobre el color, partido justo donde cambia el fondo, y nunca hay dos copias
superpuestas.

**La primera lámina no espera.** Lo que tiene `at: 0` en la lámina 1 está completo en el
primer cuadro, sin animación de entrada. Es el cuadro que ve quien pasa por el reel antes de
decidir si se queda. En el primer reel ese cuadro era el fondo con la cabecera, porque el
titular entraba en el segundo 1,2.

**Lo que entra con la cortinilla ya está entero cuando el borde lo descubre.** De la lámina
2 en adelante, un bloque que entra antes de que termine la cortinilla no hace fundido, salvo
los titulares, que entran por palabras. Con fundido, una escena oscura a media opacidad
sobre una lámina blanca se veía como un rectángulo gris mientras el borde la descubría.

**Los halos derivan con el tiempo de su lámina**, no con el del reel. Así el estado de una
lámina no depende de cuánto duraron las anteriores, y una captura `2@1.5` señala siempre el
mismo cuadro.

## Qué contar en un reel

Las siete reglas de contenido siguen valiendo enteras, y la primera —que cada lámina se
entienda sola— es la que más aprieta aquí: en el carrusel se puede volver atrás, en el reel
no. Encima de esas siete hay cuatro más, y cada una costó una versión entera del primer reel.

**Un reel enseña, no informa.** La primera versión abría con una medición —el 45 % de
Veracode— y gastaba dos láminas en explicar por qué el código generado sale inseguro. No
funcionaba: una cifra hay que leerla y entenderla, y en el feed no hay tiempo para ninguna
de las dos cosas.

**Pero contar sólo el efecto se queda corto.** La segunda versión cambió las cifras por
frases llanas —«cambias un número en la URL y ves la factura de otra empresa»— y quedó
vaga: quien programa no reconoce el fallo hasta que ve la línea. Lo que funciona es el
código en pantalla, y al lado el código que lo cierra. La explicación pasa a ser una sola
frase entre los dos bloques.

**Las que se enseñan son las reconocibles, no las más graves.** La gravedad se ordena en el
artículo. En el feed hay que elegir las que cualquiera que programe identifica de un
vistazo, y descartar tanto las demasiado específicas —una referencia directa a objeto
insegura— como las que suenan improbables —un paquete alucinado—, aunque las dos estén
medidas y documentadas.

**El tono es el de una revisión de código, no el de una alerta.** Voz neutra en los
titulares: «la clave queda escrita en el código», no «deja la clave escrita». Nada de «sin
avisar» ni «sin que nadie lo vea». Y las frases se escriben enteras: recortarlas hasta
dejarlas en acciones sueltas —«cualquiera ve la clave, hay que cambiarla»— quita tanto como
alargarlas de más.

De ahí sale la estructura que usan los reels: **gancho que promete una cantidad, tres
láminas que la entregan con su código, cierre que invita al artículo**. El cierre no
enumera lo que falta: una reflexión y la dirección del blog bastan, y lo demás es la razón
para abrir el artículo.

## Qué cambia respecto al carrusel

- **La escala sube.** Titular de portada 96 px, interior 64, párrafo 34, cifra 172, punto de
  lista 37. El lienzo es igual de ancho, pero lo que en una lámina fija se puede releer,
  aquí pasa una sola vez.
- **El contador «03 / 05» se sustituye por una barra de cinco segmentos** que se van
  llenando. Dice lo mismo y además dice cuánto queda, que es lo que decide si alguien se
  espera.
- **El titular entra palabra a palabra.** `reel.html` parte cada `h1` y `h2` en palabras al
  cargar, sin tocar su marcado: un `span` de color se parte por dentro y un `code` cuenta
  como una sola palabra, porque tiene fondo. Los espacios siguen siendo texto, así que los
  cortes de renglón son los mismos que en las láminas quietas del canvas, que no se parten.
- **La cifra lleva su frase debajo, no al lado,** porque a lo ancho sólo quedan 840 px.
  Además cuenta desde cero hasta su valor, con coma decimal. Su ancho queda fijo en el del
  valor final, para que el signo y el `%` no se muevan mientras cuenta. El número se escribe
  con caracteres (`−17`) y no con entidades numéricas, o se tomarían los dígitos de la
  entidad.
- **El pie no dice «Desliza».** Va vacío hasta la última lámina, donde aparece «Enlace en la
  biografía».
- **Los halos derivan.** Muy despacio, unos 45 px. Es lo único que se mueve cuando el texto
  ya entró, y lo que evita que la lámina parezca una foto fija durante tres segundos.
- **El bloque de código se escaló primero aquí.** Desde la campaña existe también en
  `sistema.mjs`, con el mismo aspecto y un límite de 56 columnas en lugar de 52, porque el
  carrusel no descuenta zona segura. La descripción que sigue vale para los dos: etiqueta en
  monoespaciada (CÓDIGO GENERADO, CORRECCIÓN) y el panel debajo, con el trozo culpable en el
  color de acento. Se gana el sitio porque en un reel para gente que programa el código ES
  el contenido. Se probó como ventana de terminal, con su barra y sus tres círculos, y se
  descartó: lo que va dentro es código fuente y no una sesión de consola. Las ligaduras van
  desactivadas, o `!==` se dibuja como un solo signo tachado que de pasada no se reconoce.
- **En el reel, el código se escribe.** Cuando entra el bloque, los renglones se escriben
  uno detrás de otro a 28 caracteres por segundo, y ningún bloque tarda más de 1,4 s: a
  velocidad fija, uno largo se comería el tiempo de lectura de la lámina. Los renglones
  existen desde el principio con su alto, así que el bloque no cambia de tamaño mientras se
  escribe. Lo que va entre `<b>` recibe un resaltado que lo barre cuando el tecleo pasa por
  su final. El ancho que se descubre se redondea a caracteres enteros: con uno fraccionario
  asomaba medio carácter, que de pasada se leía como un cursor.
- **Las frases largas llevan `text-wrap: pretty`.** En una columna de 840 px, sin eso los
  puntos de la lista dejan una palabra sola en la última línea.

## Escenas

`escena.mjs` dibuja las escenas de los reels. Todo en SVG y HTML con la paleta de
`sistema.mjs`: ninguna imagen viene de fuera y no hay dependencias nuevas.

**Planas.** El primer intento fue isométrico y se descartó entero. En isométrico un texto
hay que fingirlo con barritas, y una terminal sin su comando no cuenta nada. La profundidad
obliga a resolver a mano qué tapa a qué, porque no hay z-buffer. Y a tamaño de miniatura,
que es como se ve un reel, el volumen no aporta nada que la silueta no diga ya. En plano
cabe el comando escribiéndose de verdad y el orden de dibujo es el orden de las capas.

**Cada lámina tiene su propio escenario.** Repetir un mismo fondo hacía que el reel pareciera
detenido aunque el texto avanzara: el fondo decía «seguimos en el mismo sitio» mientras la
historia decía lo contrario.

**Dos familias visuales y nada más.** La silueta (figura y portátil, recortados contra la
luz) y el panel (un rectángulo redondeado con su barra, que sirve de terminal, de editor, de
conversación y de navegador). Que las escenas del medio compartan panel es lo que las hace
parecer capítulos de una historia y no dibujos sueltos. **El cierre no lleva escena**, como
en los demás reels.

**El texto explica la escena y no la repite.** El titular nombra lo que se ve y el apoyo añade
lo que la imagen no puede dar: quién lo escribe, qué versión, qué incidente. Si la lámina
enseña una terminal instalando, el titular no describe la instalación: dice qué significa.

**La silueta se juzga en miniatura.** La primera, `escenaAtacante`, dibujaba la figura de
frente, detrás de la tapa del portátil vista por detrás. A tamaño real se entendía. Reducida
a 270 px de ancho, que es como aparece en la rejilla del perfil, se leía como un arco con
una caja delante, porque la tapa ocultaba el cuerpo entero. `escenaFigura` la sustituye, y
sus variantes se compararon en una hoja de miniaturas antes de usarlas:

- **De perfil** la figura mira a la pantalla. El perfil de la cara, el brazo con su codo y
  la mano sobre el teclado indican que alguien escribe a cualquier tamaño, y la luz de la
  pantalla le da de frente.
- **La capucha** se reconoce por tres rasgos que un casco no tiene: la visera que sobresale
  por delante de la frente, la cara hundida debajo de ella y la tela que cae hasta los
  hombros sin dejar ver el cuello. La primera capucha de perfil era una cúpula lisa y en
  miniatura se leía como un casco.
- **Sin capucha** sólo existe de perfil. De frente, una cabeza sin rasgos sobre unos hombros
  se lee como el icono de usuario que ya se había descartado.
- **De frente** (`vista: 'frente'`) el portátil va más bajo, para que se vean los hombros,
  los dos brazos y la abertura iluminada de la capucha.

`escenaAtacante` se conserva sólo para poder regenerar el reel publicado.

**Dentro de un panel, el acento es siempre el claro.** Sobre el fondo de la lámina el acento
cambia: es el claro en las láminas oscuras y el tono base en las blancas. Pero el panel es
oscuro en las dos. Con el acento de la lámina dentro del panel, lo único que la escena
señalaba (`EJECUTADO.txt`, `npm ci`) quedaba a 2,3:1 en petróleo y a 1,9:1 en ciruela.
`build()` mide ahora ese par, el blanco sobre el tramo claro del degradado y el gris del
párrafo sobre blanco, y falla por debajo de 4,5:1 antes de que haga falta renderizar nada.

**El panel mide lo que mide su contenido.** Con un alto fijo de 380 px, una terminal de
cinco renglones dejaba un hueco vacío debajo.

**La cámara se acerca un 4 % a lo largo de la lámina.** Es lenta a propósito: mueve la
escena cuando el texto ya entró, sin que el movimiento se perciba como tal. No lleva
`will-change`, para que Chrome vuelva a rasterizar el texto del panel a su tamaño en cada
cuadro en lugar de ampliar una imagen ya hecha.

**Variantes del panel.** `escenaChat` escribe una petición y hace aparecer la respuesta.
`escenaDiff` tacha con una línea que barre los renglones que se quitan y escribe en acento
los que se ponen. `escenaNavegador` escribe una dirección en su campo y enseña el estado y
la respuesta. Cada una tiene un límite de columnas por renglón, 39 en la conversación y 43
en el editor, y pasarse no avisa: el panel recorta en silencio.

**La variante `noche`.** Hay una tercera clase de lámina además del degradado y el blanco: casi
negra, para que la escena sea la única fuente de luz. La usa la primera lámina del reel de
envenenamiento, donde la silueta no se dibuja sino que se recorta contra el brillo del
portátil. Los halos bajan a una décima parte de su opacidad, y el tono sigue mandando en el
acento aunque no esté en el fondo.

**El movimiento sale de variables CSS.** `seek(t)` escribe en cada lámina `--s`, los
segundos dentro de ella, y `--p`, ese mismo tiempo de 0 a 1; y en cada bloque escribe `--b`,
los segundos desde que entró. Las escenas se animan con `calc()` sobre ellas. Ni animaciones
CSS ni reloj propio: el render captura cuadro a cuadro y cualquier animación con reloj
propio saldría distinta en cada máquina. El tecleo se hace con el ancho en unidades `ch` y
`overflow:hidden`, por lo mismo. Las láminas quietas del canvas llevan `--s:30` y `--b:30`
fijos, para que todo esté en su estado final. Un cursor que va detrás de un texto que
aparece empieza en el mismo segundo que ese texto: antes parpadeaba solo, a media línea, sin
texto delante.

**Lo que se descartó por el camino**, para no repetirlo: objetos en blancos translúcidos, que
sobre el degradado se perdían unos dentro de otros; una figura hecha de círculo y campana, que
se leía como un icono de usuario; brazos sin codo, que parecen señalar y no escribir; y llaves
saliendo del panel de credenciales, que dentro del ancho de la lámina no tenían sitio fuera de
él y caían encima del texto.

## Sonido

`sonido.mjs` sintetiza los efectos con ruido filtrado y senos. No hay archivos de audio ni
dependencias, y el azar sale de un generador sembrado con el título del reel, así que el
mismo reel suena siempre igual.

Son tres, y los tres acompañan algo que ya se ve:

| Efecto | Cuándo suena | Qué es |
|---|---|---|
| `tecla` | un carácter que se escribe | ruido filtrado en banda en torno a 2,6 kHz, con una caída de 4 ms; entre dos golpes pasan al menos 70 ms |
| `barrido` | la cortinilla | ruido con un paso bajo que abre y cierra, paneado de izquierda a derecha con el borde |
| `marca` | el resaltado o el tachado | un seno de 1,2 kHz que dura 90 ms |

Los instantes no se escriben a mano. `teclea()` y el bloque de código marcan lo que escriben
con `data-sfx="tecla"`, su segundo y su velocidad; el resaltado y el tachado, con
`data-sfx="marca"`. `build()` los lee al generar, suma el inicio de cada cortinilla y
escribe `sfx.wav`. Lo que empieza cuando la lámina ya está tapada no suena, porque tampoco
se ve. `node gen.mjs --sucesos` lista cada efecto con su segundo, y `sonido: false` en
`build()` genera el reel sin efectos.

**Cada golpe suena cuando su carácter ya se ve.** El ancho de un renglón que se escribe se
redondea hacia abajo a caracteres enteros, así que el carácter k aparece en
`t0 + (k + 1) / v` y ahí coloca `sonido.mjs` su golpe. El primer horario lo colocaba en
`t0 + k / v`, un carácter antes, y medido cuadro a cuadro el sonido se adelantaba a la
imagen entre 28 y 92 ms a 30 cps, y entre 23 y 75 ms a 60, por encima de los 45 ms a partir
de los cuales se nota un audio adelantado (ITU-R BT.1359). Ahora se adelanta como mucho un
cuadro, igual que la marca del resaltado: de 0 a 33 ms a 30 cps y de 0 a 17 ms a 60. En
`sfx.wav`, cada golpe empieza a menos de medio milisegundo de su instante.

**Van bajos a propósito.** La música se sigue eligiendo en la aplicación y tiene que quedar
por encima. El pico se limita a −7 dBFS. En el reel de envenenamiento el pico real mide −7,7
dBFS y la sonoridad integrada, −24,1 LUFS:

```bash
ffmpeg -i reel.mp4 -vn -af ebur128=peak=true -f null -
```

Al publicar el primer reel con efectos se comprueba en el editor de Instagram que el audio
original sigue sonando al añadir la música, y se anota aquí el volumen que se usó.

## Cómo se renderiza

La animación no se graba en tiempo real. `reel.html` expone una función `seek(t)` que coloca
todo lo que hay en pantalla a partir del segundo que se le pase, sin animaciones CSS y sin
reloj propio, y `render.mjs` la llama cuadro a cuadro, captura la pantalla y se la pasa a
ffmpeg por una tubería. El vídeo sale idéntico en cualquier máquina y no depende de que el
portátil vaya sobrado mientras renderiza.

Chrome se conduce por el protocolo de DevTools sobre un WebSocket, que Node ya trae; no hace
falta Puppeteer. ffmpeg viene de `ffmpeg-static`, instalado en este directorio.

```bash
node ../render.mjs --outdir=v2        todo lo que escribe, en otra carpeta
node ../render.mjs --fps=60           cuadros por segundo del vídeo (30 por defecto)
node ../render.mjs --dsf=1            factor de escala (4/3 por defecto, que da 1440 × 2560)
node ../render.mjs --workers=5        procesos de Chrome en paralelo
node ../render.mjs --cuadros=dir      vuelca los PNG sin codificar
node ../render.mjs --dry              sólo comprueba que nada desborda y escribe la portada
```

Lo que importa de cada paso:

- **El tamaño se fija con `Emulation.setDeviceMetricsOverride`** y un `deviceScaleFactor` de
  4/3, no con `--window-size`. Es lo único que garantiza un cuadro exacto y sin banda. El
  render lee la cabecera del primer PNG y se detiene si no mide 1440 × 2560.
- **Se espera a `REEL.ready`** antes del primer cuadro. Se cumple con las fuentes cargadas,
  pedidas por su nombre, y el DOM preparado: los titulares partidos en palabras y el ancho
  de las cifras fijado. `document.fonts.ready` sólo espera a las fuentes que ya empezaron a
  descargarse, y sin fuentes el vídeo entero sale con la tipografía de reserva.
- **Varios Chrome en paralelo.** Cada trabajador es un proceso propio y captura uno de cada
  N cuadros; un búfer los reordena antes de pasarlos a ffmpeg. Con 1 y con 5 trabajadores,
  los 60 cuadros de un tramo de un reel salen idénticos byte a byte; en el laboratorio de
  personajes no pasa, ver «Personajes». La captura pide
  `optimizeForSpeed`, que comprime menos el PNG. Con un solo trabajador y a 1080 × 1920, el
  render sale a 5,5 cuadros por segundo; el anterior tardaba unos seis minutos en 22 s de
  vídeo.
- **El color se convierte con la matriz BT.709 y el vídeo lo declara.** Sin eso, ffmpeg
  convierte con BT.601 y no etiqueta nada, y un reproductor que asume BT.709, lo normal en
  HD, desplaza los tonos: el índigo `#4759ed` se ve `#435ef3`. En el reel de envenenamiento,
  los píxeles del vídeo leídos como BT.709 quedan a ±2 por canal de la captura de Chrome.
- **CRF 16 con `aq-mode=3`.** Los dos primeros reels salieron a CRF 18 y a unos 1 Mb/s, y
  x264 convertía en bloques los anillos de los halos oscuros. `aq-mode=3` reparte más bits a
  las zonas oscuras y lisas; el vídeo sale a unos 5,8 Mb/s. El nivel H.264 lo elige x264,
  porque el 4.1 fijo de antes no admite cuadros de 1440 × 2560: sale 5.0 a 30 cps y 5.1 a
  60.
- **Tramado.** Un halo con 170 px de desenfoque sobre un fondo casi negro recorre muy pocos
  niveles de gris, y en 8 bits se dibuja en anillos que ya están en la captura de Chrome,
  antes de codificar. Una capa de ruido binario al 0,8 % de opacidad mueve cada píxel un
  nivel arriba o abajo. Medido, la desviación es de 1,0 niveles y la media se desplaza +0,94
  niveles sobre la noche y −1,05 sobre el blanco. A simple vista no se distingue, pero el
  borde de cada anillo deja de ser una línea continua. Es estática, para que el codificador
  no tenga que describir un ruido distinto en cada cuadro. No elimina los anillos: con el
  contraste amplificado siguen ahí, ya sin escalones de bloque, y cómo quedan tras la
  recompresión de Instagram se comprueba en el teléfono.
- **El audio sale de `sfx.wav`**, en AAC a 192 kb/s y 48 kHz. Sin él, el MP4 lleva una pista
  muda: hay versiones de Instagram que rechazan un vídeo sin audio.
- **El progreso sólo se reescribe en su renglón cuando hay una terminal delante.** Sin ella
  sale una línea cada 10 %. Un reel del motor anterior se colgó 41 minutos en segundo plano,
  con el progreso escrito cuadro a cuadro y nadie leyendo la tubería. Hasta comprobar que el
  cambio lo evita, en segundo plano se redirige a un archivo: `node ../render.mjs >
  render.log 2>&1`.
- **La portada sólo la escriben el render completo y `--dry`.** Una captura suelta o un
  tramo no deben pisar la portada de un reel ya publicado, y para lo mismo sirve `--outdir`.

Salen `reel.mp4` y `portada.png`, que es el cuadro del segundo 2,4 y lo que se ve en la
rejilla del perfil antes de que nadie le dé al play.

Tiempos medidos con el reel de envenenamiento, de 25,6 s, en un Ryzen 9 6900HX de 16 hilos:

| Factor de escala | cps | Trabajadores | Render |
|---|---|---|---|
| 1 | 30 | 1 | 142 s |
| 4/3 | 30 | 5 | 77 s |
| 4/3 | 60 | 5 | 137 s |

Con 3 trabajadores el render es más lento y con 8 no mejora sobre 5, que es el valor por
defecto.

**30 o 60 cuadros por segundo.** A 30 cps el borde de la cortinilla salta hasta unos 120 px
de un cuadro al siguiente, y a 60 salta la mitad; el render tarda algo menos del doble. El
valor por defecto es 30 mientras no se hayan comparado los dos vídeos en el teléfono.

## Cómo se revisa

Igual que un carrusel: `gen.mjs` escribe también las cinco láminas quietas y su
`canvas.json`, y el texto se corrige ahí. **El vídeo se renderiza cuando el texto está
aprobado**, no antes.

Lo que no necesita el vídeo entero:

- `--stills=2@1.5` captura la lámina 2 al segundo 1,5 de haber empezado. Cuenta desde la
  lámina, así que sigue señalando el mismo momento aunque cambie la duración de las
  anteriores.
- `--desde=4 --hasta=6` renderiza sólo ese tramo, con su sonido, para ver un cruce en
  movimiento.
- `--cuadros=<dir>` vuelca los PNG sin codificar.
- Una escena nueva se prueba antes en una carpeta `prueba-<algo>/`, que git ignora, y se juzga
  reducida a 270 px de ancho, que es como se ve en la rejilla del perfil.

## Reels publicados

| Carpeta | Artículo | Ángulo | Tonos | Duración |
|---|---|---|---|---|
| `reel-revisar-codigo/` | Siete cosas que revisar en el código que genera tu IA | tres vulnerabilidades con su código y su corrección: la clave escrita, la inyección SQL y el endpoint abierto | naranja profundo · magenta · ciruela | 30,7 s |
| `reel-envenenamiento/` | npm vs pnpm: qué cambia en la seguridad al instalar | la cadena entera: el script que trae el paquete, la instalación que lo ejecuta, lo que ese permiso alcanza, la línea que lo cierra y el cierre | azul petróleo · ciruela · índigo | 26,8 s |

`reel.mp4` y `portada.png` de las dos carpetas son los vídeos publicados, renderizados con
el motor anterior, que se borró el 16 de septiembre de 2026 (está en el respaldo de ese día). Los
`gen.mjs` generan ya con el motor nuevo. `reel-envenenamiento/v2/` y `v2-60/` guardan el
mismo reel renderizado con él a 30 y a 60 cps, para compararlo; no están publicados.

# Personajes

Laboratorio de personajes 2D animados, separado de los reels. Son 33 acciones sobre un fondo de
un solo color: sin halos, desenfoques, tramado, cámara ni transiciones, y con un corte seco entre
una acción y la siguiente. Los reels todavía no lo usan; lo que se elija de aquí se llevará a
`escena.mjs` y a `seek()` en una fase aparte.

Hay dos personajes. **El hombre** sale de un kit de Freepik, va a color y de cuerpo entero: son
las acciones 01–25. **El encapuchado** es ese mismo cuerpo con sudadera con capucha y sin cara, de
busto y sin piernas, en cuatro variantes —black, blue, red y white hat— que solo se diferencian
por el color: son las 26–33, dos acciones por cuatro sombreros.

Dos intentos anteriores de encapuchado están descartados. El primero movía cinco grupos con senos
a partir de la silueta de los reels, y sin halo ni luz de pantalla era una mancha negra; está
estaba en `personajes/v1/`, borrado el 16 de septiembre de 2026. El segundo le ponía una capucha de perfil dibujada en código, y se
leía como un pañuelo de cabeza por cuatro motivos, tres de ellos medibles: la capucha salía del
mismo color que el torso (1,00:1) y la manga a 1,07:1, cuando la regla pide 1,5:1 entre piezas
vecinas; la caída se hinchaba por detrás del cuello en vez de caer sobre los hombros; el hueco de
la cara iba en tinta plana, sin rasgos ni mandíbula; y solo existía de perfil, con lo que de las
28 acciones el personaje podía hacer 3.

## Cómo está organizado

```
curvas.mjs                   curvas, muelle y azar sembrado
personaje.mjs                el rig: huesos, IK, secuencias de poses, principios y ciclo de paso
kit.mjs                      lee el SVG de Illustrator, extrae piezas por ruta y las inspecciona
personajes/gen.mjs           escribe personajes.html, muestras.json y revision.html
personajes/figuras.mjs       qué figura lleva cada acción; lo usan gen.mjs y comprueba.mjs
personajes/sombreros.mjs     los cuatro arquetipos y su paleta; lo usan figuras.mjs y las acciones
personajes/ayudas.mjs        las funciones de página de las acciones: dePie, vivo, teclea…
personajes/acciones/         las acciones, una lista por bloque; gen.mjs las carga todas
personajes/kits/hombre.mjs   el mapa del kit: rutas, pivotes, huesos y capas de cada vista
personajes/kits/encapuchado.mjs  el encapuchado: cuerpo, manos y capucha de una sola lámina
personajes/kits/hombre.svg   copia del kit; solo en disco, no se versiona
personajes/kits/inspeccion/  capturas numeradas y cajas.json de cada ruta inspeccionada
personajes/referencias/      las láminas de hacker de las que sale la forma de la capucha
personajes/accesorios.mjs    silla, mesa y portátil
personajes/comprueba.mjs     comprobaciones del rig y de las acciones, sin navegador
personajes/tira.mjs          tiras de cuadros de una acción
personajes/hoja.mjs          hoja de miniaturas
personajes/lamina.mjs        la lámina de los cuatro sombreros enteros
```

## Comandos

```bash
cd personajes
node gen.mjs                  personajes.html y muestras.json
node gen.mjs --revision       revision.html: fondos, tubos o segmentos, vistas, manos, una lámina
                              por sombrero y las mangas
node gen.mjs --sin-rotulo     sin el número y el nombre de cada acción
node gen.mjs --huesos         con los huesos a la vista
node comprueba.mjs            IK, codos de las acciones, ciclos de paso, secuencias, colores y contraste
node tira.mjs 3 4             18 cuadros repartidos de cada acción, en out/tiras/
node hoja.mjs                 hoja de miniaturas; con --final, el último cuadro de cada acción
node hoja.mjs --columnas=4    la hoja de sprites: un sombrero por columna, una acción por fila
node lamina.mjs               los cuatro sombreros enteros en out/lamina-sombreros.png
node lamina.mjs --rostros     el hueco de la cara con y sin párpados, de cerca y al tamaño del vídeo
node ../render.mjs --in=personajes.html --outdir=out --fps=60 --out=personajes.mp4 > out/render.log 2>&1
node ../kit.mjs inspecciona kits/hombre.svg front_stand/4
```

En el navegador, con `node ../serve.mjs` y `http://127.0.0.1:4599/personajes.html`, hay tres
ayudas que no salen en el render:

- `h` enseña los huesos y sus pivotes, con el codo en rojo si queda al revés.
- `c` enciende el papel cebolla: la pose uno, dos y tres dibujos antes y después.
- `t` dibuja la trayectoria de las manos y los pies durante toda la acción.

`?cebolla` y `?trayectorias` las encienden al cargar, y `?t=12.5` abre la página parada en ese
instante.

## El rig

**Huesos con matriz propia.** Cada hueso tiene un padre y la posición de su pivote en
coordenadas del dibujo. Las matrices del mundo se calculan en JavaScript y cada pieza recibe su
`transform="matrix(…)"`, sin grupos anidados. Los tubos y la IK necesitan saber dónde queda cada
articulación, y el orden de dibujo no coincide con la jerarquía: el brazo del fondo cuelga del
torso, pero se dibuja detrás de él.

**Tres tipos de capa.**

- Pieza: un fragmento del dibujo atado a un hueso, con su pivote llevado al origen.
- Ranura: variantes de una pieza, como las cabezas o las manos. La pose elige cuál se ve.
- Tubo: un trazo de una articulación a la siguiente, con el ancho y el color del kit. Los brazos
  y las piernas son tubos, así que se doblan sin juntas.

**IK.** Es analítica, de dos huesos, con la ley de los cosenos, y se resuelve en el marco del
padre de la cadena. El sentido del codo se elige. Un objetivo fuera de alcance deja la
extremidad extendida hacia él, y un peso mezcla la IK con la pose de FK. En las piernas de
frente la cadena es `recta`: en vez de doblarse, se acorta, porque una rodilla doblada hacia un
lado se lee como una pierna rota. El ángulo del último hueso se puede fijar en el mundo, y así el
pie queda plano aunque la pierna gire.

**El codo va hacia fuera.** De frente, el brazo en reposo ya trae el antebrazo girado hacia el
centro, unos 20° entre el pivote del kit y `dePie`, y con el brazo abajo eso es correcto. Si una
acción alza el brazo solo con `brazo.r`, esa flexión se conserva, y por encima de la horizontal
aleja el antebrazo de la cabeza: el codo queda hacia dentro. Con el brazo alzado, el antebrazo tiene
que girar hacia la cabeza y, en la subida, llegar a su clave antes de que el brazo cruce la
horizontal. `codo()` mide dónde queda el codo y `codoAlReves()` aplica la regla:

- De frente, de ¾, sentado y de espaldas, con la muñeca por encima del hombro, el codo no puede caer
  del lado del cuello. Con el brazo abajo no se exige, porque al encogerse de hombros con las palmas
  arriba el codo cae ahí de forma natural.
- De perfil, el antebrazo no puede pasar de recto hacia atrás. Con el brazo sobre la cabeza la mano
  va detrás y el codo delante, y eso es correcto.

`comprueba.mjs` evalúa las 28 acciones a 60 cps con esa regla, y la tecla `h` pinta en rojo el codo
que la incumple.

**El pulgar va al lado que toca.** Las catorce manos sueltas del kit están dibujadas como la mano
izquierda del personaje: con la palma hacia quien mira el pulgar les queda a la izquierda
(`abierta`, `ok`, `paz`) y el puño lleva el pulgar cruzado por el lado derecho. La de saludar sale
del brazo 0 de `arms`, y esa es la derecha, porque ese brazo es el derecho del personaje. Cada gesto
lo declara en `mano` y la mano se refleja en el brazo que no coincide: de frente, de ¾ y sentado, en
el brazo `_d`; de perfil y de espaldas, en el del fondo. La mano de reposo no se toca, porque esa la
dibujó el kit para su brazo.

De perfil el personaje mira a la izquierda, así que quien mira le ve el costado izquierdo: el brazo
cercano es el izquierdo del personaje y el del fondo, el derecho. Al teclear, las dos manos ya no son
el mismo dibujo repetido.

Reflejar una mano mueve su silueta, así que la pose que la sujetaba puede necesitar otro giro de
muñeca. Pasó en 07: con la mano de la barbilla al derecho, los 180° de antes la escondían detrás de
la mandíbula, y a 140° el índice vuelve a subir por la mejilla.

**Poses.** Una pose es un objeto plano de canales: `torso.r`, `cadera.y`, `ik.brazo_d` con su
peso, `cabeza`, `mano_i`, `ojos` o `vista`.

- `secuencia` interpola poses clave con la curva de la clave de llegada: `suave`, `sale`,
  `entra`, `escalon`, una Bézier, un muelle que rebasa y llega exacto a su clave, o un arco para
  los objetivos.
- `sumar` apila capas: multiplica escalas y ojos, sustituye textos y pesos, y suma el resto.
- `mezcla` pasa de una pose a otra, como de un ciclo de paso a la postura de pie.
- Los principios son operadores: `anticipa`, `arrastra`, `aplasta`, `desfasa`, `enDos`,
  `respira`, `parpadea` y `ruido`.

**Ciclo de paso.** `camina` deja fijo en el suelo el pie que apoya y lo hace girar sobre el
talón al tocar y sobre la puntera al despegar. Con `corre` hay vuelo y la cadera baja durante el
apoyo; con `puntillas`, el talón no llega a bajar.

**Toda pose es función pura del tiempo.** El render reparte los cuadros entre varios Chrome, así
que nada guarda estado entre dos `seek`. El arrastre pide la pose en `t − δ`, el azar sale de una
semilla y el muelle es su fórmula cerrada. Es lo que permite el papel cebolla y las trayectorias.

**Contrato de serialización.** Las páginas se abren por `file://`, donde Chrome no carga módulos
ES. `curvas.mjs` y `personaje.mjs` exportan fábricas que no leen nada de su módulo, y la página
las recibe como `const U = (${curvas})(); const P = (${personaje})(U);`. Las funciones `prep` de
las acciones viajan igual y solo usan los globales de la página. Node importa las mismas fábricas
para `comprueba.mjs`.

## El kit

El hombre sale de un kit de creación de personaje de Freepik (`14475313_2021flat_27.svg`). Trae
el mismo personaje en seis vistas, seis cabezas con expresión, catorce manos y cinco brazos
sueltos, en grupos de Illustrator sin nombre ni pivotes. `kit.mjs` extrae cada pieza por su ruta
de índices, como `front_stand/4`, la separa por color dentro de su grupo y la recolorea por
papeles. `node ../kit.mjs inspecciona` captura cada grupo con sus hijos coloreados y numerados
sobre una rejilla y vuelca sus cajas a `cajas.json`, que es de donde salen los pivotes del mapa.

Se mapean cinco vistas: frente, ¾, perfil, espalda y sentada de frente. La sentada de perfil no
hace falta, porque sale del rig de perfil con la cadera atrás y abajo, y así sentarse es un
movimiento y no un cambio de dibujo. Del kit salen las cabezas, las manos, el torso, la cadera y
los zapatos; los brazos y las piernas son tubos. En la vista sentada de frente las piernas son una
sola pieza, porque los muslos van escorzados hacia quien mira.

**Color.** Cada uno de los 18 colores del kit tiene un papel. La piel y el pelo son fijos, y la
prenda toma la base del tono de la acción, o su acento si la base no llega a 3:1 sobre el fondo
(WCAG 1.4.11).

**Mangas.** Las mangas llevan un 10 % de tinta más que el jersey, y la del fondo de perfil, un
28 %. Con el mismo color, un brazo que pasa por delante del cuerpo desaparecía: los brazos cruzados
no se leían y, de perfil, el brazo cercano se perdía dentro del torso.

## El encapuchado

Tiene kit propio, `kits/encapuchado.mjs`, y no comparte nada con el hombre. **Cuerpo, brazos, manos y
capucha salen todos de la misma lámina**, `referencias/hacker-frente.svg` (Storyset), extraídos por
su ruta con `kit.mjs` y recoloreados por papeles. No hay ni un trazo dibujado a mano.

Se llegó aquí por descarte, y cada paso lo marcó el usuario:

1. capucha dibujada en código sobre el cuerpo del kit del hombre — «el diseño actual es muy malo»;
2. con antifaz sobre la cara del kit — «no le pongas una sonrisa, y oculta más la identidad»;
3. con la cara tapada y los ojos recortados — «el diseño del rostro es tétrico, deja un hueco»;
4. redibujada midiendo la lámina — «tienes una buena base pero no la usaste»;
5. con las rutas de la lámina sobre el cuerpo del hombre — «no heredes nada del diseño viejo»;
6. con la capucha de la lámina sobre un cuerpo de Humaaans (CC0) — «la capucha parece bien pero el
   cuerpo no». Tenía razón por dos motivos que se ven al superponerlos: Humaaans dibuja el torso en
   tres cuartos, con un brazo tendido a un lado, y la capucha es de frente; y sus proporciones son
   otras —cabeza grande, torso corto—, así que la capucha salía enorme sobre un cuerpo pequeño;
7. todo de la misma lámina — **«este diseño está excelente»**. Piezas de la misma mano encajan.

**Los brazos vienen dibujados, no son tubos.** Es lo que quita la costura que dejaba el rig contra el
cuerpo. A cambio, su pose es la de la lámina y no se puede mover: el rig anima el torso y la capucha,
y nada más.

**Una lámina, una pose.** Las cuatro acciones no cambian de pose —no pueden—, cambian de ritmo:
respira, se inclina hacia la pantalla, teclea y se echa atrás. Para poses de verdad distintas hacen
falta más láminas de la misma serie. De todo el catálogo de Storyset solo dos encajan en estilo:
`12086`, el encapuchado de espaldas, y `41299`, ante el portátil. Mapearlas es otro trabajo.

**Qué se extrae.** Las piezas 0 a 30 del grupo `Character` son el cuerpo, los brazos, las manos y sus
sombras y filos; 31 y 32, el cuello de pico; 33, la abertura; 55 y 56, la coronilla y la sombra de
dentro. Lo que queda fuera es la cara: dentro de la capucha va un vacío.

**La luz del portátil manda en el color.** La lámina pinta el torso, los brazos y la capucha del
mismo coral, y así la prenda se leía plana. Se reparte en cinco zonas y cada una lleva un tono del
mismo color, de la que da a la pantalla a la que queda más lejos de ella:

| zona | tono | por qué |
|---|---|---|
| cuello de pico | `luz` | rodea la cara: es lo que la pantalla ilumina de lleno |
| coronilla | `clara` | |
| torso | `base` | |
| brazo cercano | `media` | se adelanta al portátil, pero ya fuera del foco |
| brazo del fondo | `oscura` | |

Los saltos son de **1,18:1** —modelado, no separación de piezas, que pide 1,5:1—, y así la prenda
tiene volumen sin dejar de ser un color. La escalera elige su forma según la prenda:

- si admite subir y bajar, la base se queda en medio y hay dos pasos a cada lado;
- si es casi negra no hay pasos por debajo —entre dos colores casi negros el contraste se satura—,
  así que **sube entera** y la prenda pasa a ser la zona más oscura;
- si es casi blanca, al revés: **baja entera** y la prenda es la zona de luz.

Sin los tres casos, el black hat y el white hat salían con las cinco zonas del mismo color.

`Character/32`, la sombra que la lámina echa sobre el cuello de pico, se deja fuera: cae justo en la
zona iluminada y con ella puesta el tono de luz no se veía. La profundidad de dentro de la capucha la
dan el forro y el vacío. El resto de sombras, puños y filos de la lámina se conservan tal cual.

**Dos detalles dibujados en código.** Son lo único que no sale de la lámina, y están porque el
usuario los pidió: «falta añadirle más detalles al hueco del rostro y al pecho».

- **El bolsillo canguro.** La lámina no lo trae y el pecho se quedaba en una superficie lisa muy
  grande. Va en un negro al 9 %, no en un color de la rampa, para que el degradado siga viéndose a
  través de él: así el bolsillo se lee como un panel a la sombra y no como una mancha pegada. Se
  cuela entre el torso y las manos, que tienen que quedar por delante.
- **La luz de la pantalla dentro de la capucha.** El hueco se dibuja dos veces: el de abajo con el
  tono claro de la rampa y, encima, el mismo hueco subido 19 unidades en negro. Lo que asoma por el
  filo de abajo es una media luna, que es como entra la luz de un portátil en un capucho.

**Los párpados, y nada más.** Dentro del hueco van los dos ojos de la lámina —`Character/38` y
`39`, dos arcos de párpado— y ninguna otra cosa. No cambian ni la forma ni el color del vacío: son
una forma más dentro de él, a **1,35:1** de contraste con el negro. Es la constante `APENAS`, y es
la única pareja del laboratorio que va **por debajo** del 1,5:1 de `SEPARA`, a propósito: aquí no se
trata de distinguir dos piezas, sino de que se intuya una.

Los rasgos hay que bajarlos 33 unidades y moverlos 12 a la derecha. Sin mover caen donde la lámina
los puso —los ojos en y 198–204, las cejas en 189— y el vacío que se ve va de 210 a 282, porque se
dibuja 19 unidades por encima de la abertura y la corona y el forro van después de la ranura: los
ojos quedaban tapados enteros. Bajados, caen a un tercio de la altura del hueco, que es donde van en
una cara. Y las 12 de lado son porque la cara de la lámina está girada a su izquierda —sus ojos se
centran en x 238, no en 250— mientras que la capucha es simétrica; sin ese ajuste no se lee como una
cabeza girada, se lee como un fallo.

Se probó y se descartó, por si vuelve la tentación: la **nariz** (`Character/40`) es un trazo en «7»
dibujado para una cara a plena luz y dentro del hueco rompe la seriedad del resto; las **pupilas**
(`44` y `45`) hacen que la cara pase de intuirse a mirar, que es la dirección «tétrica» que se
descartó al principio; la **boca** (`43`) es una curva hacia arriba y se lee como una sonrisa; y la
**cara entera** (`35`) rellenando el hueco cambia su forma y su color, que es justo lo que había que
dejar como estaba. La variante `vacio` sigue en la ranura por si hay que volver atrás, y
`node lamina.mjs --rostros` compara las dos.

**Los dedos.** La lámina trae las rayas de los dedos en `#EB996E`, y estaban pintadas del color de la
mano: no se veían y las manos quedaban como manoplas. Van en `pielSombra`, un paso de 1,22:1 por
debajo de la piel.

**Las manos cuelgan de sus propios huesos.** En la lámina van dentro de la pieza del cuerpo, y con
todo junto la única forma de animar era mover el tronco. Pero el tronco se desplaza respecto a la
mesa, que está quieta, y el personaje resbalaba contra ella. Así que las dos manos —silueta y rayas
de los dedos— salen a los huesos `mano_d` y `mano_i`, con la muñeca donde acaba el puño de cada
manga.

Con eso, **las dos acciones mueven solo la capucha y las manos**: teclea, y teclea y levanta la
cabeza. El tecleo reparte las teclas entre las dos manos —las pares a una, las impares a la otra—, y
cada golpe baja su mano 5 px y la aparta un poco al lado. Los brazos no se mueven: vienen dibujados
en su pose.

**Dos acciones, no cuatro.** Hubo también «mira a un lado y a otro» y «baja la cabeza a la pantalla»,
que llevaban mesa pero no portátil. Se quitaron: el personaje es alguien atacando desde un teclado, y
sin el portátil delante la acción no cuenta eso.

**La mesa va en las dos acciones.** La lámina corta al personaje por la cintura, donde su
ilustración tenía una mesa; sin ella el corte queda al aire y se lee como un recorte. Es la excepción
a la regla 2 —accesorios solo cuando la acción no se entiende sin ellos—: aquí no explica la acción,
es parte del encuadre. Va solo el canto, con 64 px de faldón: rellena hasta abajo pesaba más que el
personaje.

**El portátil va por delante.** De frente, quien mira ve el portátil por detrás —la pantalla apunta
al personaje—, así que la tapa se interpone entre él y quien mira. Dibujado por detrás quedaba
escondido tras el torso y no se veía ni un píxel.

**La mesa y el portátil.** La mesa va del color de accesorio más oscuro que aguante 3:1 contra el
fondo —se recorre la mezcla de oscuro a claro y se toma la primera que pasa; sobre el fondo oscuro
del white hat no hay ninguna, y entonces la mezcla va hacia el blanco—.

La tapa del portátil va en un **gris neutro**, no en el color de la mesa: teñida con el fondo tomaba
el matiz del sombrero y parecía de plástico de colores. Se busca en una escalera de grises el más
oscuro que a la vez se separe de la mesa —1,4:1, que se tocan— y llegue a 3:1 contra el fondo. Con la
mesa casi tinta, el gris que cumple queda **por encima** de ella, no por debajo: una tapa más oscura
que esa mesa no se vería.

**La luz de la pantalla es un cono que se abre.** Sale estrecho por el filo de la tapa —de 430 a 650
del lienzo— y se ensancha con la distancia hasta el borde de arriba, como cualquier pantalla. A la
altura del rostro mide unos 390 px, que es lo que mide la capucha: la cara queda iluminada entera, y
por encima el cono ya desborda al personaje e ilumina el fondo. Eso es lo que hace que se lea como un
haz en una habitación y no como una mancha sobre la ropa.

Va en **una sola forma con un degradado a lo ancho**: transparente en los bordes y al 10 % en el
eje. Antes eran dos conos superpuestos, penumbra y núcleo; el alfa se suma donde se pisan y el borde
del interior se veía como una raya, o sea dos trazos de luz en vez de uno. Con el degradado, el haz
se apaga hacia los lados sin ningún canto.

Dos cosas que costaron una pasada cada una: el cono se dibujó primero **estrechándose** hacia la
capucha, para no salirse de la silueta, que es justo al revés de como se comporta una luz; y cortado
a media altura dejaba una línea recta cruzando el fondo, así que llega hasta el borde del lienzo.

Es plano y translúcido, no un halo: la regla 1 prohíbe desenfoques. Hubo también un filo del tono de
la prenda alrededor de la tapa, y se quitó: dibujaba un contorno de color sobre un objeto que es gris.

Lo que el cono remata es lo que ya hacía el degradado de la ropa, que está centrado justo donde cae
esa luz.

**El encuadre.** Lo que manda es el ancho, y no es el del torso —205— sino el de la figura con los
brazos abiertos: **403**. A 2,45 ocupa 987 px de los 1080. Con la escala puesta por el torso, los
brazos se salían del cuadro por los dos lados. La figura va centrada en el alto, como en la lámina.

## Los cuatro sombreros

`sombreros.mjs` tiene la tabla de arquetipos y `paletaSombrero`. La diferencia con el resto del
laboratorio es que aquí **la prenda es la identidad y es fija**, y lo que se elige es el fondo.

| | prenda | capucha | fondo |
|---|---|---|---|
| black hat | `#1E2233` | `#3B3F4E`, más clara | tinte claro de `petrol` |
| blue hat | `#2f3fd4` (`indigo`) | `#242E8B` | tinte claro de `indigo` |
| red hat | `#C8102E`, carmín | `#92122C` | su propio tinte al 12 % |
| white hat | `#ECEFF4` | `#C1C4CB` | `indigo` base, **oscuro** |

**El rojo no sale de `TONES`.** El sistema no tiene rojo, y `ember` (`#a3410a`) no vale: es naranja
quemado y al oscurecerlo se va a café. Medido con la mezcla del propio laboratorio, ember al 35 % de
tinta da `#713214` —el marrón que tenía la encapuchada anterior— y al 60 %, `#4D281B`. El carmín al
mismo 35 % da `#89122B` y se sigue leyendo rojo. Es la única excepción a la regla de que un tono es
un área.

**El white hat va sobre fondo oscuro.** Es la excepción a la regla 1: sobre fondo claro, un blanco
roto no llega a 3:1 por definición. Por lo mismo, el color de los accesorios se mezcla hacia la
tinta sobre fondo claro y hacia el blanco sobre fondo oscuro.

**Los saltos de tono eligen su sentido.** El de la capucha se busca hacia la tinta y se queda en el
primero que llega a 1,5:1, para que sea un cambio de tono y no otro color. En el black hat no hay
ninguno —entre dos colores casi negros el contraste se satura— y sale hacia el claro: sudadera negra
con la capucha un punto más gris, que es como la dibujan las referencias.

Sin luz, las piezas solo se separan por tono, así que la paleta se fija por contraste y no por
porcentajes. Las parejas que se comprueban son las que se tocan en el dibujo, y cada una llega a
1,5:1:

- prenda y capucha —la caída cae sobre el hombro, y la manga es del color de la capucha—;
- interior y piel, que es lo que recorta la cara contra el forro;
- capucha y piel, porque las manos salen de la manga;
- capucha y fondo, a 3:1 (WCAG 1.4.11).

Al vacío no se le pide contraste contra el forro: lo que los separa no es el tono sino la forma —el
forro asoma alrededor como el grueso de la tela—, y un vacío más claro que su propio forro no es un
vacío.

**El encuadre es un busto.** Escala 4,2 —frente al 1,42 del hombre— con la raíz en 3747, muy por
debajo del lienzo: la coronilla cae en 200 y la cadera en 2018, fuera por abajo. El recorte lo hace
el borde del lienzo. A la escala del cuerpo entero, la capucha no se ve en la hoja de
miniaturas, que es donde hay que elegir.

**Las cuatro acciones se emiten acción a acción**, los cuatro sombreros seguidos, para que
`node hoja.mjs --columnas=4` deje un sombrero por columna y una acción por fila.

**Cada figura lleva solo lo que usa.** Una acción declara sus `vistas`, `manos` y `caras`, y el
marcado no incluye nada más. Con el catálogo entero, cada acción escribiría cientos de kilobytes
de SVG que no se ven.

Seis detalles del kit que costaron una iteración cada uno:

- En reposo las piernas están estiradas del todo. La IK necesita que la cadera baje, y una
  pierna casi recta adelanta mucho la rodilla con poco que baje: de pie y de perfil baja solo 1,5
  unidades.
- La escala de una pierna `recta` va solo en su primer hueso; puesta en los dos, se aplica dos
  veces.
- El zapato trae pegada la piel del tobillo, que asomaba por detrás del pantalón al girar el pie.
  Se importa sin ella, y el tobillo es un tubo de piel.
- La cabeza de ¾ es casi la de frente, con los rasgos un poco desplazados y la sonrisa con
  dientes. Para mirar a un lado se usa la de perfil sobre el cuerpo de frente.
- Un antebrazo que apunta a quien mira se hace con `escorzo`: el hueso se acorta, se ensancha en
  la otra dirección para que el tubo no adelgace, y la mano compensa las dos escalas.
- El brazo de frente viene doblado en reposo, con el antebrazo girado unos 14,5° hacia el centro.
  Al alzarlo solo con `brazo.r`, esa flexión dejaba el codo hacia dentro (ver «El codo va hacia
  fuera»).
- Las manos sueltas del kit son la mano izquierda del personaje, y la del brazo de saludar, la
  derecha (ver «El pulgar va al lado que toca»).

## Reglas del laboratorio

1. **Solo el personaje, sobre el tinte claro del tono**: la base al 12 % sobre blanco. Sobre ese
   fondo el pelo y el pantalón quedan entre 11,2:1 y 11,6:1, y la prenda entre 5,3:1 y 7,1:1. El
   white hat es la excepción y va sobre fondo oscuro; ver «Los cuatro sombreros».
   `gen.mjs` no escribe la página si lleva `filter:`, `blur(` o `clip-path`.
2. **Accesorios solo cuando la acción no se entiende sin ellos.** Silla, mesa y portátil aparecen
   en las acciones sentadas y en las del encapuchado tecleando, en un único color plano: el fondo
   mezclado a medias con la tinta —o con el blanco, si el fondo es oscuro—, comprobado a 3:1.
3. **Escala 1,42** para el hombre: mide unos 1180 px de los 1920 del lienzo y, en la hoja de
   miniaturas, unos 285 px. El encapuchado va a 4,2, de busto y recortado por el borde del lienzo.
4. **Rótulo con el número y el nombre de la acción**, pequeño y arriba a la izquierda, para elegir
   por número. `--sin-rotulo` lo quita.
5. **Los principios van dentro de cada acción**, no en ejercicios aparte: el brazo se recoge antes
   de subir, rebasa al llegar y la cabeza llega después que el torso.

## Cómo se revisa

- `node comprueba.mjs` falla si:
  - la IK de alguna vista no alcanza sus objetivos;
  - un pie resbala mientras apoya en el paso, la carrera o el paso de puntillas;
  - una secuencia depende del orden en que se evalúa;
  - un codo de alguna de las 33 acciones queda al revés;
  - un gesto no declara qué mano del personaje dibujó el kit;
  - la carrera estira el codo por debajo de `codoMin`;
  - la paleta de algún sombrero no separa sus piezas, o la prenda no llega a 3:1 sobre su fondo;
  - a alguna vista de la capucha le falta una de sus piezas, o de espaldas se dibuja el forro;
  - alguna pieza del encapuchado conserva el pelo del kit;
  - un color del kit no tiene papel.
- `node gen.mjs --revision` enseña:
  - las cinco vistas;
  - las 16 manos en los dos brazos, para ver que la muñeca cae en el extremo del antebrazo y que
    el pulgar cae al lado que toca;
  - una lámina por sombrero: el busto entero, a su escala y sobre su fondo, con su paleta y sus
    contrastes al pie;
  - el hueco de la cara con los párpados y sin ellos;
  - la comparación de mangas.
- `node lamina.mjs` recorta esas cuatro láminas y las junta en `out/lamina-sombreros.png`: los
  cuatro sombreros a 1440 px cada uno, que es donde se revisa el dibujo. Uno por lámina y no los
  cuatro en una rejilla dentro de la misma, porque a 2 × 2 la celda mide 540 y el personaje, 403
  unidades de ancho: no pasaría de 500 px, menos de lo que ya se ve en el vídeo.
- `node tira.mjs <n>` saca 18 cuadros repartidos de una acción. Así se revisaron las 28 del hombre
  antes del vídeo.
- La hoja de miniaturas, a 260 px de ancho, es donde cada acción tiene que entenderse.

**El vídeo del laboratorio no sale idéntico byte a byte.** En un tramo de 48 cuadros, 16 cambian
entre 1 y 5 trabajadores, y dos pasadas con 1 trabajador difieren entre sí en 14. El PSNR de esas
diferencias queda entre 81 y 97 dB, que no se ve. No es la pose, porque las dos pasadas piden los
cuadros en el mismo orden. Tampoco la GPU: con `--disable-gpu` cambian 9 cuadros entre dos
pasadas. Y no depende de lo que se mueve: en `revision.html`, donde nada cambia de un cuadro a
otro, dos pasadas difieren en 21 de 36. La frase de «Cómo se renderiza» sobre los cuadros idénticos
se midió con un reel.

## Licencia

El kit está copiado en `personajes/kits/hombre.svg` y no se versiona: el repositorio es público y
la licencia de Freepik no permite redistribuir el archivo. No lleva el grupo `DESIGNED_BY_FREEPIK`, pero eso no confirma el tipo de
descarga.
Antes de publicar un reel con este personaje hay que confirmarlo: con la licencia gratuita, la
publicación debe decir «Designed by Freepik»; con la Premium, no.

En `personajes/kits/` hay otros tres kits de creación de personaje, sin usar todavía:
`mujer.svg`, `estudiante.svg` y `oficinista.svg`. **Los dos últimos sí llevan el grupo
`DESIGNED_BY_FREEPIK`**, así que al publicar con ellos hay que acreditar «Designed by Freepik». El
de la mujer no lo lleva, igual que el del hombre, y sigue sin confirmarse. Ninguno tiene grupos con
nombre —las rutas serían `OBJECTS/3/1/…` en vez de `front_stand/2/1`— y los tres traen solo la
vista de frente: de las 33 acciones, un personaje montado sobre ellos podría hacer unas 12.

El encapuchado sale entero de **Storyset** (`personajes/referencias/hacker-frente.svg`), que es de
Freepik: licencia gratuita **con atribución**. Las otras cuatro láminas de `referencias/` las aportó
el usuario y sirven solo de guía.

En `personajes/kits/humaaans/` quedan cuatro piezas de [Humaaans](https://www.humaaans.com/), CC0, de
cuando se probó a montar la capucha sobre ese cuerpo. **No se usan**; se guardan porque son la
alternativa libre de atribución si algún día hiciera falta.

**Atribución, obligatoria al publicar.** La licencia gratuita de Storyset exige acreditar. Según la
documentación de Freepik, para una publicación en una red social basta con la línea en el pie del
post:

```
Designed by Freepik — https://www.freepik.com
```

- **Publicaciones en redes** (un reel de Instagram lo es): la atribución va «en el pie del post o en
  la descripción de la imagen», con enlace a freepik.com. Es el caso de este laboratorio.
- **Vídeo suelto**, fuera de una red: la documentación pide los créditos dentro del vídeo o al final,
  y añade que también puede ir en la descripción en la plataforma donde se aloje. La redacción es
  ambigua sobre si la descripción basta por sí sola.
- Con una suscripción Premium de Freepik desaparece la obligación.

Fuente: [Usage rights: digital](https://support.freepik.com/s/article/Social-Network-posts?language=en_US)
y [Licenses & attribution](https://support.freepik.com/s/article/Attribution-How-when-and-where?language=en_US).

El usuario aceptó esta vía el 2026-09-15 con la condición de que el crédito vaya en la descripción
de la publicación y no dentro del vídeo.

Si algún día estorba, la alternativa libre de verdad es
[Humaaans](https://www.humaaans.com/) (CC0, sin atribución, mismo estilo plano y modular), pero su
prenda con capucha la lleva **bajada**: habría que dibujar la capucha aparte.

## Acciones

| Bloque | Acciones |
|---|---|
| De pie | 01 respira, parpadea y cambia el peso · 02 saluda · 03 señala arriba, hacia un lado · 04 pulgar arriba · 05 se encoge de hombros · 06 se cruza de brazos y golpetea el suelo · 07 piensa con la mano en la barbilla · 08 se estira y bosteza · 09 celebra con un salto · 10 se ríe · 11 se sorprende y da un paso atrás · 12 se entristece y baja la cabeza |
| Girar | 13 de frente a ¾ y a perfil · 14 de espaldas a frente, y saluda · 15 mira a un lado y a otro |
| Desplazarse | 16 camina · 17 corre · 18 entra caminando, se detiene y saluda · 19 salta hacia delante · 20 camina de puntillas |
| Sentado | 21 se sienta · 22 teclea · 23 se echa atrás, piensa y vuelve a teclear · 24 lee, se acerca a la pantalla y se sorprende · 25 se levanta y se estira |
| Sombreros | 26–29 teclea · 30–33 teclea y levanta la cabeza |

Cada acción de sombreros son cuatro, en este orden: black, blue, red y white hat.
