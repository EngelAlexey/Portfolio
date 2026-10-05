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

## Contraste de SchemaFlow

Una regla de CSS con un nombre de clase repetido dejó el texto de un botón del mismo color que su fondo y ninguna prueba lo detectó. `contraste.js` recorre los botones, enlaces y opciones visibles de `.sf`, `.sf-overlay` y de cualquier `<dialog open>`, calcula la razón de contraste WCAG de cada texto contra su fondo real y devuelve en JSON los que no llegan a 4,5 (3 en texto grande).

1. Abra `/es/herramientas/schemaflow?notrack=1` en el servidor de desarrollo.
2. Pegue el contenido de `contraste.js` en la consola, o páselo a la herramienta de JavaScript de Chrome.
3. Repita con el otro tema, usando el conmutador del sitio y esperando unos 300 ms a que acaben las transiciones. Cambiar `data-theme` desde un script da lecturas a medias.
4. Repita con cada diálogo abierto (plantillas, exportar, migración) y con el estado vacío visible.
5. Para el ancho de móvil, cargue la página en un iframe de 390 px del mismo origen y ejecute el script dentro de su ventana.

El resultado esperado es `"failed":0`. Cada fallo trae el control, el texto y la razón medida.

## Detector de phishing

La garantía es que el mensaje se lee y se analiza, y que nada de él se ejecuta, se dibuja ni se pide por red. Se comprueba así.

1. `pnpm test`: `safety.test.ts` busca sumideros de HTML y de red en `src/lib/analyzer` y en las páginas del analizador, y `content.test.ts` comprueba que cada código tenga título y una explicación en los dos idiomas.
2. Abra `/es/herramientas/phishing?notrack=1` y pulse «Usar ejemplo». Deben salir 10 señales y la lista «Qué hacer ahora».
3. Pegue un `ClipboardEvent` sintético con `text/html` en el cuadro del mensaje: `new ClipboardEvent('paste', { clipboardData })` con un `DataTransfer` que lleve `<a href="https://evil.example/login">www.paypal.com</a>`. Debe salir `link-text-mismatch`. Un evento sintético no inserta el texto, así que asigne el `value` a mano.
4. Abra la pestaña de red, vacíela y vuelva a pulsar el ejemplo. La única petición es la del archivo del worker.
5. Compile con `.astro/` como destino (un `astro.config.mjs` temporal con `outDir: './.astro/csp-dist'`), ejecute `node scripts/csp.mjs .astro/csp-dist` y sirva esa carpeta con `python -m http.server`. Abra `analizador.html?notrack=1`: el ejemplo, las explicaciones y el menú deben funcionar sin avisos de CSP en la consola. Borre la carpeta y detenga el servidor al terminar.

El perfil de Chrome es compartido con otras sesiones, y alguna fija `notrack=1`, que oculta el aviso de cookies. `resize_window` no cambia `innerWidth`: para el ancho de móvil, cargue la página en un iframe de 390 px.

## Veracidad

Cada cifra se contrasta contra el texto extraído del paper, no contra un resumen de búsqueda. Los PDF se extraen con `pymupdf` (`pdftoppm` no está instalado). Los DOI devuelven 403 a curl por el muro del editor: comprobar con `curl -sI` que el 302 apunta al sitio correcto.

Salida no ASCII en Windows: `export PYTHONIOENCODING=utf-8` antes de cualquier script de Python.
