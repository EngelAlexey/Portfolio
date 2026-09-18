---
name: verify
description: Cómo se comprueba un artículo o un cambio de este portafolio contra el sitio en ejecución.
---

# Verificar en este repositorio

Sitio Astro estático y bilingüe. La superficie es el servidor de desarrollo, no los tests.

## Levantar

```bash
npm run dev            # si ya hay uno, imprime el puerto y sale (astro dev status)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:<puerto>/es/blog/<slug>
```

`npm run build` sirve para una sola cosa: comprobar que un borrador **no** aparece en `dist/`.

## Contrato del cargador (`src/lib/articles.ts`)

- `draft`, `published` y `related` deben coincidir entre `es.mdx` y `en.mdx` o el build falla.
- `slug` es el nombre de la carpeta. `path: null` en `es.mdx`, ruta propia en `en.mdx`.
- `visible = !draft || !import.meta.env.PROD`: un borrador **sí** sale en el índice del servidor de desarrollo y **no** en el build. Verlo en `/es/blog` durante el desarrollo no es un fallo.
- El esquema Zod limita `tagline` a 180 caracteres.

## Comprobaciones de un artículo

```bash
# integridad de citas: n coincide con la posición del array, ids sin duplicar
python .claude/skills/verify/citas.py src/content/articles/<slug>/es.mdx

# el borrador no está en el build
npm run build && grep -rl "<slug>" dist/ ; echo "[vacío = correcto]"
```

En el HTML servido: cada `href="#ref-N"` tiene su `id="ref-N"`, cada `<Cite>` sin `repeat` deja un `id="cite-N"` único, y las flechas de vuelta apuntan a él. Un `n` equivocado no lo detecta nada en el build.

## Veracidad

Cada cifra se contrasta contra el texto extraído del paper, no contra un resumen de búsqueda. Los PDF se extraen con `pymupdf` (`pdftoppm` no está instalado). Los DOI devuelven 403 a curl por el muro del editor: comprobar con `curl -sI` que el 302 apunta al sitio correcto.

Salida no ASCII en Windows: `export PYTHONIOENCODING=utf-8` antes de cualquier script de Python.
