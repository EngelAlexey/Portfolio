# Portafolio — Alex Herrera Manzanares

Sitio estático bilingüe construido con Astro 7: español bajo `/es`, inglés bajo `/en`, y la raíz redirigiendo a `/es`. No hay servidor en producción: `pnpm build` deja HTML en `dist/`.

No hay integración de framework de UI, y para lo que este sitio hace no hace falta ninguna. Lo que sí embarca son unos kilobytes de script propio: el conmutador de tema, la retícula de herramientas y el diagrama de capas mueven un atributo que el CSS resuelve —el filtro de proyectos, en cambio, hace el trabajo entero en JavaScript— y `@vercel/analytics` añade su propio módulo en todas las páginas. Sin JavaScript el sitio sigue siendo legible: el tema sigue al sistema, los filtros muestran todo y el diagrama enseña su primera capa.

## Comandos

```bash
pnpm dev        # desarrollo
pnpm build      # build estático; falla si algún front matter rompe el contrato
pnpm preview    # sirve dist/ tal cual se publicará
pnpm check      # astro check (TypeScript strict)
pnpm sync:cv    # copia los PDFs del CV desde D:/GitHub/Personal/CV
```

`prebuild` ejecuta `sync:cv` automáticamente: copia los seis PDF (ciberseguridad · desarrollo · general, en dos idiomas) desde el repo del CV a `public/cv/`. Distingue dos situaciones:

- **El repo del CV no está en esta máquina** —un servidor de despliegue, un clon nuevo—: avisa y sigue, confiando en los PDF versionados. Por eso los PDF **sí se versionan**.
- **El repo está pero falta un PDF**: el build falla. Esa es la avería que el script existe para evitar: la versión anterior solo avisaba, los nombres de origen habían cambiado, y el sitio sirvió un PDF viejo durante semanas.

## Rutas

Los dos árboles son espejo, cada segmento en su idioma. La tabla de `src/lib/i18n/index.ts` es la única fuente: de ahí salen la navegación, el cambio de idioma, los `hreflang` y el sitemap.

| | Español | Inglés |
|---|---|---|
| Portada | `/es` | `/en` |
| Proyectos | `/es/proyectos` | `/en/projects` |
| Ficha | `/es/proyectos/<slug>` | `/en/projects/<slug>` |
| Sobre mí | `/es/sobre-mi` | `/en/about` |
| Contacto | `/es/contacto` | `/en/contact` |

`/` es una redirección a `/es`, declarada en `astro.config.mjs`. Con salida estática Astro la emite como página real, así que no hace falta configurar el servidor.

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
title: Kaizen AI
tagline: Una línea, 10–180 caracteres.
areas: [ia, seguridad]          # 1 a 3 de la taxonomía
kind: profesional               # profesional | academico | personal
org: Kaizen Apps CR             # o null
role: Desarrollo                # o null
period:
  start: '2024'                 # YYYY o YYYY-MM
  end: null                     # null = sigue en curso
tier: ficha                     # ficha = página propia; tarjeta = solo tarjeta corta
home: true                      # destacado en la portada (máximo 4 en todo el sitio)
visibility: privado             # publico | privado
repo: null                      # obligatorio null si visibility es privado
site: null                      # URL pública del producto, si la tiene
stack: [Next.js, TypeScript]
cover: null                     # ruta bajo /img/ o null
order: 1                        # opcional; sin él ordena por fecha, más reciente primero
---
```

Reglas que el build hace cumplir:

- `slug` en minúsculas y guiones, y debe coincidir con el nombre de la carpeta.
- `areas` solo acepta `fullstack · ia · datos · movil · seguridad · infra`, entre una y tres.
- Un proyecto `privado` **no puede** enlazar repositorio: el código es del cliente. Sí puede enlazar `site` cuando el producto es una web pública que cualquiera puede escribir en la barra de direcciones. La auditoría de privacidad es un fallo de build, no una lista que alguien recuerda repasar.
- Solo una `ficha` puede ir destacada, y como máximo 4 en todo el sitio.
- `period.end` no puede ser anterior a `period.start`.
- `cover`, si existe, empieza por `/img/`.
- Si existe `es.md` debe existir `en.md`, y al revés.

El cuerpo sigue siempre la misma estructura: **Contexto → Problema → Decisiones técnicas → Arquitectura → Resultado → Lo que aprendí**. Los proyectos privados no llevan capturas, así que la sección de arquitectura carga con el peso.

`ArchDiagram.astro` dibuja una tubería con una compuerta: una etapa donde se aplican varias reglas a la vez. Los datos van en el campo `diagram` del front matter —`nodes` de 2 a 6, `gate` señalando cuál de ellos es la compuerta, y de 2 a 4 `layers`— y el cuerpo lo coloca con `<ArchDiagram {...frontmatter.diagram} />`; eso exige que el archivo sea `.mdx` en vez de `.md`, y **el build falla si un `.md` declara `diagram`**, para que nunca se pierda en silencio.

## Estructura

| Ruta | Qué hay |
|---|---|
| `src/content.config.ts` | el contrato de front matter |
| `src/lib/content.ts` | carga, valida y ordena el contenido en build |
| `src/lib/areas.ts` | taxonomía de las 6 áreas |
| `src/lib/i18n/index.ts` | tabla de rutas ES↔EN — la usan la navegación, el cambio de idioma, `hreflang` y el sitemap |
| `src/lib/site.ts` | `SITE_URL`, contacto, rutas del CV |
| `src/components/pages/` | las páginas reales; `src/pages/` solo las monta en cada idioma |
| `src/layouts/Layout.astro` | el armazón HTML, y el script que aplica el tema antes del primer pintado |
| `src/app.css` | tokens de diseño |

## Diseño

El color es semántico: una tonalidad **siempre** significa un área y nunca decora. Todo lo demás es tinta sobre papel, así que las seis etiquetas de área son lo único que resalta en la retícula. Cada etiqueta lleva texto además de color.

Los tokens viven en `src/app.css` en OKLCH: `:root` define el tema claro completo, y `@media (prefers-color-scheme: dark)` junto a `[data-theme="dark"]` redefinen solo los tokens. El script de `Layout.astro` aplica el tema guardado antes del primer pintado, así el cambio no parpadea.

## Marcas y logos

Los logos de herramientas viven en `src/lib/brands.ts` (marcas de simple-icons, CC0) y los de las empresas en `src/components/OrgMark.astro`. **Ambos se generan**, no se editan a mano — la fuente está en `design/`:

```bash
cd design
node emit-brands.mjs      # regenera src/lib/brands.ts desde el catálogo
node emit-orgmark.mjs     # regenera OrgMark.astro con los tres logos de empresa
node check.mjs            # avisa de herramientas del catálogo sin marca
```

Todos los logos se pintan en tinta, nunca en color de marca: en este sitio una tonalidad solo significa un área. Inter Cargo solo publica un PNG a color, así que se enmascara con CSS en lugar de colocarse como imagen. `design/` es material de trabajo del rediseño; no entra en el build.

Añadir una herramienta: edítala en `design/catalog.mjs`, corre `emit-brands.mjs`, y aparece en la retícula filtrable. Los strings de stack de las fichas se mapean a esas marcas en `src/lib/stack.ts` (con alias para los nombres largos).

**Aviso**: `emit-brands.mjs` lee los trazos de `design/brand-library.json`, que hoy contiene exactamente las marcas que el sitio ya usa. `simple-icons` no está instalado, así que añadir una herramienta nueva exige traer su `path` a ese archivo primero; el emisor avisa por consola de las que se queden sin marca. Un string de stack sin marca no rompe nada: cae a un chip de texto.

## Dominio

`SITE_URL` sale de `PUBLIC_SITE_URL`, con el subdominio de Vercel como valor por defecto (`src/lib/site.ts`). Al comprar el dominio propio basta con definir esa variable en Vercel: canonical, `hreflang`, Open Graph y sitemap se recalculan solos.
