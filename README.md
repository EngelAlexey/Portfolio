# Portafolio — Alex Herrera Manzanares

Sitio estático bilingüe construido con Astro 7: español bajo `/es`, inglés bajo `/en`, y la raíz redirigiendo a `/es`. No hay servidor en producción: `pnpm build` deja HTML en `dist/`.

No hay integración de framework de UI. Lo que sí embarca son unos kilobytes de script propio —el conmutador de tema, la retícula de herramientas, el diagrama de capas y el raíl de la línea de tiempo— más `@vercel/analytics`, `@vercel/speed-insights` y la etiqueta de Google Analytics 4. Sin JavaScript el sitio sigue siendo legible: el tema sigue al sistema, los filtros se ocultan y todos los proyectos quedan a la vista, y el diagrama muestra su primera capa.

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
| Blog | `/es/blog` | `/en/blog` |
| Artículo | `/es/blog/<path>` | `/en/blog/<path>` |
| Feed | `/es/blog.xml` | `/en/blog.xml` |
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
order: 2                        # opcional; solo ordena los cuatro destacados de la portada
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

`order` decide una sola cosa: en qué orden salen los cuatro destacados de la portada. `/proyectos` va siempre por fecha, del más reciente al más antiguo, y cada grupo de organización aparece según la fecha del trabajo más reciente que contiene.

### Cómo se escribe el cuerpo

Siempre la misma estructura: **Contexto → Problema → Decisiones técnicas → Arquitectura → Resultado → Lo que aprendí**. Los proyectos privados no llevan capturas, así que la sección de arquitectura carga con el peso.

Reglas de redacción, que valen tanto como el contrato de datos:

- Registro de documento de ingeniería. Neutral y declarativo, una afirmación por oración.
Qué contesta cada sección, que es lo que decide dónde va cada frase:

| Sección | Contesta |
|---|---|
| Contexto | qué es, quién lo usa y **qué necesidad lo impulsó** |
| Problema | **qué se sufría antes de que existiera**, en términos del negocio o del usuario |
| Decisiones técnicas | restricción → decisión → coste, sin comprometer nada del cliente |
| Arquitectura | cómo funciona, en superficie |
| Resultado | **qué se consiguió** al implantarlo |
| Lo que aprendí | una **lección de negocio o técnica**, anclada a un hecho de este proyecto |

- El motivo va en Contexto, no en Problema. Problema es el estado anterior, no la historia del encargo.
- **Resultado dice qué quedó funcionando**, no qué se verificó ni qué queda pendiente. La verificación va después, como respaldo.
- **Lo que aprendí cierra con una lección**, pero la lección tiene que salir de un hecho de esta ficha. Si el cierre podría copiarse tal cual a otro proyecto, no está anclado.
- Si una oración podría aparecer sin cambios en la ficha de otro proyecto, sobra.
- Tecnicismos solo donde explican el stack o una decisión. En la tagline, que es el texto más leído del sitio, no entran: `AST`, `REPEATABLE READ` y similares se dicen en palabras.
- Oraciones de 25 palabras o menos. Por encima de 32 hay que partirlas.
- Los títulos nombran la cosa; lo que la hace interesante va en la tagline. Separador `|` o `,`, nunca raya, y ambas mitades en mayúscula inicial.
- Una URL en producción no es una «demo». El campo es `site` y la etiqueta, *Sitio en producción*.
- Nada de reclamos de exclusividad ni de velocidad, y ninguna métrica de negocio del cliente: solo cifras técnicas del propio trabajo.
- El texto de experiencia en `src/lib/about.ts` y la lista de proyectos tienen que nombrar el mismo conjunto. Si la experiencia nombra un sistema, ese sistema necesita ficha.
- Nada que describa una debilidad explotable de un sistema en producción de un cliente. El sitio es público.

`ArchDiagram.astro` dibuja una tubería con una compuerta: una etapa donde se aplican varias reglas a la vez. Los datos van en el campo `diagram` —`nodes` de 2 a 6, `gate` señalando cuál es la compuerta, y de 2 a 4 `layers`— y el cuerpo lo coloca con `<ArchDiagram {...frontmatter.diagram} />`. El diagrama enuncia la regla; el cuerpo explica la consecuencia. Repetir el uno en el otro es el error fácil. Sus capas no van numeradas: se aplican todas a la vez en la compuerta, no son una secuencia.

**Sus estilos viven en `src/app.css`, no en el componente.** Astro no propaga el CSS con ámbito de un componente `.astro` importado dentro de un `.mdx` que se renderiza con el `render()` de la capa de contenido: el marcado sale con su `data-astro-cid-*` y la hoja de estilos no se enlaza en ninguna parte, ni en dev ni en el build. El diagrama estuvo así, sin estilo, en seis fichas publicadas. Cualquier componente nuevo que se use desde una ficha `.mdx` tiene el mismo problema y sus estilos van también a `app.css`.

## Añadir un artículo

Los artículos del blog son una colección aparte, con la misma forma de carpeta que los proyectos y las dos versiones de idioma obligatorias:

```
src/content/articles/<slug>/
├─ es.mdx
├─ en.mdx
└─ notas-de-imagen.md   (opcional; el cargador no lo lee)
```

Siempre `.mdx`, aunque el artículo no importe ningún componente: así el cargador tiene un solo patrón y añadir un `Callout` después no obliga a renombrar el archivo.

```yaml
---
slug: revisar-codigo-generado-por-ia   # debe coincidir con el nombre de la carpeta
title: Siete cosas que revisar en el código que genera tu IA
tagline: Una línea, 10–180 caracteres.
areas: [seguridad]                     # 1 a 3 de la misma taxonomía que las fichas
published: '2026-09-07'                # YYYY-MM-DD
updated: null                          # YYYY-MM-DD o null
draft: true                            # true = solo se ve en `astro dev`
path: null                             # segmento de URL de ESTE idioma; null = usa el slug
repo: null                             # repositorio de demostración, o null
related: [kaizen-ai]                   # slugs de fichas existentes, o []
cover: null                            # ruta bajo /img/ o null
---
```

Reglas que el build hace cumplir:

- `slug` en minúsculas y guiones, y debe coincidir con la carpeta.
- Si existe `es.mdx` debe existir `en.mdx`, con el mismo `draft`, el mismo `published` y el mismo `related`.
- `updated` no puede ser anterior a `published`.
- `path` en minúsculas y guiones, y no puede repetirse entre dos artículos del mismo idioma.

**`path` es la dirección del artículo en ese idioma y se declara por archivo.** El `slug` sigue siendo la carpeta y la identidad interna; `path` es solo lo que se ve en la barra de direcciones. Cuando es `null`, la ruta usa el `slug`, así que un artículo sin traducir la URL no cambia. Declararlo en `en.mdx` es lo que evita que un lector anglófono llegue a `/en/blog/revisar-codigo-generado-por-ia`, una dirección sin una sola palabra en su idioma. Cambiar un `path` que lleve tiempo publicado obliga a redirigir el anterior desde `vercel.json`, porque esa dirección ya está indexada y compartida. Si el cambio ocurre a las horas de publicar y nadie ha llegado todavía, un 404 sin enlaces entrantes no cuesta nada y la redirección sobra.

**`updated` es la fecha de la última edición y hay que ponerla a mano** cuando se corrige o se amplía un artículo ya publicado. Mientras es `null`, el artículo se describe solo con `published`. En cuanto tiene fecha aparece en cinco sitios: la línea de datos de la ficha del artículo, `dateModified` en los datos estructurados, `article:modified_time` en Open Graph, `<lastmod>` en el sitemap y `atom:updated` en el feed. La fecha declarada **gana sobre la del historial de git**: es la que el autor afirma, y el historial queda de reserva para los artículos que no la declaran.
- `related` solo admite slugs de fichas que existan. Un enlace roto es un fallo de build, no un 404 en producción.

### La compuerta del blog

Un blog con un solo artículo comunica abandono, así que la sección no se enseña hasta que haya algo que leer. Mientras no exista ningún artículo publicado se apagan a la vez el enlace del menú, el bloque de la portada, las entradas del sitemap y el `<link>` del feed, y `/es/blog` se sirve con `noindex`. Todo cuelga de `hasArticles()` en `src/lib/articles.ts`.

Un artículo en `draft: true` se ve entero en `astro dev` y no existe en el build. Publicar es cambiar esa línea.

### Cómo se escribe el cuerpo

Se hereda todo lo de las fichas: registro de documento de ingeniería, una afirmación por oración, 25 palabras o menos y 32 como techo, sin metáforas ni cierres aforísticos. Si una oración podría aparecer sin cambios en otro artículo, sobra.

Reglas propias del blog:

- **El título de un artículo sí describe.** Las fichas nombran la cosa; un artículo nombra lo que el lector se lleva, y tiene que coincidir con algo que la gente teclea en un buscador. «Cómo validar permisos en un ERP multiempresa» se busca; «reflexiones sobre mi stack» no.
- **Voz impersonal.** Nada de «he tenido que corregir», «me pasó», «en mi experiencia». Un artículo es una recomendación general con información verificable, no una anécdota. La primera persona se queda en la interfaz del sitio, que sí es su voz.
- **Cada punto termina en algo comprobable:** una petición, una prueba o una salida que el lector puede reproducir. Un punto que solo aconseja se borra.
- **Cada afirmación cuantificada lleva referencia**, y la referencia se abre antes de citarla para comprobar que dice lo que se le atribuye. OWASP, CWE, la documentación oficial de la herramienta y el paper original sirven; un blog que resume a otro, no.
- **Todo identificador de ejemplo que se resuelva contra un registro público se comprueba antes de publicar**, y en el texto se dice que está inventado y con qué fecha se comprobó. Un nombre de paquete elegido a ojo puede existir: el primer artículo usaba `react-secure-input` como ejemplo de paquete alucinado y resultó ser un paquete real y con autor. Vale para nombres de paquete, dominios, cuentas y direcciones de repositorio.
- **Ninguna afirmación de comportamiento se escribe de memoria.** Si el texto dice que un comando devuelve algo, se corre; si dice que una herramienta hace algo, se abre su documentación. Un artículo indexado se corrige mal y se cita peor.
- **Decisiones, no incidentes.** Lo que aportan los proyectos reales es la regla que se adoptó, enunciada como principio y sin nombrar el sistema. Un fallo concreto que tuvo un producto de un cliente no entra, aunque esté corregido y aunque se cuente en abstracto.
- **El carrusel no es el artículo resumido.** El carrusel entrega la lista completa y utilizable; el artículo entrega el código, la captura del fallo y la comprobación.
- **Una comparación describe configuraciones, no bandos.** Cuando un artículo compara dos herramientas, tiene que decir cómo se consigue el comportamiento seguro en las dos, con su coste. Una tabla de valores por defecto se lee como un veredicto si no se dice que son valores por defecto y no capacidades. El artículo de npm y pnpm dedica un punto entero a la configuración de npm por esta razón.
- **La versión en español se escribe en español, no se traduce del inglés.** Un calco literal se reconoce porque el término no significa nada fuera de su idioma original: «tubería» por *pipeline* es una cañería, no una cadena de integración; «cerrar puertas» arrastra el impacto de *backdoor* y en español no lo tiene; «correr un comando» es *run*, cuando el verbo es ejecutar. Lo mismo vale para las metáforas que solo funcionan traducidas. Si el término técnico no tiene equivalente asentado, se deja el original en cursiva y se explica una vez.
- **Una afirmación sobre una herramienta nombra la versión exacta que se midió.** «pnpm bloquea los scripts» es falso en la 9, un aviso en la 10 y un error en la 11. La versión que se probó va en el texto, no solo en la tabla.

Y una regla que no se negocia: **todo el código de un artículo está reconstruido para el artículo**. Nada sale de los repositorios de Intercargo, Star Cargo ni Kaizen. Un artículo indexado es público y permanente, así que ningún ejemplo describe una debilidad concreta de un sistema en producción de un cliente.

### Citas y referencias

`[1]` suelto en Markdown es texto, no un enlace: sin una definición `[1]: url` no lo es, y con ella apuntaría fuera en lugar de a la lista. Por eso las citas son dos componentes.

`Cite.astro` marca la cita en el punto donde se afirma, pegada a la última palabra y antes del punto:

```mdx
… no salieron mejor parados que los pequeños<Cite n={1} />.
```

Sale como un volado `[1]` en el color del área, enlaza a `#ref-1` y lleva `id="cite-1"` para que la referencia pueda devolver al lector al párrafo.

`References.astro` cierra el artículo y recibe los datos, no marcado. Numera, pone los `id="ref-n"`, deriva el dominio de cada URL y añade la flecha de vuelta:

```mdx
<References
	title="Referencias"
	back="Volver a la cita"
	items={[
		{ source: 'OWASP', title: 'Top 10 2021, A03:2021 Injection', url: 'https://…' },
		{ source: 'Spracklen, J. y otros', title: 'We Have a Package…', note: 'USENIX Security 2025', url: 'https://…' }
	]}
/>
```

El orden del arreglo es la numeración, así que **`n` en cada `<Cite>` tiene que coincidir con la posición del elemento**. Nada lo comprueba en el build.

### Componentes en el cuerpo

`Callout.astro`, con las variantes `riesgo`, `correccion` y `nota`, más `Cite` y `References`. **Los estilos de los tres viven en `src/app.css`**, por la misma razón que los del diagrama: Astro no propaga el CSS con ámbito de un componente importado dentro de un `.mdx`.

Un detalle de MDX que cuesta un build: **el enlace automático de Markdown, `<https://…>`, no existe en MDX**. Todo lo que empieza por `<` se intenta leer como JSX, así que una URL suelta va como `[url](url)` o dentro de un componente. El build falla con un error de sintaxis en la línea del enlace.

## Estructura

| Ruta | Qué hay |
|---|---|
| `src/content.config.ts` | el contrato de front matter |
| `src/lib/content.ts` | carga, valida y ordena los proyectos en build |
| `src/lib/articles.ts` | lo mismo para los artículos, más los minutos de lectura y la compuerta del blog |
| `src/lib/feed.ts` | el canal RSS, construido a mano como el sitemap |
| `src/lib/areas.ts` | taxonomía de las 6 áreas |
| `src/lib/i18n/index.ts` | tabla de rutas ES↔EN — la usan la navegación, el cambio de idioma, `hreflang` y el sitemap |
| `src/lib/format.ts` | el formato de los rangos de fecha y de las fechas sueltas, en un solo sitio |
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
- **Cada ficha lleva el tono de su primera área.** `accentStyle()` en `src/lib/areas.ts` fija `--accent`, `--accent-bg` y `--accent-line` sobre el envoltorio `.ficha`, y de ahí los toman el rótulo de tipo, la regla bajo el título, el marcador de cada `h2`, el borde del aviso de proyecto privado, los enlaces y la compuerta del diagrama. `:root` los declara en tinta, así que el resto del sitio no cambia. Al resolverse contra los tokens `--area-*`, que ya están declarados en los tres bloques de tema, no hay ningún token nuevo que mantener en modo oscuro.
- **Las tarjetas llevan un filo de 2 px** en el tono de su primera área, y pasa de `--accent-line` a `--accent` al apuntarla. Es un tono por tarjeta, no una píldora rellena: sigue siendo el punto, con otra forma.
- **Las secciones de la portada alternan `--paper` y `--paper-sunken`** para que la página no sea un solo plano.
- **La monoespaciada es para datos, no para rótulos.** Se queda en el stack, las direcciones de repositorio y el código. Los rótulos (`Organización`, `Rol`, `Correo`, `Experiencia`, el tipo de proyecto, la línea superior de las tarjetas) van en la sans a 0.8125 rem, en caja normal y sin tracking. El versalita monoespaciado de 11 px era más difícil de leer y hacía que todo pareciera plantilla. La utilidad global es `.meta-label`, con ese nombre y no `.label` porque `ToolGrid` ya usa `.label` con ámbito para el pie de cada tarjeta.
- Todos los logotipos se pintan en tinta, nunca en color de marca, por la misma regla. La UTN se dibuja más ancha que las demás porque su lockup carga tres cosas donde las otras cargan una, y a igual ancho su tipografía se leía visiblemente menor.
- Los tokens viven en `src/app.css` en OKLCH: `:root` define el tema claro completo, y `@media (prefers-color-scheme: dark)` junto a `[data-theme="dark"]` redefinen solo los tokens.
- Tailwind está solo por su reset. `source(none)` apaga su escáner: sin eso, un `display: flex` dentro de un `<style>` le hacía emitir una utilidad `.flex`, y una de esas utilidades chocaba con el `.sr-only` propio.

## Comportamiento del cliente

- **Resonancia de área.** Apuntar con el ratón o tabular hasta algo que nombre un área fija `data-area-focus` en `<html>`, y el CSS global mantiene a plena intensidad todo lo que comparte esa área mientras el resto baja al 25 %. Cruza fronteras de componente a propósito: una píldora de la retícula de herramientas atenúa una tarjeta de proyecto. Cualquier elemento nuevo que pertenezca a un área necesita `data-areas` o `data-area` para entrar en ese juego.

  Solo la enciende un puntero de ratón. En táctil no se enciende, porque nada la apagaría después. Con teclado sí se mantiene mientras la píldora tenga el foco —eso es la función— y `Escape` la apaga.
- **El raíl de `/proyectos`** se dibuja con la posición del scroll y no con un `IntersectionObserver`: los grupos difieren hasta siete veces en altura y ninguna banda del viewport sirve para todos. Además, el último grupo queda tan abajo que ninguna marca relativa al viewport lo alcanza, así que llegar al final de la página cuenta como llegar al final del registro. Ese código solo se puede verificar con scroll real: asignar `scrollTop` por script no dispara eventos de scroll.
- **El índice de áreas de la portada enlaza a `/proyectos#area`.** El script de `/proyectos` lee el hash al cargar y en `hashchange`, y el filtro escribe el hash con `replaceState` cuando hay una sola área seleccionada. Así un área concreta es enlazable y compartible; con ninguna o varias, la URL vuelve a la ruta limpia.
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

Cinco cosas que es fácil volver a romper:

- **`<Analytics />` y `<SpeedInsights />` van en el `<body>`, no en el `<head>`.** Emite `<vercel-analytics>`, y un elemento desconocido dentro de la cabecera es donde el parser decide que la cabecera terminó: con él arriba, las hojas de estilo que Astro añade después se parseaban dentro del `<body>`. `<SpeedInsights />` emite `<vercel-speed-insights>` y tiene el mismo problema.
- **Los dos sellan `data-pathname` con el sufijo `.html`**, porque `build.format` es `file` y `Astro.url.pathname` lo incluye. Sin corregirlo, tanto la ruta que reportan como la que derivan de ella nombran una URL que el sitio nunca sirve. El script en línea que hay justo debajo de los dos elementos lo recorta mientras se parsea, después de que existan y antes de que sus módulos diferidos los conviertan en componentes.
- **La etiqueta de GA4 sí va en el `<head>`, y eso no contradice lo anterior.** Lo que rompía la cabecera era el elemento desconocido, no la posición: `<script>` es un elemento de cabecera legítimo. El cuerpo del `gtag` se arma en el front matter y se inyecta con `set:html`, como las `@font-face` y el JSON-LD, porque dentro de una expresión del template las llaves del script se leerían como JSX. Y va detrás de `import.meta.env.PROD`, que es verdadero en cualquier `astro build`: las previsualizaciones y `pnpm preview` también miden. Si algún día estorba ese ruido, la puerta estrecha es `process.env.VERCEL_ENV === 'production'`.
- **Las `@font-face` se declaran en `Layout.astro`, no se importan de Fontsource.** Sus paquetes *variable* publican una sola hoja con los once subconjuntos y aquí solo se usa el latino. Declararlas es además lo que permite precargarlas: el nombre con hash solo se conoce a través de `?url`, y usar ese mismo valor en el `preload` y en la `@font-face` es lo que garantiza que el navegador no descargue el fichero dos veces.
- **`assetsInlineLimit` es una función.** El `0` estaba para que fuentes e imágenes no acabaran en base64, pero también apagaba el inlineado de CSS y hojas de 310 B viajaban como petición propia. La función dice solo lo que se quería decir: `false` para los assets, el umbral por defecto para el CSS.

## Datos estructurados

Cada página indexable emite **un solo** `<script type="application/ld+json">` con un `@graph`. Uno y no varios: con varios habría que repetir la `Person` en cada página —que es justo lo que un `@id` estable existe para evitar— o referenciar `@id` entre scripts, que no se puede validar pegando una sola cosa en el test de Google.

Las entidades duraderas llevan `@id` fijo: `#person`, `#website` y un `#org-<marca>` por organización. Así `/es` y `/en` describen **la misma persona** en vez de dos. La `Person` va completa en la portada y en «sobre mí», y reducida en el resto: un nodo descrito en parte con el mismo `@id` es JSON-LD idiomático, y `sameAs` —el campo que reconcilia la entidad— se queda también en la versión corta.

Las fichas llevan `CreativeWork` y no `Article`. No hay fecha de publicación en el contrato de front matter y sacarla de `period` sería inventarla: `period` es cuándo ocurrió el trabajo, que es lo que significa `temporalCoverage`. `Article` trata `datePublished` como obligatoria, así que sin ella solo se gana un aviso permanente en Search Console. El resultado enriquecido que sí aparece es `BreadcrumbList`, y ese no depende del tipo — es lo que pone `alexherrera.dev › Proyectos › …` bajo el resultado, que es donde las fichas recuperan la atribución que sus títulos deliberadamente no llevan.

Los artículos sí llevan `TechArticle`, y por el motivo contrario: `published` está en el contrato, así que `datePublished` y `dateModified` se afirman con un dato real. El índice del blog emite un `ItemList` con los artículos publicados.

Solo se afirma lo que es cierto: las certificaciones en curso no entran en `hasCredential`, `ORG_LINKS` empieza vacío porque un `sameAs` sin verificar desambigua la entidad equivocada, y no hay `potentialAction: SearchAction` porque el sitio no tiene buscador.

## Descubrimiento

Además del sitemap, los `hreflang` y el grafo de datos estructurados, hay tres piezas pensadas para que a un artículo se llegue desde fuera.

**Directivas de fragmento.** Cada página indexable emite `max-snippet:-1, max-image-preview:large, max-video-preview:-1`. Sin eso, un buscador recorta la cita a unas 160 letras y la vista previa a una miniatura, que es justo lo que decide si un panel de respuestas cita el artículo o lo ignora. Las páginas `noindex` siguen emitiendo solo `noindex, follow`.

**Rastreadores de IA nombrados.** `robots.txt` ya los permitía por el comodín, pero ahora aparecen uno por uno: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User, Claude-SearchBot, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, meta-externalagent y CCBot. El comodín no dice nada sobre la intención y varios se comprueban por nombre.

**`/llms.txt`.** Un índice en Markdown en la raíz, generado desde el contenido: quién es, qué hay, y una línea por artículo y por ficha con su dirección, su área y su stack. Sigue la convención de [llmstxt.org](https://llmstxt.org). Conviene decirlo sin adornos: **es una propuesta, no un estándar, y ningún proveedor garantiza que la lea**. Cuesta un archivo generado y no hay que mantenerlo a mano, así que se queda; pero el trabajo que sí paga sigue siendo el de siempre, un `<title>` y una descripción que digan la verdad, HTML semántico y el grafo de datos estructurados.

## Dominio

El origen está declarado una sola vez, en `site-url.mjs`: `https://www.alexherrera.dev`, el dominio propio. Canonical, `hreflang`, Open Graph y sitemap salen de ahí sin tocar nada más, porque `src/lib/site.ts` lee el `site` que Astro ya resolvió. `PUBLIC_SITE_URL` sobrescribe ese valor por si una build tiene que apuntar a otro origen —un preview, una prueba local—, y por eso mismo, si quedó definida en el entorno Production de Vercel, gana sobre el dominio propio: ahí no debe estar.

La raíz negocia idioma: `vercel.json` manda a `/en` cuando `Accept-Language` empieza por `en` y a `/es` en el resto de casos, y `x-default` apunta a la raíz, que es para lo que ese valor está definido. Apuntarlo a `/es` diría que el español es el respaldo para todo el mundo, y los dos idiomas están al mismo nivel.

El sitemap lleva `<lastmod>`, sacado de git por `scripts/lastmod.mjs` a `src/lib/lastmod.json`. La fecha de cada página sale de **todo lo que esa página renderiza**, no solo de su plantilla: la portada y el índice de proyectos dependen del árbol de contenido, y las cuatro páginas fijas dependen de los diccionarios de i18n. Una fecha más vieja que el cambio real no es un fallo benigno — Google deja de usar `lastmod` en todo el sitemap cuando no le cuadra. El fichero **se versiona**: Vercel clona en superficie y allí `git log` da el commit de la frontera, no el real, así que `prebuild` detecta el clon superficial y no reescribe el fichero. El JSON va siempre un commit por detrás —no puede contener la fecha del commit que lo transporta—, y esa es la dirección segura: una fecha nunca más nueva que el cambio real. Si te molesta ver el árbol sucio tras un build, `pnpm lastmod` y commitea.

Los PDF del CV llevan `X-Robots-Tag: noindex`. Se siguen enlazando y descargando; lo que no hacen es competir con la propia web en una búsqueda por el nombre, ni exponer el correo y la dirección a los rastreadores.

Las tarjetas Open Graph se generan **en la build**, como endpoint estático (`src/pages/img/og/[...route].png.ts`), una por página y por idioma. La URL de la tarjeta espeja la de la página —`/img/og/es/proyectos/<slug>.png`— porque se construye con el mismo `path()` que produce los canonical: la lista que enumera las rutas es la lista que rellena los metadatos, así que una tarjeta no puede faltar ni quedar obsoleta. Antes eran dos ficheros versionados y regenerados a mano; una tarjeta hecha con el título y el área de una ficha tiene que seguir a esa ficha, y treinta y seis binarios regenerados a mano se desincronizan solos.

La tarjeta lleva el tono del área del proyecto en la regla superior y en los chips, leyendo los tokens de `src/app.css` en tiempo de build para no tener una segunda copia de la paleta. **No imprime el dominio**, precisamente para que un cambio de dominio no la deje mintiendo: lo que la atribuye es el nombre.

Las fuentes vienen de `scripts/fonts/` (Geist estática, OFL). Van ahí y no del paquete de Fontsource porque este publica solo `woff2` y la base de fuentes de resvg no lo lee: hasta ahora las tarjetas salían en Segoe UI. `pnpm og` ya no dibuja tarjetas, solo los iconos, que nunca dependieron del contenido.
