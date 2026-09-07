# Portafolio — Alex Herrera Manzanares

Sitio estático bilingüe construido con Astro 7: español bajo `/es`, inglés bajo `/en`, y la raíz redirigiendo a `/es`. No hay servidor en producción: `pnpm build` deja HTML en `dist/`.

No hay integración de framework de UI. Lo que sí embarca son unos kilobytes de script propio —el conmutador de tema, la retícula de herramientas, el diagrama de capas y el raíl de la línea de tiempo— más `@vercel/analytics`. Sin JavaScript el sitio sigue siendo legible: el tema sigue al sistema, los filtros se ocultan y todos los proyectos quedan a la vista, y el diagrama muestra su primera capa.

## Comandos

```bash
pnpm dev        # desarrollo
pnpm build      # build estático; falla si algún front matter rompe el contrato
pnpm preview    # sirve dist/ tal cual se publicará
pnpm check      # astro check (TypeScript strict)
pnpm sync:cv    # copia los PDFs del CV desde el repo del CV
pnpm og         # regenera los iconos (las tarjetas OG las hace el build)
pnpm lastmod    # refresca src/lib/lastmod.json desde el historial de git
```

`prebuild` ejecuta `sync:cv` y `lastmod` automáticamente. El primero copia los seis PDF (ciberseguridad · desarrollo · general, en dos idiomas) a `public/cv/`. Distingue dos situaciones:

- **El repo del CV no está en esta máquina** —un servidor de despliegue, un clon nuevo—: avisa y sigue, confiando en los PDF versionados. Por eso los PDF **sí se versionan**.
- **El repo está pero falta un PDF**: el build falla, en lugar de servir en silencio una versión vieja.

La ruta de origen se puede cambiar con `CV_SOURCE_DIR`.

## Rutas

Los dos árboles son espejo, cada segmento en su idioma. La tabla de `src/lib/i18n/index.ts` es la única fuente: de ahí salen la navegación, el cambio de idioma, los `hreflang` y el sitemap. Ninguna página deduce su ruta de la URL, porque con `build.format: 'file'` la URL lleva sufijo `.html`; cada página declara su clave y la tabla hace el resto.

| | Español | Inglés |
|---|---|---|
| Portada | `/es` | `/en` |
| Proyectos | `/es/proyectos` | `/en/projects` |
| Ficha | `/es/proyectos/<slug>` | `/en/projects/<slug>` |
| Sobre mí | `/es/sobre-mi` | `/en/about` |
| Contacto | `/es/contacto` | `/en/contact` |

## Añadir un proyecto

Cada proyecto es una carpeta con las dos versiones de idioma. Las dos son obligatorias:

```
src/content/projects/<slug>/
├─ es.md   (o es.mdx)
└─ en.md   (o en.mdx)
```

El front matter lo valida Zod (`src/content.config.ts`) **en el build**. Si algo está mal, `pnpm build` falla diciendo archivo y campo, en vez de publicar una ficha rota.

```yaml
---
slug: kaizen-ai                 # debe coincidir con el nombre de la carpeta
title: Kaizen AI | Asistente inteligente
tagline: Una línea, 10–180 caracteres.
areas: [ia, seguridad]          # 1 a 3 de la taxonomía
kind: profesional               # profesional | academico | personal
org: Kaizen Apps CR             # o null
role: Desarrollo                # o null
period:
  start: '2025-09'              # YYYY o YYYY-MM
  end: null                     # null = sigue en curso
tier: ficha                     # único valor admitido
home: true                      # destacado en la portada (máximo 4 en todo el sitio)
visibility: privado             # publico | privado
repo: null                      # obligatorio null si visibility es privado
site: null                      # URL pública del producto, si la tiene
stack: [Next.js, TypeScript]
cover: null                     # ruta bajo /img/ o null; sustituye la imagen social
order: 2                        # opcional; sin él ordena por fecha, más reciente primero
---
```

Reglas que el build hace cumplir:

- `slug` en minúsculas y guiones, y debe coincidir con el nombre de la carpeta.
- `areas` solo acepta `fullstack · ia · datos · movil · seguridad · infra`, entre una y tres.
- Un proyecto `privado` **no puede** enlazar repositorio: el código es del cliente. Sí puede enlazar `site` cuando el producto es una web pública que cualquiera puede escribir en la barra de direcciones. La auditoría de privacidad es un fallo de build, no una lista que alguien recuerda repasar.
- Como máximo 4 proyectos destacados en todo el sitio.
- `period.end` no puede ser anterior a `period.start`. Un `YYYY` suelto se ordena a mitad de año, porque no dice más.
- `cover`, si existe, empieza por `/img/`.
- Si existe `es.md` debe existir `en.md`, y al revés, con el mismo `tier`, el mismo `home` y el mismo diagrama.
- **Un `.md` que declare `diagram` falla el build**: el diagrama necesita `.mdx` para poder colocarse, y un fallo silencioso lo dejaría fuera de la página.

`order` decide más de lo que parece: además de ordenar las tarjetas, fija el orden de los grupos de organización en `/proyectos`, porque cada grupo aparece donde aparece su primer proyecto.

### Cómo se escribe el cuerpo

Siempre la misma estructura: **Contexto → Problema → Decisiones técnicas → Arquitectura → Resultado → Lo que aprendí**. Los proyectos privados no llevan capturas, así que la sección de arquitectura carga con el peso.

Reglas de redacción, que valen tanto como el contrato de datos:

- Registro de documento de ingeniería. Neutral y declarativo, una afirmación por oración.
- **Problema es por qué existe el proyecto** —qué estaba roto, era caro o imposible antes—, no un obstáculo encontrado durante el desarrollo. Ese obstáculo va al principio de «Decisiones técnicas», como la restricción que produjo la decisión.
- **Resultado dice qué quedó funcionando**, no qué se verificó ni qué queda pendiente.
- **Lo que aprendí es un hecho técnico con síntoma observable**, nunca una lección general.
- Si una oración podría aparecer sin cambios en la ficha de otro proyecto, sobra.
- Los títulos nombran la cosa; lo que la hace interesante va en la tagline. Separador `|` o `,`, nunca raya, y ambas mitades en mayúscula inicial.
- Una URL en producción no es una «demo». El campo es `site` y la etiqueta, *Sitio en producción*.
- Nada de reclamos de exclusividad ni de velocidad, y ninguna métrica de negocio del cliente: solo cifras técnicas del propio trabajo.
- El texto de experiencia en `src/lib/about.ts` y la lista de proyectos tienen que nombrar el mismo conjunto. Si la experiencia nombra un sistema, ese sistema necesita ficha.
- Nada que describa una debilidad explotable de un sistema en producción de un cliente. El sitio es público.

`ArchDiagram.astro` dibuja una tubería con una compuerta: una etapa donde se aplican varias reglas a la vez. Los datos van en el campo `diagram` —`nodes` de 2 a 6, `gate` señalando cuál es la compuerta, y de 2 a 4 `layers`— y el cuerpo lo coloca con `<ArchDiagram {...frontmatter.diagram} />`. El diagrama enuncia la regla; el cuerpo explica la consecuencia. Repetir el uno en el otro es el error fácil.

## Estructura

| Ruta | Qué hay |
|---|---|
| `src/content.config.ts` | el contrato de front matter |
| `src/lib/content.ts` | carga, valida y ordena el contenido en build |
| `src/lib/areas.ts` | taxonomía de las 6 áreas |
| `src/lib/i18n/index.ts` | tabla de rutas ES↔EN — la usan la navegación, el cambio de idioma, `hreflang` y el sitemap |
| `src/lib/format.ts` | el formato de los rangos de fecha, en un solo sitio |
| `src/lib/site.ts` | origen del sitio, contacto, rutas del CV |
| `src/lib/seo.ts` | canonical, `hreflang` y los metadatos de la cabecera |
| `src/lib/jsonld.ts` | el grafo de datos estructurados que emite cada página |
| `src/lib/og/` | las tarjetas Open Graph: rutas, paleta, ajuste de texto y render |
| `src/lib/lastmod.json` | fecha del último commit de cada página, para el sitemap |
| `src/components/pages/` | las páginas reales; `src/pages/` solo las monta en cada idioma |
| `src/layouts/Layout.astro` | el armazón HTML, el tema antes del primer pintado y la resonancia de área |
| `src/app.css` | tokens de diseño, reset y las reglas globales que cruzan componentes |
| `site-url.mjs` | el origen y su normalización, para los consumidores que no son Astro |

## Decisiones de diseño

- **El color es semántico.** Una tonalidad **siempre** significa un área y nunca decora. Todo lo demás es tinta sobre papel, así que las seis etiquetas de área son lo único que resalta.
- **El color está racionado.** El tono lo lleva un punto; las palabras de al lado cargan el significado. La excepción es un control que el lector ha pulsado, donde el relleno marca su elección. Rellenar cada etiqueta convertía doce tarjetas en dos docenas de píldoras de color compitiendo con el texto que debían rotular.
- La insignia de disponibilidad tiene su propio token `--available`, declarado fuera del sistema de áreas: no es un área y no debe tomar prestado el tono de una.
- La compuerta del diagrama se pinta en tinta, no en el color de seguridad, que estaba tiñendo hasta los diagramas de proyectos que no van de seguridad.
- Todos los logotipos se pintan en tinta, nunca en color de marca, por la misma regla. La UTN se dibuja más ancha que las demás porque su lockup carga tres cosas donde las otras cargan una, y a igual ancho su tipografía se leía visiblemente menor.
- Los tokens viven en `src/app.css` en OKLCH: `:root` define el tema claro completo, y `@media (prefers-color-scheme: dark)` junto a `[data-theme="dark"]` redefinen solo los tokens.
- Tailwind está solo por su reset. `source(none)` apaga su escáner: sin eso, un `display: flex` dentro de un `<style>` le hacía emitir una utilidad `.flex`, y una de esas utilidades chocaba con el `.sr-only` propio.

## Comportamiento del cliente

- **Resonancia de área.** Apuntar con el ratón o tabular hasta algo que nombre un área fija `data-area-focus` en `<html>`, y el CSS global mantiene a plena intensidad todo lo que comparte esa área mientras el resto baja al 25 %. Cruza fronteras de componente a propósito: una píldora de la retícula de herramientas atenúa una tarjeta de proyecto. Cualquier elemento nuevo que pertenezca a un área necesita `data-areas` o `data-area` para entrar en ese juego.

  Solo la enciende un puntero de ratón. En táctil no se enciende, porque nada la apagaría después. Con teclado sí se mantiene mientras la píldora tenga el foco —eso es la función— y `Escape` la apaga.
- **El raíl de `/proyectos`** se dibuja con la posición del scroll y no con un `IntersectionObserver`: los grupos difieren hasta siete veces en altura y ninguna banda del viewport sirve para todos. Además, el último grupo queda tan abajo que ninguna marca relativa al viewport lo alcanza, así que llegar al final de la página cuenta como llegar al final del registro. Ese código solo se puede verificar con scroll real: asignar `scrollTop` por script no dispara eventos de scroll.
- **Los scripts de cliente no importan nada.** Traer `brands.ts` para hacer una cuenta que ya está resuelta en build embarcaría decenas de kilobytes de trazos SVG.
- El tema se aplica antes del primer pintado con un script en línea, para que el conmutador no parpadee.

## Marcas y logos

Los logos de herramientas viven en `src/lib/brands.ts` y los de las organizaciones en `src/components/OrgMark.astro`. **Ambos se generan y no se editan a mano.** Los generadores están en `design/`, que **no forma parte de este repositorio**: es material de trabajo del rediseño y contiene arte de marca de los clientes. Lo que se versiona son las salidas, incluidos los PNG enmascarados de `public/img/brand/`.

Son cuatro marcas de organización: Intercargo, Kaizen, Star Cargo y la UTN. Star Cargo publica un SVG que se puede recolorear; las otras tres se enmascaran con CSS a partir de un PNG.

Un string de stack sin marca no rompe nada: cae a un chip de texto. `src/lib/stack.ts` mapea los strings de las fichas a las marcas, con alias para los nombres largos.

## Despliegue

Vercel, salida estática. `vercel.json` fija:

- `cleanUrls`, para que `/es/contacto` resuelva a `es/contacto.html` de forma determinista con `build.format: 'file'`.
- Un **307 de `/` a `/es`**. Astro también emite una página de redirección con `meta refresh`, que es lo que hace funcionar `pnpm preview` y cualquier host que no sea Vercel; en producción gana la del borde y esa página no se sirve. Es 307 y no 308 a propósito: un 308 lo cachea el navegador para siempre, y que la raíz vaya al español es una decisión que puede cambiar.
- Un año de caché inmutable para `/_astro/*`, cuyos nombres llevan hash.
- `X-Content-Type-Options`, `Referrer-Policy` y `X-Frame-Options`.

`404.html` lo sirve Vercel solo, sin configuración.

## Rendimiento

Tres cosas que es fácil volver a romper:

- **`<Analytics />` va en el `<body>`, no en el `<head>`.** Emite `<vercel-analytics>`, y un elemento desconocido dentro de la cabecera es donde el parser decide que la cabecera terminó: con él arriba, las hojas de estilo que Astro añade después se parseaban dentro del `<body>`.
- **Las `@font-face` se declaran en `Layout.astro`, no se importan de Fontsource.** Sus paquetes *variable* publican una sola hoja con los once subconjuntos y aquí solo se usa el latino. Declararlas es además lo que permite precargarlas: el nombre con hash solo se conoce a través de `?url`, y usar ese mismo valor en el `preload` y en la `@font-face` es lo que garantiza que el navegador no descargue el fichero dos veces.
- **`assetsInlineLimit` es una función.** El `0` estaba para que fuentes e imágenes no acabaran en base64, pero también apagaba el inlineado de CSS y hojas de 310 B viajaban como petición propia. La función dice solo lo que se quería decir: `false` para los assets, el umbral por defecto para el CSS.

## Datos estructurados

Cada página indexable emite **un solo** `<script type="application/ld+json">` con un `@graph`. Uno y no varios: con varios habría que repetir la `Person` en cada página —que es justo lo que un `@id` estable existe para evitar— o referenciar `@id` entre scripts, que no se puede validar pegando una sola cosa en el test de Google.

Las entidades duraderas llevan `@id` fijo: `#person`, `#website` y un `#org-<marca>` por organización. Así `/es` y `/en` describen **la misma persona** en vez de dos. La `Person` va completa en la portada y en «sobre mí», y reducida en el resto: un nodo descrito en parte con el mismo `@id` es JSON-LD idiomático, y `sameAs` —el campo que reconcilia la entidad— se queda también en la versión corta.

Las fichas llevan `CreativeWork` y no `Article`. No hay fecha de publicación en el contrato de front matter y sacarla de `period` sería inventarla: `period` es cuándo ocurrió el trabajo, que es lo que significa `temporalCoverage`. `Article` trata `datePublished` como obligatoria, así que sin ella solo se gana un aviso permanente en Search Console. El resultado enriquecido que sí aparece es `BreadcrumbList`, y ese no depende del tipo — es lo que pone `alexherrera.dev › Proyectos › …` bajo el resultado, que es donde las fichas recuperan la atribución que sus títulos deliberadamente no llevan.

Solo se afirma lo que es cierto: las certificaciones en curso no entran en `hasCredential`, `ORG_LINKS` empieza vacío porque un `sameAs` sin verificar desambigua la entidad equivocada, y no hay `potentialAction: SearchAction` porque el sitio no tiene buscador.

## Dominio

El origen está declarado una sola vez, en `site-url.mjs`: `https://www.alexherrera.dev`, el dominio propio. Canonical, `hreflang`, Open Graph y sitemap salen de ahí sin tocar nada más, porque `src/lib/site.ts` lee el `site` que Astro ya resolvió. `PUBLIC_SITE_URL` sobrescribe ese valor por si una build tiene que apuntar a otro origen —un preview, una prueba local—, y por eso mismo, si quedó definida en el entorno Production de Vercel, gana sobre el dominio propio: ahí no debe estar.

La raíz negocia idioma: `vercel.json` manda a `/en` cuando `Accept-Language` empieza por `en` y a `/es` en el resto de casos, y `x-default` apunta a la raíz, que es para lo que ese valor está definido. Apuntarlo a `/es` diría que el español es el respaldo para todo el mundo, y los dos idiomas están al mismo nivel.

El sitemap lleva `<lastmod>`, sacado de git por `scripts/lastmod.mjs` a `src/lib/lastmod.json`, que **se versiona**: Vercel clona en superficie y allí `git log` da el commit de la frontera, no el real, así que `prebuild` detecta el clon superficial y no reescribe el fichero. El JSON va siempre un commit por detrás —no puede contener la fecha del commit que lo transporta—, y esa es la dirección segura: una fecha nunca más nueva que el cambio real. Si te molesta ver el árbol sucio tras un build, `pnpm lastmod` y commitea.

Los PDF del CV llevan `X-Robots-Tag: noindex`. Se siguen enlazando y descargando; lo que no hacen es competir con la propia web en una búsqueda por el nombre, ni exponer el correo y la dirección a los rastreadores.

Las tarjetas Open Graph se generan **en la build**, como endpoint estático (`src/pages/img/og/[...route].png.ts`), una por página y por idioma. La URL de la tarjeta espeja la de la página —`/img/og/es/proyectos/<slug>.png`— porque se construye con el mismo `path()` que produce los canonical: la lista que enumera las rutas es la lista que rellena los metadatos, así que una tarjeta no puede faltar ni quedar obsoleta. Antes eran dos ficheros versionados y regenerados a mano; una tarjeta hecha con el título y el área de una ficha tiene que seguir a esa ficha, y treinta y seis binarios regenerados a mano se desincronizan solos.

La tarjeta lleva el tono del área del proyecto en la regla superior y en los chips, leyendo los tokens de `src/app.css` en tiempo de build para no tener una segunda copia de la paleta. **No imprime el dominio**, precisamente para que un cambio de dominio no la deje mintiendo: lo que la atribuye es el nombre.

Las fuentes vienen de `scripts/fonts/` (Geist estática, OFL). Van ahí y no del paquete de Fontsource porque este publica solo `woff2` y la base de fuentes de resvg no lo lee: hasta ahora las tarjetas salían en Segoe UI. `pnpm og` ya no dibuja tarjetas, solo los iconos, que nunca dependieron del contenido.
