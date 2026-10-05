# Portafolio | Alex Herrera Manzanares

Sitio estático bilingüe construido con Astro 7: español bajo `/es` e inglés bajo `/en`, y la raíz redirige según el idioma del navegador. No hay servidor en producción: `pnpm build` deja HTML en `dist/`.

No usa ningún framework de interfaz. El sitio solo envía al navegador unos kilobytes de script propio, más `@vercel/analytics`, `@vercel/speed-insights` y la etiqueta de Google Analytics 4. El script propio es el conmutador de tema, la retícula de herramientas, el diagrama de capas y el raíl de la línea de tiempo. Sin JavaScript, el sitio sigue siendo legible: el tema sigue al sistema, los filtros se ocultan, todos los proyectos quedan a la vista y el diagrama muestra su primera capa.

## Órdenes

```bash
pnpm dev        # desarrollo
pnpm build      # build estático; falla si algún front matter rompe el contrato
pnpm preview    # sirve dist/ tal cual se publicará
pnpm check      # astro check (TypeScript strict)
pnpm sync:cv    # copia los PDFs del CV desde el repo del CV
pnpm og         # regenera los iconos (las tarjetas OG las hace el build)
pnpm lastmod    # refresca src/lib/lastmod.json desde el historial de git
```

`prebuild` ejecuta `sync:cv` y `lastmod` automáticamente. El primero copia los seis PDF (ciberseguridad · desarrollo · general, en dos idiomas) a `public/cv/` y distingue dos situaciones. Si el repositorio del CV no está en esta máquina, como pasa en un servidor de despliegue o en un clon nuevo, avisa y sigue con los PDF versionados. Por eso los PDF se versionan. Si el repositorio está pero falta un PDF, el build falla en lugar de servir en silencio una versión vieja.

La ruta de origen se puede cambiar con `CV_SOURCE_DIR`.

## Rutas

Las rutas de los dos idiomas tienen la misma estructura, con cada segmento en su idioma. La tabla de `src/lib/i18n/index.ts` es la única fuente: de ahí salen la navegación, el cambio de idioma, los `hreflang` y el sitemap. Ninguna página deduce su ruta de la URL, porque con `build.format: 'file'` la URL lleva el sufijo `.html`. Cada página declara su clave y la tabla resuelve el resto.

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

Zod valida el front matter (`src/content.config.ts`) **en el build**. Si algo está mal, `pnpm build` falla e indica el archivo y el campo, en vez de publicar una ficha rota.

```yaml
---
slug: kaizen-ai                 # debe coincidir con el nombre de la carpeta
title: Kaizen AI | Asistente inteligente
tagline: Una cláusula de 20 palabras o menos (el esquema admite 10–180 caracteres).
areas: [ia, seguridad]          # 1 a 3 de la taxonomía
kind: profesional               # profesional | academico | personal
org: Kaizen Apps CR             # o null; un calificador va tras una coma: Intercargo Panamá, vía Kaizen Apps CR
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
- Un proyecto `privado` **no puede** enlazar repositorio, porque el código es del cliente. Sí puede enlazar `site` cuando el producto es una web pública que cualquiera puede escribir en la barra de direcciones. La auditoría de privacidad es un fallo de build, no una lista que alguien recuerda repasar.
- Como máximo 4 proyectos destacados en todo el sitio.
- `period.end` no puede ser anterior a `period.start`. Un `YYYY` suelto se ordena a mitad de año, porque no dice más.
- `cover`, si existe, empieza por `/img/`.
- Si existe `es.md` debe existir `en.md`, y al revés, con el mismo `tier`, el mismo `home` y el mismo diagrama.
- **Un `.md` que declare `diagram` falla el build**: el diagrama necesita `.mdx` para poder colocarse, y un fallo silencioso lo dejaría fuera de la página.

`order` decide una sola cosa: en qué orden salen los cuatro destacados de la portada. `/proyectos` va siempre por fecha, del más reciente al más antiguo, y cada grupo de organización aparece según la fecha del trabajo más reciente que contiene.

`org` lleva el nombre de la organización y, si hace falta, un calificador tras la primera coma: «Intercargo Panamá, vía Kaizen Apps CR». `src/lib/org.ts` separa por esa coma para agrupar las fichas en `/proyectos`, para la tarjeta Open Graph y para resolver el logotipo. Por eso el nombre de una organización no puede llevar comas.

### Cómo se escribe el cuerpo

Todas las fichas siguen la misma estructura: **Contexto → Problema → Decisiones técnicas → Arquitectura → Resultado → Lo que aprendí**. Los proyectos privados solo llevan capturas de pantallas públicas, así que la sección de arquitectura es la que explica el sistema.

Las reglas de redacción valen tanto como el contrato de datos. El registro es el de un documento de ingeniería: neutral y declarativo, con una afirmación por oración.

Cada sección contesta una pregunta, y esa pregunta decide dónde va cada frase:

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
- Tecnicismos solo donde explican el stack o una decisión. La tagline es una cláusula de 20 palabras o menos y no lleva tecnicismos, porque es el texto más leído del sitio. `AST`, `REPEATABLE READ` y similares se dicen en palabras.
- Oraciones de 25 palabras o menos. Por encima de 32 hay que partirlas.
- Los títulos nombran la cosa, y lo que la hace interesante va en la tagline. Separador `|` o `,`, nunca raya, y ambas mitades en mayúscula inicial.
- Una URL en producción no es una «demo». El campo es `site` y la etiqueta, *Sitio en producción*.
- Nada de reclamos de exclusividad ni de velocidad, y ninguna métrica de negocio del cliente: solo cifras técnicas del propio trabajo.
- El texto de experiencia en `src/lib/about.ts` y la lista de proyectos tienen que nombrar el mismo conjunto. Si la experiencia nombra un sistema, ese sistema necesita ficha.
- Nada que describa una debilidad explotable de un sistema en producción de un cliente. El sitio es público.

`ArchDiagram.astro` dibuja una cadena de etapas con una etapa de control, donde se aplican varias reglas a la vez. Los datos van en el campo `diagram`: de 2 a 6 `nodes`, `gate` con el índice de la etapa de control y de 2 a 4 `layers`. El cuerpo lo coloca con `<ArchDiagram {...frontmatter.diagram} />`. El diagrama enuncia la regla y el cuerpo explica la consecuencia, y ninguno de los dos repite al otro. Las capas no van numeradas, porque se aplican todas a la vez en la etapa de control y no forman una secuencia.

**Sus estilos están en `src/app.css`, no en el componente.** Astro no propaga el CSS con ámbito de un componente `.astro` importado dentro de un `.mdx` que se renderiza con el `render()` de la capa de contenido. El marcado sale con su `data-astro-cid-*`, pero la hoja de estilos no se enlaza en ninguna parte, ni en desarrollo ni en el build. El diagrama estuvo así, sin estilo, en seis fichas publicadas. Cualquier componente nuevo que se use desde una ficha `.mdx` tiene el mismo problema, y sus estilos van también a `app.css`.

## Añadir un artículo

Los artículos del blog son una colección aparte, con la misma forma de carpeta que los proyectos y las dos versiones de idioma obligatorias:

```
src/content/articles/<slug>/
├─ es.mdx
├─ en.mdx
├─ prompt.es.md          (opcional; el prompt copiable)
├─ prompt.en.md          (opcional)
└─ notas-de-imagen.md    (opcional; el cargador no lo lee)
```

Siempre `.mdx`, aunque el artículo no importe ningún componente. Así el cargador tiene un solo patrón, y añadir un `Callout` después no obliga a renombrar el archivo.

```yaml
---
slug: revisar-codigo-generado-por-ia   # debe coincidir con el nombre de la carpeta
title: Ocho cosas que revisar en el código que genera la IA
tagline: Una cláusula de 20 palabras o menos (el esquema admite 10–180 caracteres).
description: null                      # 50–160 caracteres para el buscador, o null = usa la tagline
areas: [seguridad]                     # 1 a 3 de la misma taxonomía que las fichas
category: seguridad-web                # sección del blog: seguridad-web o programar-con-ia
lead: false                            # true = artículo por el que empieza su sección
published: '2026-09-07'                # YYYY-MM-DD
updated: null                          # YYYY-MM-DD o null
draft: true                            # true = solo se ve en `astro dev`
path: null                             # segmento de URL de ESTE idioma; null = usa el slug
repo: null                             # repositorio de demostración, o null
related: [kaizen-ai]                   # slugs de fichas existentes, o []
cover: null                            # ruta bajo /img/ o null
instagram: null                        # URL de www.instagram.com de la publicación o el reel, o null
promptTitle: null                      # título del panel del prompt; null = «Configurar entorno»
promptMinutes: null                    # [mínimo, máximo] que tarda el prompt, o null
---
```

Reglas que el build hace cumplir:

- `slug` en minúsculas y guiones, y debe coincidir con la carpeta.
- Si existe `es.mdx` debe existir `en.mdx`, con el mismo `draft`, el mismo `published` y el mismo `related`.
- `updated` no puede ser anterior a `published`.
- `category` y `lead` son iguales en los dos idiomas, y cada sección tiene como mucho un artículo con `lead: true`.
- `path` en minúsculas y guiones, y no puede repetirse entre dos artículos del mismo idioma.
- `related` solo admite slugs de fichas que existan. Un enlace roto es un fallo de build, no un 404 en producción.

**`path` es la dirección del artículo en ese idioma y se declara por archivo.** El `slug` sigue siendo la carpeta y la identidad interna, y `path` es solo lo que se ve en la barra de direcciones. Cuando es `null`, la ruta usa el `slug`, así que un artículo sin traducir la URL no cambia. Declararlo en `en.mdx` evita que un lector anglófono llegue a `/en/blog/revisar-codigo-generado-por-ia`, una dirección sin una sola palabra en su idioma.

Cambiar un `path` que lleve tiempo publicado obliga a redirigir el anterior desde `vercel.json`, porque esa dirección ya está indexada y compartida. Si el cambio ocurre a las pocas horas de publicar y nadie ha llegado todavía, un 404 sin enlaces entrantes no cuesta nada y la redirección sobra.

**`updated` es la fecha de la última edición y hay que ponerla a mano** cuando se corrige o se amplía un artículo ya publicado. Mientras es `null`, el artículo se describe solo con `published`. Con fecha, aparece en cinco sitios:

- la línea de datos de la cabecera del artículo, salvo que coincida con `published`;
- `dateModified` en los datos estructurados;
- `article:modified_time` en Open Graph;
- `<lastmod>` en el sitemap;
- `atom:updated` en el feed, porque RSS 2.0 no tiene fecha de edición.

La fecha declarada **tiene prioridad sobre la del historial de git**, porque es la que afirma el autor. El historial queda de reserva para los artículos que no la declaran.

**`category` decide en qué sección del blog aparece el artículo.** La sección decide también su color en la tarjeta del blog y en la página del artículo, aunque `areas` diga otra cosa. `seguridad-web` usa el color del área de seguridad, y `programar-con-ia`, el de IA. Fuera del blog, la tarjeta toma el color de su primera área.

La página del blog muestra primero el artículo con `lead: true`, marcado con «Empiece aquí», y después el resto por fecha. «Artículo anterior» y «Siguiente artículo» recorren la sección en ese mismo orden. Una sección sin artículos publicados no aparece.

Añadir una sección nueva toca `src/lib/categories.ts` (el identificador y su área) y `blog.categories` en los dos diccionarios. El orden de la lista de `categories.ts` es el orden de la página. Todo artículo de seguridad web es complementario de `como-proteger-una-pagina-web`, así que va en `seguridad-web` y se enlaza desde su capa.

**`description` es solo para el buscador.** Cuando tiene valor, sustituye a la tagline en `<meta name="description">`, en la descripción de Open Graph y en `TechArticle.description`. La tagline sigue en las tarjetas, bajo el título, en el feed y en `/llms.txt`. Existe porque las dos piezas tienen reglas opuestas. La tagline no admite jerga. El fragmento de un resultado, en cambio, tiene que contener lo que la gente teclea, a menudo un código de error o un ajuste como `ERR_PNPM_IGNORED_BUILDS` o `allowBuilds`. Se usa cuando Search Console muestra una consulta que la tagline no nombra.

**`instagram` enlaza la versión corta del artículo.** Con valor, el enlace aparece en la cabecera, junto al del repositorio, y en el bloque «Siga el trabajo» del final. Sin él, el bloque del final enlaza al perfil y la cabecera no muestra nada. Sirve tanto un carrusel (`/p/…`) como un reel (`/reel/…`), y los dos idiomas apuntan a la misma publicación.

**`promptTitle` y `promptMinutes` acompañan al prompt copiable.** `promptTitle` es el título del panel en ese idioma, de 3 a 40 caracteres; con `null`, el panel usa el de la interfaz, «Configurar entorno». `promptMinutes` es lo que tarda en ejecutarse el prompt, como `[mínimo, máximo]` en minutos, y se muestra junto al botón.

### Cuándo se muestra el blog

Un blog con un solo artículo parece abandonado, así que la sección no se muestra hasta que haya algo que leer. Mientras no exista ningún artículo publicado, el sitio oculta el enlace del menú, el bloque de la portada, las entradas del sitemap y el `<link>` del feed. Además, sirve `/es/blog` con `noindex`. Todo depende de `hasArticles()` en `src/lib/articles.ts`, así que el menú, el feed y el sitemap toman la misma decisión.

Un artículo en `draft: true` se ve entero en `astro dev` y no existe en el build. Publicar es cambiar esa línea.

### Cómo se escribe el cuerpo

Se hereda todo lo de las fichas: registro de documento de ingeniería, una afirmación por oración, 25 palabras o menos y 32 como techo, sin metáforas ni cierres aforísticos. Si una oración podría aparecer sin cambios en otro artículo, sobra.

Reglas propias del blog:

- **El título de un artículo sí describe.** Las fichas nombran la cosa; un artículo nombra lo que el lector se lleva, y tiene que coincidir con algo que la gente teclea en un buscador. «Cómo validar permisos en un ERP multiempresa» se busca; «reflexiones sobre mi stack» no.
- **Sin primera persona.** Nada de «he tenido que corregir», «me pasó», «en mi experiencia». Un artículo es una recomendación general con información verificable, no una anécdota. La primera persona se queda en la interfaz del sitio, que sí es su voz.
- **Cada punto termina en algo comprobable:** una petición, una prueba o una salida que el lector puede reproducir. Un punto que solo aconseja se borra.
- **Cada afirmación cuantificada lleva referencia**, y la referencia se abre antes de citarla para comprobar que dice lo que se le atribuye. OWASP, CWE, la documentación oficial de la herramienta y el paper original sirven; un blog que resume a otro, no.
- **Todo identificador de ejemplo que se resuelva contra un registro público se comprueba antes de publicar.** El texto dice que está inventado y con qué fecha se comprobó. Un nombre de paquete elegido a ojo puede existir: el primer artículo usaba `react-secure-input` como ejemplo de paquete alucinado, y resultó ser un paquete real y con autor. Vale para nombres de paquete, dominios, cuentas y direcciones de repositorio.
- **Ninguna afirmación de comportamiento se escribe de memoria.** Si el texto dice que una orden devuelve algo, la orden se ejecuta; si dice que una herramienta hace algo, se abre su documentación. Un artículo indexado se corrige mal y se cita peor.
- **Decisiones, no incidentes.** Lo que aportan los proyectos reales es la regla que se adoptó, enunciada como principio y sin nombrar el sistema. Un fallo concreto que tuvo un producto de un cliente no entra, aunque esté corregido y aunque se cuente en abstracto.
- **El carrusel no es el artículo resumido.** El carrusel entrega la lista completa y utilizable; el artículo entrega el código, la captura del fallo y la comprobación.
- **Una comparación describe configuraciones, no bandos.** Cuando un artículo compara dos herramientas, tiene que decir cómo se consigue el comportamiento seguro en las dos, con su coste. Una tabla de valores por defecto se lee como un veredicto si no aclara que son valores por defecto y no capacidades. El artículo de npm y pnpm dedica un punto entero a la configuración de npm por esta razón.
- **La versión en español se escribe en español, no se traduce del inglés.** Un calco literal se reconoce porque el término no significa nada fuera de su idioma original. «Tubería» por *pipeline* es una cañería, no una cadena de integración. «Cerrar puertas» traslada el impacto de *backdoor*, que en español no tiene. «Correr un comando» viene de *run*, cuando el verbo es ejecutar. Lo mismo vale para las metáforas que solo funcionan traducidas. Si el término técnico no tiene equivalente asentado, se deja el original en cursiva y se explica una vez.
- **Una afirmación sobre una herramienta nombra la versión exacta que se midió.** «pnpm bloquea los scripts» es falso en la 9, un aviso en la 10 y un error en la 11. La versión que se probó va en el texto, no solo en la tabla.
- **El artículo no habla de sí mismo ni cierra con una frase de efecto.** Nada de «este artículo no trata de», «conviene decirlo porque el texto sería falso si se callara» ni «la primera mitad… la segunda…». Tampoco se remata un punto ya explicado con un aforismo: «no es una regla, es una esperanza» sobra cuando la frase anterior ya lo dijo. Cada párrafo hace un solo trabajo: cuál es el problema, el código que lo enseña, qué lo corrige, cómo se comprueba.
- **Los verbos son literales.** No se *gasta* una petición, no se *apaga* una comprobación, no se *esquiva* un tipo y el código no *explota*. Se usa, se desactiva, se salta, falla.
- **La entrada de un artículo enuncia el problema, no lo narra.** «Un asistente escribe en una tarde más código del que nadie revisa en una tarde» describe una escena. «La cantidad de código que un asistente produce por unidad de tiempo supera a la que un equipo puede revisar» describe el mismo hecho y se puede discutir. La forma narrativa aparece sobre todo en la primera frase, en los arranques de sección y en los remates, y hay que buscarla ahí. La prueba es si la frase admite una medida: una escena no admite ninguna.
- **Quitar la redundancia no es quitar la explicación.** Una afirmación se enuncia una sola vez y con su causa completa. No basta «sin ese dato el modelo añade otra librería»: hay que decir además por qué importa, que es que el proyecto termina manteniendo dos formas de validar. Sobra repetir lo dicho con otras palabras, y cuando el texto queda seco le falta el porqué. Cada punto tiene que poder leerse entero sin consultar nada fuera del artículo.
- **Un término técnico se explica en una cláusula la primera vez que aparece.** «Una plantilla etiquetada es una cadena con `${}` que se pasa a una función» basta, sin un párrafo aparte. El lector que no conoce el término tiene que poder seguir sin buscarlo fuera.
- **Las instrucciones al lector van en imperativo de usted.** «Escriba el manejador sin el `parse` y ejecute `tsc`», no «escribe el manejador y ejecuta». El tuteo baja el registro. La explicación va en voz activa, con un sujeto claro: el agente, git o el compilador. La voz impersonal es el formato del CV, no el del blog.

Una regla no admite excepciones: **todo el código de un artículo está reconstruido para el artículo**. Nada sale de los repositorios de Intercargo, Star Cargo ni Kaizen. Un artículo indexado es público y permanente, así que ningún ejemplo describe una debilidad concreta de un sistema en producción de un cliente.

### Citas y referencias

`[1]` suelto en Markdown es texto, no un enlace. Sin una definición `[1]: url` no enlaza a nada, y con ella apuntaría fuera en lugar de a la lista. Por eso las citas son dos componentes.

`Cite.astro` marca la cita en el punto donde se afirma, pegada a la última palabra y antes del punto:

```mdx
… no salieron mejor parados que los pequeños<Cite n={1} />.
```

Sale como un superíndice `[1]` en el color del área, enlaza a `#ref-1` y lleva `id="cite-1"` para que la referencia pueda devolver al lector al párrafo. Una misma fuente se puede citar varias veces, pero un `id` solo puede existir una vez en la página. Por eso la segunda cita y las siguientes llevan `repeat`, que las deja sin `id`, y la flecha de vuelta de la referencia apunta a la primera aparición.

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

El orden del arreglo es la numeración, así que **`n` en cada `<Cite>` tiene que coincidir con la posición del elemento**. El build no lo comprueba; lo comprueba `.claude/skills/verify/citas.py`.

### Componentes en el cuerpo

El cuerpo de un artículo puede usar `Callout.astro`, con las variantes `riesgo`, `correccion` y `nota`, además de `Cite` y `References`. **Los estilos de los tres están en `src/app.css`**, por la misma razón que los del diagrama: Astro no propaga el CSS con ámbito de un componente importado dentro de un `.mdx`.

`SecurityChecklist.astro` es la lista de comprobación de `como-proteger-una-pagina-web`. Sus capas siguen el mismo orden y los mismos nombres que la tabla del punto 1 y la fase 2 del prompt, así que las tres listas cambian juntas. El estado de las casillas se guarda en `localStorage` solo como comodidad para quien lee. Si el almacenamiento está bloqueado, la lista funciona igual, sin recordar nada.

`CorsSimulator.astro` es el simulador de `que-es-cors`, y su lógica está en `src/lib/cors-simulador.ts`. Reproduce lo que hace Chrome 153 con una petición `fetch` a `http://localhost:3000`. Cada combinación se contrastó con Chrome sin interfaz, y los mensajes de error son literales. Los estilos de los dos componentes también están en `src/app.css`.

Un artículo puede traer un prompt para copiar. Se escribe en `prompt.es.md` y `prompt.en.md`, junto a `es.mdx` y `en.mdx`, y el cargador no los toma por artículos porque solo lee esos dos nombres. `Article.astro` los busca con `import.meta.glob`. Si existe el del idioma, pone `PromptRail.astro` en el margen derecho, fijo al desplazarse igual que el índice; por debajo de 80rem, lo coloca justo después del índice.

El texto del prompt está dentro del componente, en un diálogo que abre «Ver el prompt completo», y el cuerpo del artículo no lo repite. Los dos botones de copiar leen ese mismo `<pre>`, así que lo que se ve es lo que se copia. Si el portapapeles falla, el diálogo se abre con el texto seleccionado para copiarlo a mano.

Una captura dentro de un artículo va en `public/img/blog/`, en WebP y al doble del ancho con que se muestra, para que el texto se lea nítido. Se inserta con `<figure class="shot">`:

- un enlace a la imagen completa;
- la imagen con `width`, `height` y un `alt` que describe lo que se ve;
- un `<figcaption>` que dice de dónde sale.

Sus estilos también están en `src/app.css`. La captura sale de una ejecución real. La de `entorno-completo-agentes` muestra el proyecto de ejemplo tras ejecutar el prompt en inglés, y la versión española enseña esos mismos archivos con los nombres y el texto del prompt en español, como dice su pie.

Un detalle de MDX rompe el build: **el enlace automático de Markdown, `<https://…>`, no existe en MDX**. Todo lo que empieza por `<` se intenta leer como JSX, así que una URL suelta va como `[url](url)` o dentro de un componente. El build falla con un error de sintaxis en la línea del enlace.

## Estructura

| Ruta | Qué hay |
|---|---|
| `src/content.config.ts` | el contrato de front matter |
| `src/lib/content.ts` | carga, valida y ordena los proyectos en build |
| `src/lib/articles.ts` | lo mismo para los artículos, más los minutos de lectura y la condición que muestra u oculta el blog |
| `src/lib/feed.ts` | el canal RSS, construido a mano como el sitemap |
| `src/lib/areas.ts` | taxonomía de las 6 áreas |
| `src/lib/org.ts` | separa el nombre de la organización de su calificador y resuelve su logotipo |
| `src/lib/i18n/index.ts` | tabla de rutas ES↔EN, que usan la navegación, el cambio de idioma, `hreflang` y el sitemap |
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

`format.ts` formatea las fechas en UTC a propósito. `new Date('2026-09-14')` ya es medianoche UTC, y formatearla en la zona local la mostraría como el día anterior en América.

## Decisiones de diseño

- **El color es semántico.** Una tonalidad **siempre** significa un área y nunca decora. Todo lo demás es tinta sobre papel, así que las seis etiquetas de área son lo único que resalta.
- **El color se usa poco.** El tono va en un punto, y las palabras de al lado dan el significado. La excepción es un control que el lector ha pulsado, donde el relleno marca su elección. Rellenar cada etiqueta convertía doce tarjetas en dos docenas de píldoras de color que competían con el texto que debían rotular.
- La insignia de disponibilidad tiene su propio token `--available`, declarado fuera del sistema de áreas, porque no es un área y no debe tomar prestado el tono de una.
- **Cada ficha lleva el tono de su primera área.** `accentStyle()` en `src/lib/areas.ts` fija `--accent`, `--accent-bg` y `--accent-line` sobre el envoltorio `.ficha`. De ahí los toman el rótulo de tipo, la regla bajo el título, el marcador de cada `h2`, el borde del aviso de proyecto privado, los enlaces y la etapa de control del diagrama. `:root` los declara en tinta, así que el resto del sitio no cambia. Como se resuelven contra los tokens `--area-*`, ya declarados en los tres bloques de tema, no hay ningún token nuevo que mantener en modo oscuro.
- **Las tarjetas llevan un filo de 2 px** en el tono de su primera área, que pasa de `--accent-line` a `--accent` al apuntarla. Es un tono por tarjeta, no una píldora rellena, así que sigue siendo el punto con otra forma.
- **Las secciones de la portada alternan `--paper` y `--paper-sunken`** para que la página no sea un solo plano.
- **La monoespaciada es para datos, no para rótulos.** Se queda en el stack, las direcciones de repositorio y el código. Los rótulos (`Organización`, `Rol`, `Correo`, `Experiencia`, el tipo de proyecto, la línea superior de las tarjetas) van en la sans a 0.8125 rem, en caja normal y sin tracking. La versalita monoespaciada de 11 px era más difícil de leer y hacía que todo pareciera una plantilla. La utilidad global es `.meta-label`, con ese nombre y no `.label`, porque `ToolGrid` ya usa `.label` con ámbito para el pie de cada tarjeta.
- Todos los logotipos se pintan en tinta, nunca en color de marca, por la misma regla. La UTN se dibuja más ancha que las demás porque su logotipo combina tres elementos donde los demás tienen uno, y a igual ancho su tipografía se leía visiblemente menor.
- Los tokens están en `src/app.css` en OKLCH. `:root` define el tema claro completo, y `@media (prefers-color-scheme: dark)` junto a `[data-theme="dark"]` redefinen solo los tokens.
- Tailwind está solo por su reset. `source(none)` desactiva su escáner: sin eso, un `display: flex` dentro de un `<style>` le hacía emitir una utilidad `.flex`, y una de esas utilidades chocaba con el `.sr-only` propio.
- **Los bloques de código toman de Shiki solo el color del texto**, de `--shiki-light` y `--shiki-dark` con `defaultColor: false`. El fondo sigue siendo el del sitio, así que un bloque de código se ve igual en una ficha y en un artículo.
- **Una tabla ancha se desplaza dentro de su propia caja.** Su ancho mínimo lo fija la celda más larga, y sin ese desplazamiento se saldría de la columna en un teléfono.
- **El artículo tiene tres columnas con márgenes iguales**, para que el texto quede centrado en la página y no el conjunto de texto e índice. El índice va en el margen izquierdo, pegado al texto. Por debajo de ese ancho no cabe en el margen y pasa entre los datos y el texto, que es donde sirve en un teléfono. Sin márgenes laterales, el índice y el botón del prompt se alinean con la columna del texto, no con el borde de la página.

## Comportamiento del cliente

- **Resonancia de área.** Apuntar con el ratón o tabular hasta algo que nombre un área fija `data-area-focus` en `<html>`. El CSS global mantiene a plena intensidad todo lo que comparte esa área, y el resto baja al 25 %. El efecto atraviesa los componentes a propósito: una píldora de la retícula de herramientas atenúa una tarjeta de proyecto. Cualquier elemento nuevo que pertenezca a un área necesita `data-areas` o `data-area` para participar.

  Solo la activa un puntero de ratón. En pantallas táctiles no se activa, porque nada la desactivaría después. Con el teclado se mantiene mientras la píldora tenga el foco, que es su función, y `Escape` la desactiva.
- **El raíl de `/proyectos`** se dibuja con la posición del scroll y no con un `IntersectionObserver`. Los grupos difieren hasta siete veces en altura, y ninguna banda del viewport sirve para todos. Además, el último grupo queda tan abajo que ninguna marca relativa al viewport lo alcanza, así que llegar al final de la página cuenta como llegar al final del registro. Ese código solo se puede verificar con scroll real, porque asignar `scrollTop` por script no genera eventos de scroll.
- **El índice de áreas de la portada enlaza a `/proyectos#area`.** El script de `/proyectos` lee el hash al cargar y en `hashchange`, y el filtro escribe el hash con `replaceState` cuando hay una sola área seleccionada. Así un área concreta se puede enlazar y compartir; con ninguna o con varias, la URL vuelve a la ruta limpia.
- **El índice del artículo** no repite el número del título, porque en la columna estrecha la cifra destacaba más que el texto que la sigue. Resuelve los títulos cuando el documento termina de cargar: el índice va antes del cuerpo, y al analizarse todavía no existen. El título activo es el último que ya pasó por debajo de la cabecera fija; sin esa banda, el primero se marcaba antes de estar a la vista. Un salto por ancla no siempre genera un evento de scroll, así que el índice también escucha `hashchange`.
- **Los scripts de cliente no importan nada.** Traer `brands.ts` para hacer una cuenta que ya está resuelta en build añadiría al navegador decenas de kilobytes de trazos SVG. La excepción es `CookieNotice.astro`, que importa `consent.ts` y `analytics.ts`, de unas decenas de líneas.
- El tema se aplica antes del primer pintado con un script en línea, para que el conmutador no parpadee. Si el almacenamiento está bloqueado, el tema sigue a `prefers-color-scheme`, y la elección del conmutador dura solo esa página. Una página a la que se llega por una transición de vista omite las animaciones de entrada.

## Privacidad y cookies

- **Aviso y consentimiento.** `CookieNotice.astro` aparece en todas las páginas con analítica (la propiedad `analytics` de `Layout.astro`). Google Analytics 4 se carga solo después de «Aceptar cookies». Vercel Analytics y Speed Insights se cargan siempre, porque según su documentación no usan cookies. «Aceptar cookies» y «Rechazar cookies» tienen el mismo peso visual, y «Cambiar cookies», en el pie y en `/privacidad`, reabre el aviso.
- **La decisión** se guarda en `localStorage` con la clave `consent`, junto a la fecha y una versión (`src/lib/consent.ts`). No caduca: el sitio no vuelve a preguntar mientras la persona no borre el almacenamiento local, salvo que cambie `CONSENT_VERSION`. Alex decidió el 2026-10-04 que fuera así. La guía de cookies de la AEPD recomienda no pasar de 24 meses, como buena práctica y no como obligación. Si cambian las cookies o su finalidad, suba `CONSENT_VERSION` y `PRIVACY_UPDATED` (`src/lib/i18n/privacy-es.ts`) para que el sitio vuelva a preguntar.
- **Rechazar** borra `_ga` y `_ga_*` en el host y en sus dominios padre y pone `ga-disable-<id>` (`stopAnalytics`, `src/lib/analytics.ts`). `gtag('config')` desactiva las señales de Google y la personalización de anuncios.
- **`?notrack=1`** sigue excluyendo el navegador de la medición y, como en ese navegador no se carga la analítica, también oculta el aviso.
- **`/privacidad` solo afirma lo que el código y los proveedores hacen.** Los plazos del Escáner salen de su repositorio (`src/store/cleanup.ts` y `migrations/001-initial.sql`: 30 días y 48 horas). Las cookies de Google salen de la ayuda de Google Analytics, y lo de Vercel y Cloudflare, de su documentación de privacidad. Lo único sin plazo propio es lo que el navegador guarda hasta que la persona lo borra y los informes agregados de Google Analytics, y la página lo dice con esas palabras.
- **Al añadir una herramienta que guarde o envíe datos**, añada su fila en las tablas de plazos y de almacenamiento local de `privacy-es.ts` y `privacy-en.ts`. `privacy.test.ts` exige la misma estructura en los dos idiomas.
- **Pendientes que solo puede resolver el responsable del sitio:** comprobar en la propiedad de Google Analytics el ajuste de retención de datos (2 o 14 meses) y los ajustes para compartir datos con Google. La página afirma «como máximo 14 meses», que es cierto con cualquiera de los dos. Además, un abogado debería revisar el texto, sobre todo por las visitas desde la Unión Europea.

## SchemaFlow

Todo el código vive en `src/lib/schemaflow/` y la página en `src/components/pages/SchemaFlow.astro`. El diseñador no tiene servidor: el diseño se guarda en `localStorage` (`sf:v1`), y la versión base de una migración en `sf:base`, que solo se borra con «Nuevo diseño», que ya pide confirmación. Cargar una plantilla o abrir un archivo la conserva, porque la base es una versión que el usuario guardó a propósito y ojear plantillas y deshacer es un uso normal. El diálogo muestra el nombre y la fecha de la base para que se note si ya no corresponde al diseño.

### Migraciones

- **Emparejado por id y después por nombre.** `model/diff.ts` empareja primero las tablas y las columnas por su id y, con las que sobran, por su nombre sin distinguir mayúsculas. Un cambio de nombre solo se reconoce cuando la base es una versión guardada del mismo diseño, porque conserva los ids. Con SQL pegado o con un archivo ajeno los ids son nuevos, y un cambio de nombre se ve como una eliminación y una creación. El diálogo lo avisa.
- **La bajada es la subida con los esquemas invertidos.** `dialects/migrate.ts` genera una sola dirección y `migration-dialog.ts` la llama dos veces.
- **Orden de las sentencias.** Primero se quitan las claves foráneas, los índices, las restricciones únicas y la clave primaria que cambian; después las columnas y las tablas eliminadas; luego los cambios de nombre y de columna; y al final se crean tablas, columnas, claves y claves foráneas. Una relación se elimina y se vuelve a crear si cambia el tipo de una de sus columnas o la clave primaria de su tabla destino.
- **Nombres de restricciones sin nombre explícito.** PostgreSQL usa su convención (`tabla_columna_key`, `tabla_pkey`), MySQL el nombre de la primera columna y SQL Server busca el nombre en el catálogo. Las claves foráneas usan el nombre que genera SchemaFlow, así que si la base real las nombró de otra manera, el `DROP CONSTRAINT` falla en voz alta. Se prefiere ese fallo a un `IF EXISTS` que dejaría la restricción sin avisar.
- **MySQL** redefine la columna entera con `MODIFY COLUMN`, y no envuelve el script en una transacción porque confirma cada sentencia de definición por su cuenta.
- **SQL Server** separa lotes con `GO` tras añadir, modificar o renombrar una columna, porque un lote que nombra una columna recién añadida no compila. Los valores por defecto y las claves sin nombre se buscan en el catálogo con `DECLARE @m1`, `@m2`…, numeradas porque la variable vive en el lote. No puede cambiar `IDENTITY` en una columna existente, y lo avisa en lugar de generar SQL.
- **Advertencias.** Se clasifican en *peligro* (pérdida de datos: eliminar tabla o columna, estrechar un tipo) y *precaución* (puede fallar con filas existentes: columna obligatoria sin valor por defecto, clave única o foránea nueva). La clasificación de tipos es `classifyTypeChange`, en `model/diff.ts`.
- **Orden de las eliminaciones.** Las tablas que se eliminan juntas salen ordenadas para que cada tabla caiga antes que las tablas a las que apunta (`dropOrder`). Si dos tablas se apuntan entre sí, se quita antes la clave foránea que cierra el ciclo. Sin esto, `DROP TABLE users` fallaba cuando `posts` aún dependía de ella.
- **Los nombres no salen de su sitio.** Los identificadores y las cadenas van entre comillas con el delimitador duplicado, y los avisos se escriben como comentarios `--` de una sola línea. Un nombre con saltos de línea, que puede llegar con un enlace compartido o con un archivo ajeno, no puede dejar una sentencia ejecutable fuera de su comentario ni de sus comillas. `migrate.test.ts` lo comprueba con nombres hostiles en los tres motores, y `export.test.ts` hace lo mismo con los exportadores.
- **Verificación.** `migrate.test.ts` aplica `antes` y la subida en PGlite, crea `después` desde cero en otra instancia y compara el catálogo (columnas, restricciones, índices y comentarios). Hace lo mismo con la bajada. MySQL y SQL Server solo se prueban por el texto que generan, porque no hay un motor ligero para ejecutarlos.

### Exportar como código

- **Prisma 7.** El `datasource` no lleva `url`: Prisma 7 la rechaza con `P1012` y la mueve a `prisma.config.ts`. El generador es `prisma-client` con `output`. Se comprobó con `prisma validate` 7.10.0 en los tres proveedores.
- **Nombres.** Cada modelo toma el nombre de la tabla en PascalCase, sin singularizar: no hay una regla fiable que sirva para español e inglés (`statuses` dejaría `Statuse`). `@@map` conserva el nombre original.
- **Relaciones de Prisma.** El campo de relación lleva el nombre de la columna sin `_id`. Si hay más de una relación entre las mismas tablas, o una relación con la misma tabla, se nombran con `@relation("…")` en los dos lados. Una clave foránea única se exporta como relación uno a uno.
- **Sin forma portable.** Los tipos `raw` pasan a `Unsupported` en Prisma y a `unknown` en TypeScript y Zod. Los valores por defecto calculados se omiten, y las expresiones van a `dbgenerated`.
- **Drizzle** admite PostgreSQL y MySQL, no SQL Server. Las columnas `bigint` usan el modo `number`. Una clave foránea de una columna va en línea con `.references`; las compuestas y las que apuntan a su propia tabla van con `foreignKey`.
- **TypeScript y Zod** usan el nombre de la columna como clave, porque describen la fila tal como la devuelve el controlador. Los decimales son texto, como los devuelven PostgreSQL y MySQL, y `bigint` es `number`. Cada tabla tiene un tipo de fila y otro de inserción, donde son opcionales las columnas con valor por defecto o que admiten nulos.
- **MongoDB** no se exporta a ningún formato.
- **Verificación.** Las salidas de `export.test.ts` se pasaron por `prisma validate`, `tsc` con `drizzle-orm` y `zod`, la lectura de `getTableConfig`, la validación de datos con Zod y el analizador `@dbml/core`. La prueba escribe esas salidas en la carpeta de `SF_DUMP` si la variable está definida.

### Consulta en PostgreSQL

- **Una sola sesión para todo.** El panel de código de PostgreSQL ejecuta una consulta sobre el esquema con PGlite, dentro de un worker. `validate/pglite.ts` define `PostgresSession`, que conserva un worker ya iniciado entre ejecuciones, y el botón «Probar en PostgreSQL» usa esa misma sesión. La primera ejecución paga el arranque y las siguientes tardan unos 50 ms. Cada ejecución simultánea recibe un worker propio, y solo se conserva uno inactivo.
- **Cada ejecución parte de una base vacía sin crearla de nuevo.** `execute`, en `validate/pglite-run.ts`, abre una transacción, aplica el código y la consulta, y la revierte. El DDL de PostgreSQL es transaccional, así que tablas, tipos, dominios, funciones, esquemas, roles y comentarios desaparecen con la reversión. Después `settle` ejecuta `DISCARD ALL`, que limpia los ajustes de la sesión, y compara una huella del catálogo con la del motor recién iniciado. La huella es el recuento de filas de 29 catálogos de sistema.
- **Cuándo se descarta el worker.** Si la huella difiere, por ejemplo cuando el script trae su propio `COMMIT` y deja objetos o ajustes persistentes. También tras 40 ejecuciones, tras un resultado de más de 20 000 filas y tras una ejecución de más de 3 s, porque la memoria de WebAssembly solo crece. Un tiempo límite de 20 s o el botón «Detener» terminan el worker, porque una consulta en marcha no se puede interrumpir de otra forma, y la siguiente ejecución arranca uno nuevo.
- **Cuándo se libera.** A los 5 minutos sin uso, al cerrar el panel de consulta y al salir del dialecto PostgreSQL.
- **Los valores se muestran como los imprime PostgreSQL.** `execute` pasa a `exec` un analizador de texto para cada tipo de `db.parsers`, salvo `boolean`, que se escribe `true` o `false`. Sin eso, PGlite convierte un `timestamp` en un `Date` con la zona horaria del navegador, y las 12:30 se mostraban como las 18:30. El `affectedRows` de PGlite es acumulado entre las sentencias de una misma llamada. Si ninguna devuelve filas, el panel muestra ese total. Un script de filas de ejemplo termina en un bloque `DO` con `setval`, y la cuenta de su última sentencia daba 0.
- **Coste medido.** Los recursos de PGlite pesan 17,4 MB sin comprimir y 5,5 MB por la red con la compresión de Vercel (`pglite-*.wasm` 3,4 MB, `pglite-*.data` 1,8 MB, `initdb-*.wasm` 0,15 MB y el worker 0,12 MB). Solo se descargan en la primera ejecución. Sus nombres llevan hash y se sirven con `immutable`, así que un visitante que ya los tiene no los vuelve a pedir mientras no cambie la versión de PGlite. El primer arranque tardó entre 1,3 y 4,9 s en el mismo equipo según su carga, y las ejecuciones siguientes entre 49 y 70 ms en total, de los cuales unos 20 ms son el esquema y menos de 10 ms la consulta. Comprimir en local con brotli al máximo da 3,9 MB, pero Vercel comprime con un nivel menor, así que la cifra que cuenta es la medida en la red.
- **Altura del dock.** Con el panel de consulta abierto, `.sf-dock:has(.sf-query[open])` se desplaza y el editor conserva al menos 9 rem. Sin esa regla, el editor de la hoja inferior del móvil se quedaba en 0 px, porque el panel no encoge. Los hijos de `.sf-query-body` tampoco encogen, o el cuadro de la consulta se aplastaba a una línea.
- **Verificación.** `pglite-run.test.ts` usa PGlite real y comprueba que un mismo motor ejecuta el mismo script varias veces sin dejar rastro, que se recupera de errores, de transacciones sin cerrar y de ajustes de sesión, y que detecta un `COMMIT` que deja una tabla, un rol o un ajuste. `pglite-session.test.ts` usa un worker simulado para comprobar la conservación, el relevo, el tiempo de inactividad, «Detener» y el tiempo límite.

### Tipos de columna

- **Un solo catálogo.** `ui/types.ts` define `TYPE_CHOICES`: nueve tipos comunes, que son los de las fichas del panel «Elementos», y ocho más que salen bajo «Más tipos». El selector del lienzo, el del panel de propiedades y las fichas leen de ahí. Antes eran tres listas distintas, y el filtro solo comparaba con el nombre SQL, así que escribir «fecha» no encontraba nada.
- **Búsqueda.** `searchTypes` compara con la etiqueta en el idioma de la interfaz, el nombre SQL, el nombre nativo del dialecto y unas palabras clave en español e inglés, sin distinguir tildes. Ordena por coincidencia exacta, prefijo, inicio de palabra y contiene. Si el texto se entiende como un tipo (`parseTypeText`), la primera opción es «Usar «varchar(80)»». No se ofrece con un tipo propio del dialecto (`raw`), porque `parseTypeText` devuelve `raw` para cualquier nombre que no conoce, y por eso la búsqueda va antes que el análisis.
- **Cada tipo se explica por lo que es.** «Un día del calendario» vale para cualquier fecha. Un ejemplo de uso, como «cumpleaños», hacía pensar que el tipo sirve solo para eso. Los textos están en `types.choices`, en los dos idiomas.
- **Longitud, precisión y escala** tienen ahora tres campos en el panel de propiedades. La longitud sirve a `varchar` y `char`; la precisión y la escala, a `decimal`. Un número no válido muestra un mensaje en línea.
- **Verificación.** `types.test.ts` comprueba que cada opción se lee a sí misma en los cuatro dialectos y que las fichas del panel reciben los mismos tipos lógicos. También prueba la búsqueda por el nombre en español y en inglés, con tildes, con una longitud escrita tras el nombre, por el nombre nativo y con una palabra desconocida.

### Consultas listas y editor

- **Las consultas salen del esquema.** `ui/query-snippets.ts` genera, para la tabla elegida, consultas en seis grupos: ver datos, filtrar y ordenar, unir tablas, contar y agrupar, cambiar datos y estructura. Los identificadores pasan por `quote('postgres', …)`. La columna de cada consulta se elige por tipo y por nombre (`NAME_LIKE`, `STATE_LIKE`): una consulta que no tiene columna adecuada no se ofrece.
- **Filas de ejemplo.** `ui/sample-rows.ts` inserta 3 filas por tabla y se probó con diseños que no son las plantillas (véase «Filas de ejemplo para cualquier diseño»). Los valores siguen el tipo, la longitud, la precisión y el nombre de la columna (correo, URL, estado, nombre…). **Las columnas de claves llevan siempre un valor explícito**, tengan o no valor por defecto: la clave primaria, las claves únicas, los índices únicos y las columnas que une una relación, en los dos lados. Sin eso, una tabla hija no podría saber el id que PostgreSQL generó para la tabla padre, y con `gen_random_uuid()` no hay forma de adivinarlo. El resto de columnas con valor por defecto se omiten y la base escribe el suyo. Decide `supplied`, con las mismas funciones que escriben el DDL (`identitySql`, `defaultSql`): un valor por defecto del modelo que el DDL no escribe, como un autoincremento en una columna que no es entera, no cuenta, y la columna se rellena. Si una columna identidad recibe un valor, el `INSERT` lleva `OVERRIDING SYSTEM VALUE`, que sirve también con `GENERATED ALWAYS`. Después, un bloque `DO` con `setval` evita que un `INSERT` sin id choque con 1, 2 y 3.
- **Orden y ciclos.** `insertionOrder` coloca antes las tablas de las que otras dependen. Añade primero las relaciones obligatorias (todas sus columnas son `NOT NULL`) y después las opcionales, y descarta la que cerraría un ciclo: sus columnas valen `NULL`. Así `departments.manager_id` y `employees.department_id`, que se apuntan entre sí, se rellenan enteras con el lado opcional vacío. En una autorreferencia, la primera fila lleva `NULL`, o apunta a sí misma si la columna es obligatoria.
- **«Eliminar una fila» solo se ofrece si borrar puede salir bien.** `removable` recorre las relaciones que apuntan a la tabla. Con `CASCADE` comprueba también las tablas hijas. `SET NULL` solo sirve si todas las columnas de la relación admiten nulos y no forman parte de la clave primaria: antes se aceptaba cualquier `SET NULL`, y borrar fallaba con `23502`. Poner esas columnas a `NULL` es también un cambio de clave, así que `survivesChange` sigue los `ON UPDATE` de las relaciones que las apuntan: `CASCADE` y `SET NULL` propagan el `NULL` a su tabla de origen, y `NO ACTION`, `RESTRICT` y `SET DEFAULT` lo rechazan. `RESTRICT`, `NO ACTION` y `SET DEFAULT` lo impiden, porque la fila de ejemplo tendría hijas. En ese caso PostgreSQL responde `23001`, no `23503`.
- **«Cambiar el valor de una columna» no toca lo que sostiene una regla.** `update` salta las columnas de clave, únicas, calculadas, de identidad, las que une una relación y las que cita un CHECK, y escribe el valor que esa columna tiene en la fila 2. Con un valor inventado, como `99`, un `decimal(3,2)` desbordaba.
- **Editor.** `code-editor.ts` crea el editor de consultas con CodeMirror. `sql({ schema })` recibe las tablas y columnas del diseño, y `autocompletion` pinta la lista en `document.body`, porque el dock tiene `overflow` y la recortaría. Ctrl/Cmd+Enter ejecuta la consulta. `@codemirror/autocomplete` es una dependencia directa porque pnpm no deja importar una dependencia de otra. El error de PostgreSQL subraya su posición en el texto.
- **Errores en claro.** `Failure.code` (SQLSTATE) se traduce a una frase sencilla antes del mensaje de PostgreSQL: `22001`, `22003`, `22007`, `22P02`, `23001`, `23502`, `23503`, `23505`, `23514`, `42601`, `42702`, `42703`, `42804`, `42883` y `42P01`. El resto muestra solo el mensaje.
- **Coste medido.** Con el autocompletado, el trozo del editor sube 25 261 B sin comprimir (7 718 B con gzip) y queda en 493 263 B (163 742 B). El editor se carga con el panel de código, no con la página. El script principal pesa 228 276 B (65 921 B). Las consultas listas, las filas de ejemplo y la lectura de los CHECK van en un trozo aparte, `query-snippets`, de 30 607 B (10 703 B). El panel lo pide al abrirse, junto al editor, y antes de eso no calcula nada.
- **Verificación.** `query-snippets.test.ts` usa PGlite real. Con cada una de las 24 plantillas aplica el DDL y ejecuta el script de filas de ejemplo, de todas las tablas y de cada una. Después ejecuta cada consulta de cada tabla, y las que unen devuelven al menos una fila. También prueba un diseño raro (autorreferencia, ciclo, tabla puente, decimales pequeños, identidad, `GENERATED ALWAYS`) y nombres hostiles con saltos de línea y comillas. `messages.test.ts` comprueba que cada código de error y cada motivo de omisión tienen su texto en los dos idiomas.

### Filas de ejemplo para cualquier diseño

Las plantillas solo usan lo que el lienzo permite. Un lector también pega código con lo que el lienzo no tiene, como `CHECK`, enum, arreglos o claves que comparten columnas. Esta sección recoge qué se garantiza y qué no.

- **Qué se garantiza.** Con cualquier diseño que se pueda construir en el lienzo (tipos, claves primarias y únicas, claves foráneas, `NOT NULL`, valores por defecto, índices únicos, identidad y columnas calculadas), el script de filas de ejemplo no falla. Lo que no puede cumplir no lo escribe: omite la tabla y un comentario SQL dice cuál y por qué. Los motivos son cuatro. `unknown-type`: una columna obligatoria de un tipo sin valor de ejemplo, como `xml` o `pg_lsn`. `cycle`: la tabla necesita a otra que a su vez la necesita, con claves obligatorias en los dos lados, como `store` y `staff` en Pagila. `parent`: depende de una tabla omitida. `generated-key`: una relación usa una clave que la base calcula, y no se puede saber su valor.
- **Cómo se garantiza.** Antes de escribir un `INSERT`, el generador comprueba las filas contra las reglas del modelo, en JavaScript. `leadingDistinct` corta la tabla en la primera fila que repite una clave primaria, una clave única o un índice único: un booleano único da 2 filas, y una columna calculada única, 1. `leadingLinked` comprueba que cada clave foránea existe en la tabla padre, también cuando una columna pertenece a dos claves. `effectiveTypes` iguala las columnas unidas por una relación a la menor longitud y a la menor parte entera: un `varchar(10)` que apunta a un `varchar(3)` recibe un texto de 3 caracteres. Si una relación une tipos numéricos distintos (`bigint` con `double precision`) o temporales distintos (`timestamp` con `timestamptz`), toda la relación usa un valor que cabe en todos, un entero o una fecha sin zona. Un `1,5` en una columna `double` y un `2` en la columna `bigint` que lo apunta daban `23503`.
- **Un solo cálculo por diseño.** `sampling` calcula las filas de todas las tablas una vez por esquema y por idioma, y las guarda en un `WeakMap`. El script de una tabla, el de todas y los valores de las consultas (`sampleValue`) salen del mismo resultado, así que siempre coinciden. Con 200 tablas y 1 357 columnas tarda 23 ms la primera vez y 0,1 ms las siguientes.
- **Tipos con nombre.** `ENUM` y `DOMAIN` se leen de los extras del esquema: un enum toma sus etiquetas por turnos y un dominio toma el valor de su tipo base. Los tipos de PostgreSQL que el modelo guarda como `raw` y que tienen valor de ejemplo son `inet`, `cidr`, `macaddr`, `money`, `interval`, `oid`, `bit(n)`, `varbit`, los rangos, los geométricos, `tsvector`, `tsquery`, `json` y `jsonb`. Un arreglo recibe `'{}'`. Una columna `raw` que admite nulos y no tiene valor por defecto se omite del `INSERT`.
- **Restricciones CHECK.** `ui/sample-checks.ts` lee los `ALTER TABLE … ADD CHECK` de los extras, que es donde el analizador deja los CHECK, y los evalúa con la lógica de tres valores de SQL: un `NULL` no incumple. Entiende comparaciones, `AND`, `OR`, `NOT`, `IS [NOT] NULL`, `BETWEEN`, `IN`, `= ANY (ARRAY[…])`, `LIKE`, `ILIKE`, `~`, `~*`, `+`, `-`, `*`, `%`, `||`, `::` y las funciones `char_length`, `length`, `lower`, `upper`, `trim`, `abs` y `coalesce`. Lo que no entiende (otras funciones, `now()`, subconsultas) queda como desconocido y esa restricción se ignora. Las columnas que cita un CHECK se escriben siempre, aunque tengan valor por defecto, para poder evaluarlas.
- **Cómo se repara una fila.** Si una fila incumple una restricción, `repair` la arregla de una en una. Para cada restricción rota prueba los valores que ella misma nombra y sus vecinos: el límite, el límite más o menos el número de fila (una columna única recibe valores distintos), una lista rotada por fila, un texto de la longitud pedida o una fecha posterior. Cambia antes la columna más a la derecha de la tabla, que suele ser la «hasta» o la «actualizada», y resuelve juntas las restricciones que comparten columnas. Una columna que une una relación no se cambia. Si nada sirve, deja la fila como estaba.
- **Cuando no basta.** Un patrón como `^[0-9]{13}$`, una restricción entre tablas o un CHECK sobre una columna que es clave foránea siguen fallando con `23514`. El panel lo reconoce: si la consulta aún contiene el script generado, el error es de clase `22` o `23` (o `42804`, `42703`, `42P01`) y la tabla del error aparece en un `INSERT` de ese script, añade un aviso que dice que el error viene de las filas de ejemplo. Así no se atribuye al lector un error en valores que no escribió. `Failure.table` lleva desde PostgreSQL el nombre de la tabla.
- **Código editado.** Mientras el código del panel difiere del diagrama, las consultas listas se generan del texto y no del diagrama: el dock pasa al panel el esquema que sale de analizar el texto (`querySchema`). Antes, renombrar una columna en el código dejaba consultas que fallaban con `42703`. La tabla elegida se conserva por nombre, porque cada análisis crea identificadores nuevos.
- **Verificación.** `sample-rows.fuzz.test.ts` genera diseños al azar con una semilla fija y, con PGlite real, ejecuta el script de cada tabla, el de todas y cada consulta lista de las primeras tablas. Tiene cinco familias. `plausible`: diseños que construye la interfaz. `hostile`: nombres con comillas, palabras reservadas y Unicode, claves compuestas, tablas sin clave y sin columnas, tipos `raw`, enum, dominio, columnas calculadas, ciclos y diferencias de longitud y precisión entre columnas unidas. `checks`: la primera con restricciones CHECK. `typed`: SQL escrito a mano (`testing-sql.ts`) que pasa por el analizador, como el código que pega un lector. `session`: entre 12 y 70 acciones aleatorias de la interfaz (añadir tablas y columnas, cambiar tipos, relacionar con columnas nuevas o existentes, crear tablas puente, duplicar, borrar) aplicadas con las funciones de `model/ops.ts`. Cerca de un 20 % de esas secuencias dejan un diseño que PostgreSQL rechaza, y se descartan. Cada tabla omitida debe tener un motivo real, de modo que el generador no «pasa» omitiéndolo todo, y hay un mínimo de tablas rellenas por familia. Por defecto son 60 diseños por familia. `SF_FUZZ`, `SF_FUZZ_FROM`, `SF_FUZZ_TABLES`, `SF_FUZZ_FAMILIES` y `SF_FUZZ_STATS` cambian la cantidad, la semilla inicial, las tablas revisadas por diseño, las familias y la impresión de estadísticas. Con 300 diseños nuevos por familia y hasta 9 tablas revisadas por diseño, las 7 889 tablas de los diseños que PostgreSQL acepta salieron sin un solo fallo. La familia `session` encontró cuatro casos que las otras no vieron: una columna con autoincremento que no es entera, claves que unen tipos distintos, un `SET NULL` que se propaga por un `ON UPDATE CASCADE` y una clave compuesta con columnas opcionales cuya tabla de destino se omitía.
- **Diseños escritos a mano.** `sample-rows.test.ts` prueba esquemas con la forma de otros autores: uno al estilo de Chinook (nombres con comillas, identidad, autorreferencia, tabla puente), otro al estilo de Pagila (enum, dominio, arreglos, `tsvector`, valores por defecto y un ciclo de claves obligatorias entre `store` y `staff`), uno multiempresa en que una columna pertenece a dos claves compuestas, claves naturales y claves foráneas a columnas únicas, un ciclo que se rompe por el lado opcional, columnas calculadas, CHECK y nombres más largos de lo que admite PostgreSQL.
- **El evaluador se compara con PostgreSQL.** `sample-checks.test.ts` evalúa 400 predicados aleatorios sobre 6 filas aleatorias cada uno (`SF_CHECKS=3000` lo sube) y exige que el resultado coincida en cada fila que el evaluador se atreve a decidir.

### Plantillas

- **24 plantillas en 8 temas, tres por tema.** Comercio, logística e inventario, finanzas y facturación, educación, salud y bienestar, reservas y servicios, contenido y redes, trabajo y plataformas. Las 21 nuevas están escritas desde cero y son genéricas: ninguna parte de un esquema de un cliente ni de un empleador.
- **Formato.** `templates/template.ts`: cada plantilla lleva su tema y de una a tres etiquetas de un vocabulario cerrado de diez (muchos a muchos, jerarquía, estados, historial, pagos, reservas, valoraciones, roles, autenticación y multiempresa). Un vocabulario abierto daba decenas de chips con 24 plantillas; el cerrado sirve para buscar y para mostrar.
- **Puerta de calidad.** `templates.test.ts` exige a cada plantilla de 4 a 10 tablas con clave primaria, todas relacionadas. Los nombres de tablas y columnas van en inglés, con guion bajo. El nombre tiene hasta 40 caracteres y la descripción es de una frase, en los dos idiomas. No puede haber **ningún hallazgo en PostgreSQL (puntuación 100)** ni ningún error en MySQL ni en SQL Server. Cada clave foránea tiene su índice. El `ON DELETE` se eligió a propósito: `CASCADE` para lo que pertenece a la fila padre, `RESTRICT` para dinero e historial y `SET NULL` para lo opcional. Una clave primaria `TEXT` es un error bloqueante en SQL Server (`key-lob`), así que `saas.ts` usa `VARCHAR(64)` en `sessions.id`.
- **Rutas de cascada.** SQL Server rechaza dos rutas de cascada hacia una misma tabla. Si una tabla apunta dos veces a un mismo antepasado, la plantilla pone `RESTRICT` en la clave foránea secundaria. La puerta lo comprueba con el análisis de SQL Server, que no admite ningún error.
- **Carga.** `import.meta.glob` con `eager: true`. Abrir la galería pide un solo archivo de 52 691 B (10 716 B con gzip), con las 24 plantillas y la galería. Antes pedía 25 archivos: 24 de plantilla, con 45 177 B (15 467 B con gzip), y la galería, con 8 516 B (3 101 B con gzip).
- **Galería.** Los chips filtran por tema. Sin filtro ni búsqueda, las plantillas se agrupan por tema, con su título y su recuento. Cada título es un `li` a todo el ancho dentro de la misma cuadrícula, para que el movimiento con las flechas siga siendo lineal. La búsqueda cubre el nombre, la descripción, el tema, las etiquetas y los nombres de las tablas.
- **Verificación externa.** Las 24 plantillas se pasaron, fuera del repositorio, por `prisma validate` 7.10.0 en los tres proveedores (72 esquemas), `tsc --strict` con `drizzle-orm` y `zod` (72 archivos) y el analizador de `@dbml/core` (24 archivos).

### Elementos y herramientas del lienzo

- **Panel «Elementos».** Una ficha de tabla, diez de columna, tres de relación, nota y zona. Antes había tres fichas de tabla; «Con fechas» y «Catálogo» se quitaron porque no aportaban nada. El buscador (`ui/elements.ts`) compara con el nombre en el idioma de la interfaz y con sinónimos en los dos idiomas, sin distinguir tildes («foránea» y «1:N» encuentran la relación). En pantallas de hasta 699 px, «Elementos» está en el menú «…» y abre el mismo panel como una hoja inferior (`dialog.sf-elements`) que se cierra al elegir.
- **Una sola función crea las relaciones.** `model/relate.ts` define `planRelation`, que usan el cuadro «Relacionar tablas», el modo de dos clics, el conector de una columna y el conector con Alt. Con una clave compuesta enlaza la clave entera: el cuadro anterior enlazaba solo la primera columna. Un clic en una ficha de relación abre el cuadro con el tipo ya elegido, porque el modo de dos clics solo se guiaba con texto. Soltar la ficha sobre una tabla conserva ese modo. El cuadro avisa y desactiva «Crear relación» si la relación no se puede crear. Son los casos de muchos a muchos con una sola tabla, tabla sin clave, límite de tablas o de columnas y relación repetida. Antes fallaban sin avisar.
- **El cuadro se ancla en un punto fijo.** Desde el panel se abre junto a él, en la parte alta del lienzo. Anclado al puntero, cerca del borde inferior, el cuadro quedaba por encima del puntero y, al desplegar «Opciones avanzadas», crecía hacia arriba y se movía.
- **Buscador.** `model/search.ts` ordena por coincidencia exacta, prefijo, inicio de palabra (también en `snake_case` y `camelCase`) y contiene, con las tablas antes que las columnas, y admite la forma `tabla.columna`. Un término que solo coincide con el nombre de la tabla no lista sus columnas. Se abre con Ctrl/Cmd+K, con «/» si el lienzo tiene el foco, con la lupa de la barra y, en el móvil, desde el menú «…». Al elegir un resultado se selecciona, se encuadra y se enfoca la columna.
- **Alinear y repartir.** `model/align.ts`, con dos o más tablas seleccionadas. Las posiciones de alinear son exactas y las de repartir se redondean al entero. No se redondean a la cuadrícula de 8 px, porque así una alineación podía quedar hasta 4 px desviada. Repartir deja la misma separación entre bordes, con 1 px de diferencia como mucho por el redondeo, y nunca menos de 24 px. Aplicar una operación dos veces da el mismo resultado, y si nada se mueve, devuelve el mismo esquema. «Ordenar la selección» usa `autoLayout` con las tablas elegidas y la esquina superior izquierda de la selección como origen.
- **Columnas visibles.** Un botón junto al zoom y la tecla V recorren «todas las columnas», «solo las claves» y «solo los nombres». «Solo las claves» muestra las columnas de la clave primaria, las únicas y las que une alguna relación, más una fila «+N columnas». Es una preferencia de vista: se guarda en `sf:ui` y no entra en el archivo, el enlace compartido ni las exportaciones, que siguen con la altura completa. Las filas siguen en el DOM y el CSS las oculta, con `data-density` en `.sf-canvas` y `data-key` en cada fila. `ui/geometry.ts` calcula las mismas alturas y los anclajes de las relaciones (`cardHeight`, `anchorY`), y los usan el rectángulo de selección, el encuadre y «Ordenar». Si una columna no se ve, la relación se ancla al centro del encabezado. Añadir o editar una columna cambia a «todas las columnas», para que se vea. En las vistas compactas no se pueden reordenar las columnas, porque el índice de una fila visible no es el de su columna.
- **El botón «+ Tabla» de la barra se quedó sin texto** al entregar las migraciones. La regla `.sf-tool-label { color: var(--ink) }` era para las etiquetas de los diálogos, pero también alcanzaba al texto de los botones de la barra, que ya usaban esa clase. `--ink` es el mismo tono que el fondo `--action`. Las etiquetas de los diálogos pasaron a `sf-dlg-label`. `.claude/skills/verify/contraste.js` calcula la razón de contraste WCAG de cada control, etiqueta y texto de ayuda visibles, en los dos temas y con cada diálogo abierto, y debe dar `"failed":0`.
- **Clases de los diálogos.** Los diálogos de exportación y migración llevaban la clase `sf-tool` de los botones de la barra, y un reinicio (`dialog.sf-tool`) compensaba parte de sus reglas. Con esa clase, el diálogo también se pintaba con el fondo de un botón al pasar el puntero y mostraba el cursor de un botón. Ahora llevan `sf-dlg` y sus partes `sf-dlg-*` (`sf-controls` para una fila de controles); el tamaño de letra, la altura de línea y el espacio entre bloques se conservan.

## Detector de phishing

El código está en `src/lib/analyzer/`, la página en `src/components/pages/Analyzer.astro` y las explicaciones en `src/content/analyzer/`. No tiene servidor. La página pide texto, enlaces, remitente y cabeceras, y devuelve señales con su evidencia y una explicación. Nunca devuelve un veredicto: el cierre fijo es «Sin señales no significa seguro».

- **Entrada.** Un mensaje pegado, enlaces sueltos, el remitente y, en un apartado plegado, las cabeceras de «Mostrar original». `clipboard.ts` lee el `text/html` del evento `paste` con `DOMParser` para saber a dónde lleva cada enlace, y ese HTML no se inserta nunca. Con un `ClipboardEvent` sintético funciona en Chrome. Falta anotar qué clientes de correo conservan los `href` al copiar (Gmail, Outlook, Apple Mail y las aplicaciones móviles). Un `.eml` suelto, los adjuntos y la captura con OCR quedan fuera por ahora.
- **Garantía.** El texto se pinta con `textContent`, el HTML del portapapeles solo se lee, los enlaces salen con la dirección alterada (`hxxps://dominio[.]com`) y nada del mensaje se pide por red. `safety.test.ts` falla si un archivo de `src/lib/analyzer` o una página del analizador usa `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, `set:html`, `srcdoc`, `fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `EventSource` o `new Image`.
- **Límites.** `limits.ts` fija 200 000 caracteres de entrada, 200 enlaces y 2 048 caracteres por enlace. Fija también 100 000 caracteres y 200 campos para las cabeceras, y 10 s por análisis. El análisis se ejecuta en un Web Worker que se termina al pasar el tiempo. El worker aísla un fallo y no es la garantía de seguridad.
- **CSP.** `scripts/csp.mjs`, enganchado en `postbuild`, añade un `<meta http-equiv="Content-Security-Policy">` a las dos páginas del analizador con el hash de cada `<script>` en línea. `security.csp` de Astro 7.3 no sirve para esto: no hashea los `<script is:inline>` del sitio y se aplica a todas las páginas. El build falla si algún script en línea queda sin hash. La política permite los hosts de Google Analytics, así que no impide que un script inyectado envíe datos a ellos. Esa garantía la dan las reglas de arriba. `style-src` lleva `'unsafe-inline'` porque los atributos `style` no se pueden hashear.
- **Señales.** Cada código está en `codes.json` con su apartado y su gravedad, tiene un título en `analyzer-es.ts` y `analyzer-en.ts`, y pertenece a una explicación en `src/content/analyzer/<familia>/{es,en}.mdx`. `content.test.ts` exige un título por código, una sola explicación por código y los mismos códigos y fuentes en los dos idiomas. Para añadir una señal, cree el código, escriba la regla, el título en los dos idiomas y súmela a una explicación o cree una.
- **Listas** (`src/lib/analyzer/data/`, revisadas el 2026-10-04). `suffixes.ts` es un recorte de la Public Suffix List con los sufijos de segundo nivel de Latinoamérica y de algunos países de Europa y Asia, más los alojamientos gratuitos. Si falta un sufijo, el dominio registrable sale mal. `brands.ts` reúne marcas globales y las más suplantadas en Costa Rica. Solo sirve para comparar nombres, sin logotipos, y cada marca lleva sus dominios legítimos. Un dominio legítimo que falte da un falso positivo. `RISKY_TLDS` en `tlds.ts` es una estimación a partir de informes públicos de reputación de dominios (Spamhaus señala `.top`). No es una clasificación oficial.
- **Texto.** Las frases de `phrases.ts` están en español y en inglés, sin tildes, y se buscan en el texto sin tildes (`foldText`). La señal de texto es débil y la frase aparece en la evidencia. `message.test.ts` comprueba 20 mensajes legítimos que no deben dar señales medias ni altas y 10 de phishing con las señales esperadas. Es una red contra regresiones y no una medida de exactitud.
- **Cabeceras.** Solo el `Authentication-Results` más alto se toma como resultado. El RFC 8601 obliga a cada servidor a quitar los externos, así que los demás pueden ser falsos. Si hay varios, `hdr-auth-untrusted` lo avisa. Una firma DKIM se lee, no se verifica: verificarla exige red.
- **Comprobación en el navegador.** Pegue un `ClipboardEvent` sintético con `text/html`, use el ejemplo y abra la pestaña de red. La única petición durante el análisis es la del propio worker. El ejemplo se genera en memoria con una marca ficticia, a partir de `sample` en `analyzer-es.ts` y `analyzer-en.ts`. Por eso el sitio no aloja archivos con forma de malware.

## Marcas y logos

Los logos de herramientas están en `src/lib/brands.ts` y los de las organizaciones en `src/components/OrgMark.astro`. **Los dos se generan y no se editan a mano.** Los generadores están en `design/`, que **no forma parte de este repositorio**: es material de trabajo del rediseño y contiene arte de marca de los clientes. Lo que se versiona son las salidas, incluidos los PNG enmascarados de `public/img/brand/`.

Las marcas de herramientas salen de simple-icons, con licencia CC0. La de Playwright es de la versión 12, anterior a su retirada por motivos de marca registrada.

Son cuatro marcas de organización: Intercargo, Kaizen, Star Cargo y la UTN. Star Cargo publica un SVG que se puede recolorear, y las otras tres se enmascaran con CSS a partir de un PNG.

Una cadena de stack sin marca no rompe nada, porque se muestra como un chip de texto. `src/lib/stack.ts` asocia las cadenas de las fichas a las marcas, con alias para los nombres largos.

## Piezas para redes

`social/` es el generador de los carruseles, las publicaciones y los reels de Instagram que llevan al blog. Es un paquete de Node aparte (npm y `ffmpeg-static`), no entra en el build y tiene su propio `README.md` con todas las reglas.

Dos cosas de esa carpeta no se versionan: los kits de personajes de Freepik y Storyset, que se pueden usar pero no redistribuir, y el plan de la cuenta, `social/docs/plan.md`.

## Despliegue

El sitio se despliega en Vercel como salida estática. `vercel.json` fija:

- `cleanUrls`, para que `/es/contacto` resuelva a `es/contacto.html` de forma determinista con `build.format: 'file'`.
- **Dos 307 desde la raíz**: a `/en` cuando `Accept-Language` empieza por `en`, y a `/es` en el resto de casos. Astro también emite una página de redirección con `meta refresh`, que es lo que hace funcionar `pnpm preview` y cualquier alojamiento que no sea Vercel. En producción manda la redirección del borde y esa página no se sirve. Es 307 y no 308 a propósito: el navegador guarda un 308 para siempre, y el destino de la raíz es una decisión que puede cambiar.
- **Un 307 de `/ig` a `/es/blog`** con `utm_source=instagram&utm_medium=social&utm_campaign=bio`. Es el enlace de la biografía de Instagram, y es 307 por el mismo motivo que la raíz: el destino puede pasar a ser el artículo más reciente sin tocar el perfil. El canonical del blog no lleva los parámetros, así que no se indexan.
- Un año de caché inmutable para `/_astro/*`, cuyos nombres llevan hash, y una semana para `/img/` y el favicon.
- `X-Content-Type-Options`, `Referrer-Policy` y `X-Frame-Options` en todas las respuestas.

Vercel sirve `404.html` sin ninguna configuración.

`.vercelignore` deja fuera `design/`, `social/`, `.secrets/`, `.claude/` y `laboratorios/`. La CLI de Vercel no lee `.gitignore`, y sin ese archivo un `vercel --prod` desde esta máquina subiría el material de trabajo, el arte de los clientes y los tokens de despliegue.

## Rendimiento

Seis cosas que es fácil volver a romper:

- **`<Analytics />` y `<SpeedInsights />` van en el `<body>`, no en el `<head>`.** `<Analytics />` emite `<vercel-analytics>`, y el parser da por terminada la cabecera al encontrar un elemento desconocido dentro de ella. Con el componente arriba, las hojas de estilo que Astro añade después se analizaban dentro del `<body>`. `<SpeedInsights />` emite `<vercel-speed-insights>` y tiene el mismo problema.
- **Los dos escriben `data-pathname` con el sufijo `.html`**, porque `build.format` es `file` y `Astro.url.pathname` lo incluye. Sin corregirlo, la ruta que reportan y la que derivan de ella nombran una URL que el sitio nunca sirve. Un script en línea justo debajo de los dos elementos recorta el sufijo mientras se analiza la página. Se ejecuta cuando los elementos ya existen y antes de que sus módulos diferidos los conviertan en componentes.
- **La etiqueta de GA4 sí va en el `<head>`, y eso no contradice lo anterior.** El problema de la cabecera era el elemento desconocido, no la posición, y `<script>` es un elemento de cabecera legítimo. El cuerpo del `gtag` se arma en el front matter y se inyecta con `set:html`, como las `@font-face` y el JSON-LD, porque dentro de una expresión del template las llaves del script se leerían como JSX. Además va detrás de `import.meta.env.PROD`, que es verdadero en cualquier `astro build`, así que las previsualizaciones y `pnpm preview` también miden. Si algún día ese ruido estorba, la condición más estricta es `process.env.VERCEL_ENV === 'production'`.
- **`?notrack=1` excluye las visitas propias de las dos analíticas, y `?notrack=0` lo deshace.** La marca se guarda en `localStorage`, así que vale por navegador. La lee un script en línea que va en el `<head>` justo antes de gtag.js, porque `ga-disable-<ID>` solo tiene efecto si se fija antes de que la etiqueta cargue. Ese mismo script define `webAnalyticsBeforeSend`, que el componente de Vercel lee al inicializarse; devolver `null` ahí cancela el envío. Se arma en el front matter y se inyecta con `set:html`, igual que el cuerpo del `gtag`, porque con `define:vars` `astro check` no reconoce la variable dentro del script.
- **Las `@font-face` se declaran en `Layout.astro`, no se importan de Fontsource.** Sus paquetes *variable* publican una sola hoja con los once subconjuntos, y aquí solo se usa el latino. Declararlas permite además precargarlas. El nombre con hash solo se conoce a través de `?url`, y usar ese mismo valor en el `preload` y en la `@font-face` garantiza que el navegador no descargue el archivo dos veces.
- **`assetsInlineLimit` es una función.** El `0` estaba para que las fuentes y las imágenes no acabaran en base64, pero también desactivaba el CSS en línea, y hojas de 310 B se pedían por separado. La función expresa exactamente esa intención: `false` para los assets y el umbral por defecto para el CSS.

## Datos estructurados

Cada página indexable emite **un solo** `<script type="application/ld+json">` con un `@graph`. Con varios habría que repetir la `Person` en cada página, que es lo que un `@id` estable evita, o referenciar `@id` entre scripts, que no se puede validar pegando un solo bloque en la prueba de Google.

Las entidades duraderas llevan `@id` fijo: `#person`, `#website` y un `#org-<marca>` por organización. Así `/es` y `/en` describen **la misma persona** en vez de dos. La `Person` va completa en la portada y en «Sobre mí», y reducida en el resto. Un nodo descrito en parte con el mismo `@id` es JSON-LD idiomático, y `sameAs`, el campo que reconcilia la entidad, se queda también en la versión corta. `alternateName` declara la forma corta del nombre, «Alex Herrera», que es la que la gente teclea y la que comparten muchos homónimos, sin cambiar el `<title>`.

Las fichas llevan `CreativeWork` y no `Article`. El contrato de front matter no tiene fecha de publicación, y sacarla de `period` sería inventarla: `period` es cuándo ocurrió el trabajo, que es lo que significa `temporalCoverage`. `Article` trata `datePublished` como obligatoria, así que sin ella solo se gana un aviso permanente en Search Console.

El resultado enriquecido que sí aparece es `BreadcrumbList`, y no depende del tipo. Es lo que muestra `alexherrera.dev › Proyectos › …` bajo el resultado, y ahí las fichas tienen la atribución que sus títulos no llevan a propósito.

Los artículos sí llevan `TechArticle`, y por el motivo contrario: `published` está en el contrato, así que `datePublished` y `dateModified` se afirman con un dato real. El índice del blog emite un `ItemList` con los artículos publicados.

Solo se afirma lo que es cierto. Las certificaciones en curso no entran en `hasCredential`, `ORG_LINKS` empieza vacío porque un `sameAs` sin verificar desambigua la entidad equivocada, y no hay `potentialAction: SearchAction` porque el sitio no tiene buscador.

## Descubrimiento

Además del sitemap, los `hreflang` y el grafo de datos estructurados, hay tres piezas pensadas para que a un artículo se llegue desde fuera.

**Directivas de fragmento.** Cada página indexable emite `max-snippet:-1, max-image-preview:large, max-video-preview:-1`. Sin ellas, un buscador recorta la cita a unas 160 letras y la vista previa a una miniatura, y de esa cita depende que un panel de respuestas use el artículo o lo ignore. Las páginas `noindex` siguen emitiendo solo `noindex, follow`.

**Rastreadores de IA nombrados.** `robots.txt` ya los permitía por el comodín, pero ahora aparecen uno por uno: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User, Claude-SearchBot, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, meta-externalagent y CCBot. El comodín no dice nada sobre la intención, y varios de estos rastreadores se comprueban por nombre.

**`/llms.txt`.** Es un índice en Markdown en la raíz, generado desde el contenido: quién es el autor, qué hay en el sitio y una línea por artículo y por ficha con su dirección, su área y su stack. Sigue la convención de [llmstxt.org](https://llmstxt.org). **Es una propuesta, no un estándar, y ningún proveedor garantiza que la lea.** Se queda porque es un archivo generado que no hay que mantener a mano. Lo que sigue influyendo en los resultados es lo de siempre: un `<title>` y una descripción que digan la verdad, HTML semántico y el grafo de datos estructurados.

## Dominio

El origen está declarado una sola vez, en `site-url.mjs`: `https://www.alexherrera.dev`, el dominio propio. Canonical, `hreflang`, Open Graph y sitemap salen de ahí sin tocar nada más, porque `src/lib/site.ts` lee el `site` que Astro ya resolvió. `PUBLIC_SITE_URL` sobrescribe ese valor por si un build tiene que apuntar a otro origen, como una vista previa o una prueba local. Por eso mismo, si queda definida en el entorno Production de Vercel, se impone sobre el dominio propio, y ahí no debe estar.

`x-default` apunta a la misma página en el idioma por defecto, como `/es/proyectos/<slug>` para una ficha. No apunta a la portada ni a la raíz: la raíz redirige, y `hreflang` tiene que apuntar a una URL final e indexable. Cuando un artículo traduce su segmento de URL, cada `hreflang` toma la dirección de su idioma del `path` de ese idioma.

El sitemap lleva `<lastmod>`, que `scripts/lastmod.mjs` saca de git y escribe en `src/lib/lastmod.json`. La fecha de cada página sale de **todo lo que esa página renderiza**, no solo de su plantilla: la portada y el índice de proyectos dependen del árbol de contenido, y las cuatro páginas fijas dependen de los diccionarios de i18n. Una fecha más antigua que el cambio real no es un fallo inocuo, porque Google deja de usar `lastmod` en todo el sitemap cuando no le cuadra.

El archivo **se versiona**. Vercel clona en superficie, y allí `git log` da el commit de la frontera y no el real, así que `prebuild` detecta el clon superficial y no reescribe el archivo. El JSON va siempre un commit por detrás, porque no puede contener la fecha del commit que lo lleva. Esa es la dirección segura: una fecha nunca más nueva que el cambio real. Si tras un build el árbol queda con cambios, ejecute `pnpm lastmod` y confirme el archivo.

Los PDF del CV llevan `X-Robots-Tag: noindex`. Se siguen enlazando y descargando, pero no compiten con la propia web en una búsqueda por el nombre ni exponen el correo y la dirección a los rastreadores.

Las tarjetas Open Graph se generan **en el build**, como endpoint estático (`src/pages/img/og/[...route].png.ts`), una por página y por idioma. La URL de la tarjeta reproduce la de la página, como `/img/og/es/proyectos/<slug>.png`, porque se construye con el mismo `path()` que produce los canonical. La lista que enumera las rutas es la misma que rellena los metadatos, así que una tarjeta no puede faltar ni quedar obsoleta. Antes eran dos archivos versionados y regenerados a mano. Una tarjeta hecha con el título y el área de una ficha tiene que cambiar con esa ficha, y treinta y seis binarios regenerados a mano dejan de coincidir con su ficha.

La tarjeta lleva el tono del área del proyecto en la regla superior y en los chips. Lee los tokens de `src/app.css` en tiempo de build, para no tener una segunda copia de la paleta. El tema claro sale del primer bloque `:root`, y el oscuro, del bloque `:root[data-theme='dark']`, no del que está dentro de la media query. **La tarjeta no imprime el dominio**, para que un cambio de dominio no la deje con un dato falso: la atribuye el nombre. Las tarjetas del blog van en oscuro, para que un enlace compartido se vea como las portadas de Instagram, y el resto del sitio comparte en claro.

Las fuentes vienen de `scripts/fonts/` (Geist estática, OFL). Van ahí y no del paquete de Fontsource porque este publica solo `woff2`, y la base de fuentes de resvg no lo lee; antes, las tarjetas salían en Segoe UI. `pnpm og` ya no dibuja tarjetas, solo los iconos, que nunca dependieron del contenido.
