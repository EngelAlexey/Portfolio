# Portafolio — Alex Herrera Manzanares

Sitio estático bilingüe (español en la raíz, inglés bajo `/en`) construido con SvelteKit 2, Svelte 5 y `adapter-static`. No hay servidor en producción: `pnpm build` deja HTML en `build/`.

## Comandos

```bash
pnpm dev        # desarrollo
pnpm build      # build estático; falla si algún front matter rompe el contrato
pnpm preview    # sirve build/ tal cual se publicará
pnpm check      # svelte-check (TypeScript strict)
pnpm sync:cv    # copia los PDFs del CV desde D:/GitHub/Personal/CV
```

`prebuild` ejecuta `sync:cv` automáticamente. En Vercel esa carpeta no existe, el script lo avisa y sigue — por eso los PDF de `static/cv/` **sí se versionan**.

## Añadir un proyecto

Cada proyecto es una carpeta con las dos versiones de idioma. Las dos son obligatorias:

```
src/content/projects/<slug>/
├─ es.md
└─ en.md
```

El front matter lo valida Zod (`src/lib/schema.ts`) **en el build**. Si algo está mal, `pnpm build` falla diciendo archivo y campo, en vez de publicar una ficha rota.

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
demo: null                      # obligatorio null si visibility es privado
stack: [Next.js, TypeScript]
cover: null                     # ruta bajo /img/ o null
order: 1                        # opcional; sin él ordena por fecha, más reciente primero
---
```

Reglas que el build hace cumplir:

- `areas` solo acepta `fullstack · ia · datos · movil · seguridad · infra`.
- Un proyecto `privado` **no puede** enlazar repositorio ni demo. La auditoría de privacidad es un fallo de build, no una lista que alguien recuerda repasar.
- El `slug` del front matter debe coincidir con la carpeta.
- Si existe `es.md` debe existir `en.md`, y al revés.
- Como máximo 4 proyectos con `home: true`.

El cuerpo sigue siempre la misma estructura: **Contexto → Problema → Decisiones técnicas → Arquitectura → Resultado → Lo que aprendí**. Los proyectos privados no llevan capturas, así que la sección de arquitectura carga con el peso: se usa `ArchDiagram.svelte` con un SVG inline que hereda los colores del tema.

## Estructura

| Ruta | Qué hay |
|---|---|
| `src/lib/schema.ts` | el contrato de front matter |
| `src/lib/content.ts` | carga, valida y ordena el contenido en build |
| `src/lib/areas.ts` | taxonomía de las 6 áreas |
| `src/lib/i18n/index.ts` | tabla de rutas ES↔EN — la usan la navegación, el cambio de idioma, `hreflang` y el sitemap |
| `src/lib/site.ts` | `SITE_URL`, contacto, rutas del CV |
| `src/lib/pages/` | las páginas reales; `src/routes/` solo las monta en cada idioma |
| `src/app.css` | tokens de diseño |

## Diseño

El color es semántico: una tonalidad **siempre** significa un área y nunca decora. Todo lo demás es tinta sobre papel, así que las seis etiquetas de área son lo único que resalta en la retícula. Cada etiqueta lleva texto además de color.

Los tokens viven en `src/app.css` en OKLCH: `:root` define el tema claro completo, y `@media (prefers-color-scheme: dark)` junto a `[data-theme="dark"]` redefinen solo los tokens. Un script en `src/app.html` aplica el tema guardado antes del primer pintado, así el cambio no parpadea.

## Dominio

`SITE_URL` sale de `PUBLIC_SITE_URL`, con el subdominio de Vercel como valor por defecto (`src/lib/site.ts`). Al comprar el dominio propio basta con definir esa variable en Vercel: canonical, `hreflang`, Open Graph y sitemap se recalculan solos.
